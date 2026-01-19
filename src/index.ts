import "dotenv/config";
import fs from "node:fs";
import path from "node:path";
import {
  Client,
  Collection,
  GatewayIntentBits,
  Partials,
  type Interaction,
} from "discord.js";
import { getConfig } from "./config/guildConfigRepo";
import {
  TICKET_CREATE_BUTTON_ID,
  createTicketChannelTicket,
  handleTicketCloseButton,
  handleTicketClaimButton,
  purgeOldTickets,
} from "./tickets/ticketService";

const DEFAULT_TICKET_RETENTION_DAYS = 30;
const TICKET_CLEANUP_INTERVAL_MS = 24 * 60 * 60 * 1000;

function getTicketRetentionMs() {
  const raw = Number.parseInt(process.env.TICKET_RETENTION_DAYS || "", 10);
  const days = Number.isFinite(raw) && raw > 0 ? raw : DEFAULT_TICKET_RETENTION_DAYS;
  return days * 24 * 60 * 60 * 1000;
}

function startTicketCleanup() {
  const retentionMs = getTicketRetentionMs();
  const runCleanup = () => {
    try {
      const result = purgeOldTickets(retentionMs);
      if (result.sessionsDeleted || result.forwardsDeleted) {
        console.log(
          `[ticket-cleanup] sessions=${result.sessionsDeleted}, forwarded=${result.forwardsDeleted}`
        );
      }
    } catch (error) {
      console.warn("[ticket-cleanup] Failed:", error);
    }
  };
  runCleanup();
  setInterval(runCleanup, TICKET_CLEANUP_INTERVAL_MS);
}

const token = process.env.DISCORD_TOKEN;
if (!token) {
  console.error("Missing DISCORD_TOKEN in environment.");
  process.exit(1);
}

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMembers,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.GuildMessageReactions,
    GatewayIntentBits.GuildVoiceStates,
    GatewayIntentBits.DirectMessages,
    GatewayIntentBits.MessageContent,
  ],
  partials: [Partials.Channel, Partials.Message, Partials.Reaction, Partials.User],
});

client.commands = new Collection();

const commandsPath = path.join(__dirname, "commands");
for (const file of fs.readdirSync(commandsPath)) {
  if (!file.endsWith(".js")) continue;
  const command = require(path.join(commandsPath, file));
  if (!command?.data || !command?.execute) continue;
  client.commands.set(command.data.name, command);
}

const eventsPath = path.join(__dirname, "events");
for (const file of fs.readdirSync(eventsPath)) {
  if (!file.endsWith(".js")) continue;
  const event = require(path.join(eventsPath, file));
  if (!event?.name || !event?.execute) continue;
  client.on(event.name, (...args) => event.execute(...args));
}

client.on("interactionCreate", async (interaction: Interaction) => {
  if (interaction.isChatInputCommand()) {
    const command = client.commands.get(interaction.commandName);
    if (!command) return;
    try {
      await command.execute(interaction);
    } catch (error) {
      console.error("Command error:", error);
      const message = "명령 처리 중 오류가 발생했어요. 잠시 후 다시 시도해주세요.";
      if (interaction.replied || interaction.deferred) {
        await interaction.followUp({ content: message, ephemeral: true });
      } else {
        await interaction.reply({ content: message, ephemeral: true });
      }
    }
    return;
  }

  if (!interaction.isButton()) return;

  if (!interaction.inGuild()) {
    await interaction.reply({
      content: "이 버튼은 서버에서만 사용할 수 있어요.",
      ephemeral: true,
    });
    return;
  }

  if (interaction.customId === TICKET_CREATE_BUTTON_ID) {
    const config = getConfig(interaction.guild.id);
    try {
      await createTicketChannelTicket(interaction, config);
    } catch (error) {
      console.warn("[ticket-create] Failed:", error);
      const message = "티켓 생성에 실패했어요. 권한/설정을 확인해주세요.";
      if (interaction.replied || interaction.deferred) {
        await interaction.followUp({ content: message, ephemeral: true });
      } else {
        await interaction.reply({ content: message, ephemeral: true });
      }
    }
    return;
  }

  if (interaction.customId === "ticket_close") {
    await handleTicketCloseButton(interaction);
    return;
  }

  if (interaction.customId === "ticket_claim" || interaction.customId === "ticket_unclaim") {
    await handleTicketClaimButton(interaction);
    return;
  }
});

client.once("ready", () => {
  console.log(`Logged in as ${client.user?.tag}`);
  startTicketCleanup();
});

client.login(token);
