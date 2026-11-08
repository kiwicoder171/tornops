import {
  ChatInputCommandInteraction,
  SlashCommandBuilder,
  EmbedBuilder,
  PermissionFlagsBits,
} from "discord.js";
import { prisma } from "@torn/db";
import { TornApiClient, encryptApiKey, maskApiKey } from "@torn/api";
import { formatChainTime, getDirectAttackUrl, BALDR_TARGETS, formatArmorChip } from "@torn/shared";


export const slashCommandsData = [
  new SlashCommandBuilder()
    .setName("setup")
    .setDescription("Configure Faction Operations channels and alert roles")
    .setDefaultMemberPermissions(PermissionFlagsBits.Administrator)
    .addIntegerOption((opt) => opt.setName("faction_id").setDescription("Your Torn Faction ID").setRequired(true))
    .addChannelOption((opt) => opt.setName("chain_channel").setDescription("Channel for chain timer alerts"))
    .addChannelOption((opt) => opt.setName("hospital_channel").setDescription("Channel for hospital callouts"))
    .addChannelOption((opt) => opt.setName("war_channel").setDescription("Channel for war score announcements"))
    .addChannelOption((opt) => opt.setName("banking_channel").setDescription("Channel for withdrawal requests"))
    .addRoleOption((opt) => opt.setName("chain_role").setDescription("Role to ping on urgent chain timer (<60s)"))
    .addRoleOption((opt) => opt.setName("hosp_role").setDescription("Role to ping on high-value hospital callouts")),

  new SlashCommandBuilder()
    .setName("chain")
    .setDescription("View live chain status, timeout remaining, and hitter count"),

  new SlashCommandBuilder()
    .setName("hospital")
    .setDescription("View enemy targets currently out of the hospital for Ranked War"),

  new SlashCommandBuilder()
    .setName("balance")
    .setDescription("Check your current faction vault balance and deposit history"),

  new SlashCommandBuilder()
    .setName("withdraw")
    .setDescription("Submit a withdrawal request to the faction banker queue")
    .addIntegerOption((opt) => opt.setName("amount").setDescription("Amount in cash ($)").setRequired(true))
    .addStringOption((opt) => opt.setName("reason").setDescription("Reason for withdrawal")),

  new SlashCommandBuilder()
    .setName("targets")
    .setDescription("Search Baldr's leveling & chain targets")
    .addIntegerOption((opt) => opt.setName("min_level").setDescription("Minimum level (default 1)"))
    .addIntegerOption((opt) => opt.setName("max_level").setDescription("Maximum level (default 50)")),

  new SlashCommandBuilder()
    .setName("verify")
    .setDescription("Link your Torn account and add your Limited Key to the faction rate limit pool")
    .addStringOption((opt) =>
      opt.setName("api_key").setDescription("Your Torn Limited Access API Key (strictly read-only)").setRequired(true)
    ),

  new SlashCommandBuilder()
    .setName("todo")
    .setDescription("View or add faction/personal todo tasks")
    .addSubcommand((sub) => sub.setName("list").setDescription("List active todo tasks"))
    .addSubcommand((sub) =>
      sub
        .setName("add")
        .setDescription("Add a new task")
        .addStringOption((opt) => opt.setName("title").setDescription("Task title").setRequired(true))
        .addBooleanOption((opt) => opt.setName("faction_wide").setDescription("Is this a faction-wide task?"))
    ),
];


export async function handleCommandInteraction(
  interaction: ChatInputCommandInteraction,
  tornApi: TornApiClient
): Promise<void> {
  const { commandName } = interaction;

  // --- /setup ---
  if (commandName === "setup") {
    const factionId = interaction.options.getInteger("faction_id", true);
    const chainChannel = interaction.options.getChannel("chain_channel");
    const hospChannel = interaction.options.getChannel("hospital_channel");
    const warChannel = interaction.options.getChannel("war_channel");
    const bankChannel = interaction.options.getChannel("banking_channel");
    const chainRole = interaction.options.getRole("chain_role");
    const hospRole = interaction.options.getRole("hosp_role");

    await prisma.factionConfig.upsert({
      where: { id: factionId },
      update: {
        discordGuildId: interaction.guildId,
        chainChannelId: chainChannel?.id,
        hospChannelId: hospChannel?.id,
        warChannelId: warChannel?.id,
        bankChannelId: bankChannel?.id,
        chainAlertRoleId: chainRole?.id,
        hospAlertRoleId: hospRole?.id,
      },
      create: {
        id: factionId,
        name: `Faction #${factionId}`,
        discordGuildId: interaction.guildId,
        chainChannelId: chainChannel?.id,
        hospChannelId: hospChannel?.id,
        warChannelId: warChannel?.id,
        bankChannelId: bankChannel?.id,
        chainAlertRoleId: chainRole?.id,
        hospAlertRoleId: hospRole?.id,
      },
    });

    await interaction.reply({
      content: `✅ Successfully configured Faction **#${factionId}** operations channels and roles!`,
      ephemeral: true,
    });
    return;
  }

  // --- /chain ---
  if (commandName === "chain") {
    await interaction.deferReply();
    try {
      const config = await prisma.factionConfig.findFirst({
        where: { discordGuildId: interaction.guildId },
      });

      const chain = await tornApi.getChainStatus(config?.id);
      if (!chain || chain.current === 0) {
        await interaction.editReply("💤 No active chain currently running for the faction.");
        return;
      }

      const timeStr = formatChainTime(chain.timeout);
      const embed = new EmbedBuilder()
        .setTitle(`⛓️ Active Faction Chain: ${chain.current} / ${chain.max}`)
        .setColor(chain.timeout <= 60 ? 0xef4444 : 0x22c55e)
        .addFields(
          { name: "Time Left", value: `⏳ **${timeStr}**`, inline: true },
          { name: "Multiplier", value: `x${chain.modifier}`, inline: true },
          { name: "Cooldown", value: `${chain.cooldown}s`, inline: true }
        )
        .setTimestamp();

      await interaction.editReply({ embeds: [embed] });
    } catch (err) {
      await interaction.editReply(`❌ Failed to retrieve chain status: ${(err as Error).message}`);
    }
    return;
  }

  // --- /hospital ---
  if (commandName === "hospital") {
    await interaction.deferReply();
    try {
      const enemies = await prisma.enemyWatch.findMany({
        where: { hospitalUntil: null },
        take: 10,
        orderBy: { priority: "desc" },
      });

      if (enemies.length === 0) {
        await interaction.editReply("🏥 All monitored enemy targets are currently hospitalized or in flight!");
        return;
      }

      const embed = new EmbedBuilder()
        .setTitle("🎯 Enemy Targets Available Out of Hospital")
        .setColor(0x38bdf8)
        .setDescription(
          enemies
            .map((e) => {
              const armor = formatArmorChip(e.armorSet);
              const bonuses = e.weaponBonuses ? ` | ⚔️ ${e.weaponBonuses}` : "";
              const stats = e.estimatedStats ? ` | 📊 ${e.estimatedStats}` : "";
              return `• **${e.name}** [${e.id}] (Lvl ${e.level}${stats}) | ${armor}${bonuses} - [Attack Now](${getDirectAttackUrl(e.id)})`;
            })
            .join("\n")
        );

      await interaction.editReply({ embeds: [embed] });
    } catch (err) {
      await interaction.editReply(`❌ Failed to fetch targets: ${(err as Error).message}`);
    }
    return;
  }

  // --- /balance ---
  if (commandName === "balance") {
    await interaction.deferReply({ ephemeral: true });
    const user = await prisma.user.findUnique({
      where: { discordId: interaction.user.id },
      include: { bankAccount: true },
    });

    if (!user || !user.bankAccount) {
      await interaction.editReply("❌ Your Discord account is not linked to a Torn profile yet. Visit the web dashboard to link your account!");
      return;
    }

    const balanceNum = Number(user.bankAccount.balance);
    const depositedNum = Number(user.bankAccount.totalDeposited);
    const withdrawnNum = Number(user.bankAccount.totalWithdrawn);

    const embed = new EmbedBuilder()
      .setTitle(`🏦 Vault Balance for ${user.tornUsername} [${user.tornId}]`)
      .setColor(0x10b981)
      .addFields(
        { name: "Current Balance", value: `$${balanceNum.toLocaleString()}`, inline: true },
        { name: "Total Deposited", value: `$${depositedNum.toLocaleString()}`, inline: true },
        { name: "Total Withdrawn", value: `$${withdrawnNum.toLocaleString()}`, inline: true }
      );

    await interaction.editReply({ embeds: [embed] });
    return;
  }

  // --- /withdraw ---
  if (commandName === "withdraw") {
    const amount = interaction.options.getInteger("amount", true);
    const reason = interaction.options.getString("reason") || "Member withdrawal";

    await interaction.deferReply({ ephemeral: true });

    const user = await prisma.user.findUnique({
      where: { discordId: interaction.user.id },
      include: { bankAccount: true },
    });

    if (!user || !user.bankAccount) {
      await interaction.editReply("❌ You must link your Torn profile on the web dashboard before requesting withdrawals.");
      return;
    }

    if (user.bankAccount.balance < BigInt(amount)) {
      await interaction.editReply(
        `❌ Insufficient vault balance. You have **$${Number(user.bankAccount.balance).toLocaleString()}** available.`
      );
      return;
    }

    const req = await prisma.withdrawalRequest.create({
      data: {
        userTornId: user.tornId,
        amount: BigInt(amount),
        reason,
        status: "PENDING",
      },
    });

    await interaction.editReply(
      `✅ Withdrawal request of **$${amount.toLocaleString()}** submitted (Request ID: \`${req.id.slice(0, 8)}\`). The faction banker has been queued!`
    );
    return;
  }

  // --- /targets ---
  if (commandName === "targets") {
    await interaction.deferReply();
    const minLevel = interaction.options.getInteger("min_level") || 1;
    const maxLevel = interaction.options.getInteger("max_level") || 50;

    const matching = BALDR_TARGETS.filter(
      (t) => t.level >= minLevel && t.level <= maxLevel
    ).slice(0, 6);

    if (matching.length === 0) {
      await interaction.editReply(`No leveling targets found between levels ${minLevel} and ${maxLevel}.`);
      return;
    }

    // Query live status for matching targets
    const targetsWithStatus = await Promise.all(
      matching.map(async (t) => {
        try {
          const profile = await tornApi.getUserProfile(t.id);
          return {
            ...t,
            statusState: profile.status?.state || "Unknown",
            statusDesc: profile.status?.description || "",
          };
        } catch {
          return { ...t, statusState: "Unknown", statusDesc: "" };
        }
      })
    );

    const embed = new EmbedBuilder()
      .setTitle(`⚔️ Baldr's Leveling Targets (Levels ${minLevel} - ${maxLevel})`)
      .setColor(0x8b5cf6)
      .setDescription(
        targetsWithStatus
          .map((t) => {
            const isOkay = t.statusState === "Okay";
            const isHospital = t.statusState === "Hospital";
            const isTravel = t.statusState === "Traveling" || t.statusState === "Abroad";
            const statusLabel = isOkay
              ? "🟢 **Available to Attack**"
              : isHospital
              ? `🔴 **In Hospital** (${t.statusDesc.trim()})`
              : isTravel
              ? "✈️ **Traveling Abroad**"
              : "⚪ **Inactive**";

            return `• **${t.name}** [${t.id}] - Lvl ${t.level} | ${t.totalStats.toLocaleString()} stats | 🛡️ Standard Combat\n  ${statusLabel} | [Attack Link](${getDirectAttackUrl(t.id)})`;
          })
          .join("\n\n")
      )
      .setFooter({ text: "Always choose 'Leave' after winning for 100% leveling XP!" });

    await interaction.editReply({ embeds: [embed] });
    return;
  }

  // --- /todo ---
  if (commandName === "todo") {
    const sub = interaction.options.getSubcommand();

    if (sub === "list") {
      await interaction.deferReply();
      const tasks = await prisma.todoTask.findMany({
        where: { status: { not: "DONE" } },
        take: 10,
        orderBy: { createdAt: "desc" },
      });

      if (tasks.length === 0) {
        await interaction.editReply("🎉 No active tasks on the board!");
        return;
      }

      const embed = new EmbedBuilder()
        .setTitle("📋 Faction & Member Task Board")
        .setColor(0x0284c7)
        .setDescription(
          tasks
            .map((t) => `• [${t.priority}] **${t.title}** - *${t.status}* ${t.factionWide ? "*(Faction Goal)*" : ""}`)
            .join("\n")
        );

      await interaction.editReply({ embeds: [embed] });
      return;
    }

    if (sub === "add") {
      const title = interaction.options.getString("title", true);
      const factionWide = interaction.options.getBoolean("faction_wide") || false;

      const user = await prisma.user.findUnique({
        where: { discordId: interaction.user.id },
      });

      if (!user) {
        await interaction.reply({ content: "❌ Link your account on the dashboard first.", ephemeral: true });
        return;
      }

      await prisma.todoTask.create({
        data: {
          title,
          factionWide,
          createdById: user.tornId,
          assignedToId: factionWide ? null : user.tornId,
        },
      });

      await interaction.reply({ content: `✅ Task **"${title}"** added to the board!`, ephemeral: true });
      return;
    }
  }

  // --- /verify ---
  if (commandName === "verify") {
    await interaction.deferReply({ ephemeral: true });
    const rawApiKey = interaction.options.getString("api_key", true).trim();

    try {
      const res = await fetch(`https://api.torn.com/v2/user?selections=profile,basic&key=${rawApiKey}`, {
        headers: { Accept: "application/json" },
      });

      if (!res.ok) {
        await interaction.editReply("❌ Could not connect to Torn API. Please double check your key.");
        return;
      }

      const json = (await res.json()) as {
        error?: { code: number; error: string };
        player_id?: number;
        id?: number;
        name?: string;
        faction?: { faction_id: number; faction_name: string; position: string };
      };

      if (json.error) {
        await interaction.editReply(`❌ Torn API Error [${json.error.code}]: ${json.error.error}`);
        return;
      }

      const tornId = json.player_id || json.id;
      const tornName = json.name || `Player #${tornId}`;
      const faction = json.faction;

      if (!tornId) {
        await interaction.editReply("❌ Unable to extract player ID from Torn response.");
        return;
      }

      // Upsert User record
      const isLeader = faction?.position?.toLowerCase().includes("leader") || false;
      await prisma.user.upsert({
        where: { tornId },
        update: {
          discordId: interaction.user.id,
          discordUsername: interaction.user.username,
          tornUsername: tornName,
          role: isLeader ? "LEADER" : "MEMBER",
        },
        create: {
          discordId: interaction.user.id,
          discordUsername: interaction.user.username,
          tornId,
          tornUsername: tornName,
          role: isLeader ? "LEADER" : "MEMBER",
        },
      });

      // Ensure Bank Account exists
      await prisma.bankAccount.upsert({
        where: { userTornId: tornId },
        update: {},
        create: { userTornId: tornId },
      });

      // Encrypt and store key in pool
      const encrypted = encryptApiKey(rawApiKey);
      await prisma.apiKeyPool.upsert({
        where: { id: `user-key-${tornId}` },
        update: { encryptedKey: encrypted, isActive: true },
        create: {
          id: `user-key-${tornId}`,
          encryptedKey: encrypted,
          keyType: "MEMBER",
          ownerTornId: tornId,
          factionId: faction?.faction_id || null,
        },
      });

      // Register key in live rate limiter
      tornApi.getRateLimiter().registerKey(`user-key-${tornId}`, rawApiKey, "MEMBER");

      const masked = maskApiKey(rawApiKey);
      const embed = new EmbedBuilder()
        .setTitle("✅ Verification Successful!")
        .setColor(0x10b981)
        .setDescription(`Welcome **${tornName}** [${tornId}]! Your Torn identity has been securely linked to your Discord account.`)
        .addFields(
          { name: "Faction", value: faction?.faction_name || "None", inline: true },
          { name: "Key Masked", value: `\`${masked}\``, inline: true },
          { name: "Pool Contribution", value: "+100 req/min added to faction capacity", inline: true }
        )
        .setFooter({ text: "Your key is AES-256 encrypted at rest and strictly used for read-only faction intelligence." });

      await interaction.editReply({ embeds: [embed] });
    } catch (err) {
      await interaction.editReply(`❌ Verification failed: ${(err as Error).message}`);
    }
    return;
  }
}

