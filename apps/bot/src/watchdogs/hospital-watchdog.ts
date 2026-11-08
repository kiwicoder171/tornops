import { Client, TextChannel, EmbedBuilder } from "discord.js";
import { TornApiClient } from "@torn/api";
import {
  getDirectAttackUrl,
  estimateBattleStats,
  formatStatNumber,
  formatArmorChip,
  calculateEffectiveMitigation,
  evaluateWeaponThreats,
  type DefenderLoadout,
} from "@torn/shared";
import { prisma } from "@torn/db";

export class HospitalWatchdog {
  private client: Client;
  private tornApi: TornApiClient;
  private isRunning: boolean = false;
  private pollIntervalMs: number = 8000; // 8 seconds

  constructor(client: Client, tornApi: TornApiClient) {
    this.client = client;
    this.tornApi = tornApi;
  }

  public start(): void {
    if (this.isRunning) return;
    this.isRunning = true;
    console.log("[HospitalWatchdog] Started hospital callout watchdog.");
    this.pollLoop();
  }

  public stop(): void {
    this.isRunning = false;
  }

  private async pollLoop(): Promise<void> {
    while (this.isRunning) {
      try {
        await this.checkEnemyHospital();
      } catch (err) {
        console.error("[HospitalWatchdog] Error polling hospital:", (err as Error).message);
      }
      await new Promise((r) => setTimeout(r, this.pollIntervalMs));
    }
  }

  private async checkEnemyHospital(): Promise<void> {
    const activeWars = await prisma.warRecord.findMany({
      where: { status: "ACTIVE" },
      include: { faction: true },
    });

    for (const war of activeWars) {
      if (!war.faction.hospChannelId) continue;

      const enemies = await prisma.enemyWatch.findMany({
        where: { factionId: war.opponentFactionId },
      });

      const now = new Date();

      for (const enemy of enemies) {
        if (enemy.hospitalUntil && enemy.hospitalUntil <= now) {
          // Target just exited hospital!
          await this.sendHospitalCallout(war.faction, enemy);

          // Update record to prevent duplicate notification
          await prisma.enemyWatch.update({
            where: { id: enemy.id },
            data: { hospitalUntil: null, lastAction: "Okay" },
          });
        }
      }
    }
  }

  private async sendHospitalCallout(
    config: { hospChannelId: string | null; hospAlertRoleId: string | null },
    enemy: {
      id: number;
      name: string;
      level: number;
      estimatedStats: string | null;
      priority: number;
      armorSet?: string | null;
      weaponBonuses?: string | null;
      loadoutJson?: string | null;
    }
  ): Promise<void> {
    if (!config.hospChannelId) return;

    try {
      const channel = (await this.client.channels.fetch(config.hospChannelId)) as TextChannel;
      if (!channel) return;

      const attackUrl = getDirectAttackUrl(enemy.id);
      const ping = config.hospAlertRoleId ? `<@&${config.hospAlertRoleId}> ` : "";

      // Parse or resolve loadout
      let parsedLoadout: DefenderLoadout | null = null;
      if (enemy.loadoutJson) {
        try {
          parsedLoadout = JSON.parse(enemy.loadoutJson);
        } catch {
          // Ignore JSON parse errors
        }
      }

      // Calculate mitigation and missing slot vulnerability
      let armorText = enemy.armorSet ? formatArmorChip(enemy.armorSet) : "🛡️ Standard Combat";
      let vulnText = "";
      if (parsedLoadout) {
        const mit = calculateEffectiveMitigation(parsedLoadout);
        armorText = formatArmorChip(parsedLoadout);
        const criticalVuln = mit.vulnerabilities.find((v) => v.severity === "CRITICAL" || v.severity === "HIGH");
        if (criticalVuln) {
          vulnText = `\n⚠️ *${criticalVuln.description}*`;
        }
      } else if (!enemy.armorSet) {
        armorText = "🛡️ Unverified / Standard";
      }

      // Parse weapon threat assessment
      let weaponText = "Standard Weapons";
      let hasExecute = false;

      if (parsedLoadout?.weapons) {
        const threats = evaluateWeaponThreats(parsedLoadout.weapons);
        if (threats.alertBadges.length > 0) {
          weaponText = threats.alertBadges.join(" | ");
        }
        hasExecute = threats.hasExecute;
      } else if (enemy.weaponBonuses) {
        weaponText = enemy.weaponBonuses;
        if (enemy.weaponBonuses.toLowerCase().includes("execute")) {
          hasExecute = true;
        }
      }

      // Battle stat calculation if estimatedStats missing
      let statDisplay = enemy.estimatedStats;
      if (!statDisplay) {
        const algoEst = estimateBattleStats(enemy.level);
        statDisplay = `~${formatStatNumber(algoEst.pointEstimate)} (${algoEst.badge})`;
      }

      // Determine embed theme color based on threat
      let embedColor = 0xef4444; // Default Red
      if (hasExecute) {
        embedColor = 0xff7700; // Warning Orange for Execute
      } else if (enemy.priority >= 2) {
        embedColor = 0xa855f7; // Purple for high-value targets
      } else if (enemy.level <= 15) {
        embedColor = 0x22c55e; // Emerald for easy targets
      }

      const embed = new EmbedBuilder()
        .setTitle(`🎯 TARGET OUT OF HOSPITAL: ${enemy.name}`)
        .setColor(embedColor)
        .setDescription(`Enemy target **${enemy.name}** [${enemy.id}] has discharged from the hospital!`)
        .addFields(
          { name: "Level", value: `${enemy.level}`, inline: true },
          { name: "Est. Battle Stats", value: statDisplay, inline: true },
          { name: "Priority", value: enemy.priority >= 2 ? "⭐ High Value" : "Standard", inline: true },
          { name: "🛡️ Defender Armor", value: `${armorText}${vulnText}`, inline: true },
          { name: "⚔️ RW Weapon Bonuses", value: weaponText, inline: true },
          { name: "One-Click Attack", value: `[👉 Attack in Torn](${attackUrl})`, inline: false }
        )
        .setTimestamp();

      await channel.send({ content: ping || undefined, embeds: [embed] });
    } catch (err) {
      console.error("[HospitalWatchdog] Failed to send Discord callout:", (err as Error).message);
    }
  }
}
