import { Client, TextChannel, EmbedBuilder } from "discord.js";
import { TornApiClient } from "@torn/api";
import { getChainAlertLevel, formatChainTime, ChainAlertLevel } from "@torn/shared";
import { prisma } from "@torn/db";

export class ChainWatchdog {
  private client: Client;
  private tornApi: TornApiClient;
  private isRunning: boolean = false;
  private lastAlertLevel: ChainAlertLevel = "NORMAL";
  private pollIntervalMs: number = 4000; // 4 seconds default

  constructor(client: Client, tornApi: TornApiClient) {
    this.client = client;
    this.tornApi = tornApi;
  }

  public start(): void {
    if (this.isRunning) return;
    this.isRunning = true;
    console.log("[ChainWatchdog] Started real-time chain monitor.");
    this.pollLoop();
  }

  public stop(): void {
    this.isRunning = false;
  }

  private async pollLoop(): Promise<void> {
    while (this.isRunning) {
      try {
        await this.checkChain();
      } catch (err) {
        console.error("[ChainWatchdog] Error polling chain:", (err as Error).message);
      }
      await new Promise((r) => setTimeout(r, this.pollIntervalMs));
    }
  }

  private async checkChain(): Promise<void> {
    // Check all configured factions
    const configs = await prisma.factionConfig.findMany({
      where: { chainChannelId: { not: null } },
    });

    for (const config of configs) {
      if (!config.chainChannelId) continue;

      try {
        const chain = await this.tornApi.getChainStatus(config.id);
        if (!chain || chain.current === 0) {
          this.lastAlertLevel = "NORMAL";
          continue;
        }

        const alertLevel = getChainAlertLevel(chain.timeout);

        // Only alert if we transitioned to a new or escalated alert level
        if (alertLevel !== this.lastAlertLevel && alertLevel !== "NORMAL") {
          this.lastAlertLevel = alertLevel;
          await this.sendChainAlert(config, chain.current, chain.timeout, alertLevel);
        } else if (alertLevel === "NORMAL") {
          this.lastAlertLevel = "NORMAL";
        }
      } catch {
        // Handled silently to prevent poller crash
      }
    }
  }

  private async sendChainAlert(
    config: { chainChannelId: string | null; chainAlertRoleId: string | null },
    currentChain: number,
    timeout: number,
    level: ChainAlertLevel
  ): Promise<void> {
    if (!config.chainChannelId) return;

    try {
      const channel = (await this.client.channels.fetch(config.chainChannelId)) as TextChannel;
      if (!channel) return;

      const timeStr = formatChainTime(timeout);
      let color = 0x22c55e; // Green
      let title = "⏱️ Chain Status Update";
      let ping = "";

      if (level === "WARNING_120") {
        color = 0xeab308; // Yellow
        title = "⚠️ Chain Timer Warning (< 2 mins)";
      } else if (level === "HIGH_60") {
        color = 0xf97316; // Orange
        title = "🚨 Chain Urgent Alert (< 60s)";
        if (config.chainAlertRoleId) ping = `<@&${config.chainAlertRoleId}> `;
      } else if (level === "EMERGENCY_30") {
        color = 0xef4444; // Red
        title = "🔥 CRITICAL: CHAIN DROPPING (< 30s) — HIT NOW!";
        if (config.chainAlertRoleId) ping = `<@&${config.chainAlertRoleId}> `;
      }

      const embed = new EmbedBuilder()
        .setTitle(title)
        .setColor(color)
        .addFields(
          { name: "Current Chain", value: `${currentChain}`, inline: true },
          { name: "Time Remaining", value: `⏳ **${timeStr}**`, inline: true }
        )
        .setTimestamp();

      await channel.send({ content: ping || undefined, embeds: [embed] });
    } catch (err) {
      console.error("[ChainWatchdog] Failed to send Discord alert:", (err as Error).message);
    }
  }
}
