import { Client, TextChannel } from "discord.js";
import { prisma } from "@torn/db";

export class OcNudgeWatchdog {
  private client: Client;
  private isRunning: boolean = false;
  private pollIntervalMs: number = 3600000; // 1 hour

  constructor(client: Client) {
    this.client = client;
  }

  public start(): void {
    if (this.isRunning) return;
    this.isRunning = true;
    console.log("[OcNudgeWatchdog] Started OC 2.0 invitation reminder service.");
    this.pollLoop();
  }

  public stop(): void {
    this.isRunning = false;
  }

  private async pollLoop(): Promise<void> {
    while (this.isRunning) {
      try {
        await this.checkStalledCrimes();
      } catch (err) {
        console.error("[OcNudgeWatchdog] Error checking OC invites:", (err as Error).message);
      }
      await new Promise((r) => setTimeout(r, this.pollIntervalMs));
    }
  }

  private async checkStalledCrimes(): Promise<void> {
    const stalledTeams = await prisma.organizedCrimeTeam.findMany({
      where: {
        status: "PLANNING",
        stalledHours: { gte: 4 }, // Stalled for 4+ hours
      },
    });

    for (const team of stalledTeams) {
      // Parse slot assignments to identify pending members
      try {
        const slots = JSON.parse(team.slotsJson) as Array<{
          assignedPlayerId: number;
          assignedPlayerName: string;
          status?: string;
        }>;

        for (const slot of slots) {
          if (slot.status === "PENDING" && slot.assignedPlayerId > 0) {
            // Find Discord account linked to this Torn ID
            const user = await prisma.user.findUnique({
              where: { tornId: slot.assignedPlayerId },
            });

            if (user && user.discordId) {
              await this.sendNudge(user.discordId, team.crimeName, slot.assignedPlayerName);
            }
          }
        }

        await prisma.organizedCrimeTeam.update({
          where: { id: team.id },
          data: { lastReminderAt: new Date() },
        });
      } catch {
        // Skip malformed records
      }
    }
  }

  private async sendNudge(discordId: string, crimeName: string, tornName: string): Promise<void> {
    try {
      const discordUser = await this.client.users.fetch(discordId);
      if (discordUser) {
        await discordUser.send(
          `🔔 **Torn OC 2.0 Invitation Reminder**: Hey ${tornName}, you have an unaccepted invite for **${crimeName}** that is holding up the team countdown. Please accept it in-game when you have a moment!`
        );
      }
    } catch {
      // Ignore DM errors if user has DMs closed
    }
  }
}
