require("dotenv").config();

const fs = require("node:fs");
const path = require("node:path");
const {
  Client,
  Collection,
  GatewayIntentBits,
  Partials,
} = require("discord.js");
const { getConfig } = require("./config/guildConfigRepo");
const {
  TICKET_CREATE_BUTTON_ID,
  createTicketSession,
  closeTicketSession,
} = require("./tickets/ticketService");

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
    GatewayIntentBits.DirectMessages,
    GatewayIntentBits.MessageContent,
  ],
  partials: [Partials.Channel, Partials.Message],
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

client.on("interactionCreate", async (interaction) => {
  if (interaction.isChatInputCommand()) {
    const command = client.commands.get(interaction.commandName);
    if (!command) return;
    try {
      await command.execute(interaction);
    } catch (error) {
      console.error("Command error:", error);
      const message =
        "명령 처리 중 오류가 발생했어요. 잠시 후 다시 시도해주세요.";
      if (interaction.replied || interaction.deferred) {
        await interaction.followUp({ content: message, ephemeral: true });
      } else {
        await interaction.reply({ content: message, ephemeral: true });
      }
    }
    return;
  }

  if (!interaction.isButton()) return;
  if (interaction.customId !== TICKET_CREATE_BUTTON_ID) return;

  if (!interaction.inGuild()) {
    await interaction.reply({
      content: "이 버튼은 서버에서만 사용할 수 있어요.",
      ephemeral: true,
    });
    return;
  }

  const config = getConfig(interaction.guild.id);
  if (!config?.ticket_recipient_id) {
    await interaction.reply({
      content: "티켓 담당자가 설정되지 않았어요. 관리자에게 문의해주세요.",
      ephemeral: true,
    });
    return;
  }

  let ticketId = null;
  try {
    ticketId = createTicketSession(interaction.guild.id, interaction.user.id);
    await interaction.user.send({
      content: [
        "티켓이 생성되었습니다.",
        "이 DM에 메시지를 작성하면 담당자에게 전달됩니다.",
        "형식: 메시지: (작성 내용)",
      ].join("\n"),
    });
    await interaction.reply({
      content: "DM을 확인해주세요. 안내 메시지를 보냈어요.",
      ephemeral: true,
    });
  } catch (error) {
    console.warn("[ticket-create] Failed to start DM:", error);
    if (ticketId) {
      closeTicketSession(ticketId);
    }
    const message =
      "DM 전송에 실패했어요. DM을 허용했는지 확인한 뒤 다시 시도해주세요.";
    if (interaction.replied || interaction.deferred) {
      await interaction.followUp({ content: message, ephemeral: true });
    } else {
      await interaction.reply({ content: message, ephemeral: true });
    }
  }
});

client.once("ready", () => {
  console.log(`Logged in as ${client.user.tag}`);
});

client.login(token);
