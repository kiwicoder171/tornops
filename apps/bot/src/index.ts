import { Client, GatewayIntentBits, REST, Routes } from "discord.js";
import dotenv from "dotenv";
import { TornApiClient } from "@torn/api";
import { slashCommandsData, handleCommandInteraction } from "./commands/commands.js";
import { ChainWatchdog } from "./watchdogs/chain-watchdog.js";
import { HospitalWatchdog } from "./watchdogs/hospital-watchdog.js";
import { OcNudgeWatchdog } from "./watchdogs/oc-nudge-watchdog.js";
import { FundsnewsPoller } from "./watchdogs/fundsnews-poller.js";

dotenv.config();

const token = process.env.DISCORD_BOT_TOKEN;
const clientId = process.env.DISCORD_CLIENT_ID;

if (!token) {
  console.warn("⚠️ DISCORD_BOT_TOKEN not set in environment. Running in watchdog-only / offline mode.");
}

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
  ],
});

const tornApi = new TornApiClient();

// Initialize Watchdogs
const chainWatchdog = new ChainWatchdog(client, tornApi);
const hospitalWatchdog = new HospitalWatchdog(client, tornApi);
const ocNudgeWatchdog = new OcNudgeWatchdog(client);
const fundsnewsPoller = new FundsnewsPoller(tornApi);

client.once("ready", async () => {
  console.log(`🤖 Logged in as Discord bot: ${client.user?.tag}`);

  // Register slash commands if token and clientId are present
  if (token && clientId) {
    try {
      const rest = new REST({ version: "10" }).setToken(token);
      console.log("⚡ Refreshing Discord application (/) commands...");
      await rest.put(Routes.applicationCommands(clientId), {
        body: slashCommandsData.map((cmd) => cmd.toJSON()),
      });
      console.log("✅ Successfully reloaded application (/) commands.");
    } catch (err) {
      console.error("❌ Failed to reload slash commands:", (err as Error).message);
    }
  }

  // Start background watchdog daemons
  chainWatchdog.start();
  hospitalWatchdog.start();
  ocNudgeWatchdog.start();
  fundsnewsPoller.start();
});

client.on("interactionCreate", async (interaction) => {
  if (!interaction.isChatInputCommand()) return;
  try {
    await handleCommandInteraction(interaction, tornApi);
  } catch (err) {
    console.error("Error executing command:", err);
    if (interaction.replied || interaction.deferred) {
      await interaction.followUp({ content: "There was an error executing this command!", ephemeral: true });
    } else {
      await interaction.reply({ content: "There was an error executing this command!", ephemeral: true });
    }
  }
});

// Process shutdown handling
process.on("SIGINT", () => {
  console.log("\nStopping watchdogs and logging out bot...");
  chainWatchdog.stop();
  hospitalWatchdog.stop();
  ocNudgeWatchdog.stop();
  fundsnewsPoller.stop();
  client.destroy();
  process.exit(0);
});

if (token) {
  client.login(token).catch((err) => {
    console.error("Failed to login to Discord:", err.message);
  });
}
