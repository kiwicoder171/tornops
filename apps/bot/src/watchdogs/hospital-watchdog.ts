import { Client, TextChannel, EmbedBuilder } from "discord.js";
import { TornApiClient } from "@torn/api";
import { getDirectAttackUrl } from "@torn/shared";
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
    enemy: { id: number; name: string; level: number; estimatedStats: string | null; priority: number }
  ): Promise<void> {
    if (!config.hospChannelId) return;

    try {
      const channel = (await this.client.channels.fetch(config.hospChannelId)) as TextChannel;
      if (!channel) return;

      const attackUrl = getDirectAttackUrl(enemy.id);
      const ping = config.hospAlertRoleId ? `<@&${config.hospAlertRoleId}> ` : "";

      const embed = new EmbedBuilder()
        .setTitle(`🎯 TARGET OUT OF HOSPITAL: ${enemy.name}`)
        .setColor(0xef4444)
        .setDescription(`Enemy target **${enemy.name}** [${enemy.id}] has discharged from the hospital!`)
        .addFields(
          { name: "Level", value: `${enemy.level}`, inline: true },
          { name: "Est. Stats", value: enemy.estimatedStats || "Unknown", inline: true },
          { name: "Priority", value: enemy.priority >= 2 ? "⭐ High Value" : "Standard", inline: true },
          { name: "One-Click Attack", value: `[👉 Attack in Torn](${attackUrl})`, inline: false }
        )
        .setTimestamp();

      await channel.send({ content: ping || undefined, embeds: [embed] });
    } catch (err) {
      console.error("[HospitalWatchdog] Failed to send Discord callout:", (err as Error).message);
    }
  }
}
