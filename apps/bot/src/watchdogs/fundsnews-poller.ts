import { TornApiClient } from "@torn/api";
import { prisma } from "@torn/db";

export class FundsnewsPoller {
  private tornApi: TornApiClient;
  private isRunning: boolean = false;
  private pollIntervalMs: number = 60000; // 60 seconds

  constructor(tornApi: TornApiClient) {
    this.tornApi = tornApi;
  }

  public start(): void {
    if (this.isRunning) return;
    this.isRunning = true;
    console.log("[FundsnewsPoller] Started faction vault fundsnews poller.");
    this.pollLoop();
  }

  public stop(): void {
    this.isRunning = false;
  }

  private async pollLoop(): Promise<void> {
    while (this.isRunning) {
      try {
        await this.syncDeposits();
      } catch (err) {
        console.error("[FundsnewsPoller] Error polling fundsnews:", (err as Error).message);
      }
      await new Promise((r) => setTimeout(r, this.pollIntervalMs));
    }
  }

  private async syncDeposits(): Promise<void> {
    const deposits = await this.tornApi.getVaultDeposits();

    for (const dep of deposits) {
      // Check if this log entry has already been recorded
      const existing = await prisma.bankTransaction.findUnique({
        where: { tornLogId: dep.id },
      });

      if (!existing) {
        // Ensure bank account exists for user
        let account = await prisma.bankAccount.findUnique({
          where: { userTornId: dep.playerId },
        });

        if (!account) {
          // If User doesn't exist yet, we can create bank account when user registers or create placeholder
          const user = await prisma.user.findUnique({
            where: { tornId: dep.playerId },
          });

          if (user) {
            account = await prisma.bankAccount.create({
              data: {
                userTornId: dep.playerId,
                balance: BigInt(dep.amount),
                totalDeposited: BigInt(dep.amount),
              },
            });
          }
        } else {
          // Update existing account
          await prisma.bankAccount.update({
            where: { id: account.id },
            data: {
              balance: { increment: BigInt(dep.amount) },
              totalDeposited: { increment: BigInt(dep.amount) },
            },
          });
        }

        if (account) {
          await prisma.bankTransaction.create({
            data: {
              accountId: account.id,
              tornLogId: dep.id,
              type: "DEPOSIT",
              amount: BigInt(dep.amount),
              notes: `Vault deposit by ${dep.playerName}`,
            },
          });
          console.log(`[FundsnewsPoller] Credited $${dep.amount.toLocaleString()} to ${dep.playerName} [${dep.playerId}]`);
        }
      }
    }
  }
}
