"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
require("dotenv/config");
const node_fs_1 = __importDefault(require("node:fs"));
const node_path_1 = __importDefault(require("node:path"));
const discord_js_1 = require("discord.js");
const guildConfigRepo_1 = require("./config/guildConfigRepo");
const ticketService = require("./tickets/ticketService");
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
            const result = ticketService.purgeOldTickets(retentionMs);
            if (result.sessionsDeleted || result.forwardsDeleted) {
                console.log(`[ticket-cleanup] sessions=${result.sessionsDeleted}, forwarded=${result.forwardsDeleted}`);
            }
        }
        catch (error) {
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
const client = new discord_js_1.Client({
    intents: [
        discord_js_1.GatewayIntentBits.Guilds,
        discord_js_1.GatewayIntentBits.GuildMembers,
        discord_js_1.GatewayIntentBits.GuildMessages,
        discord_js_1.GatewayIntentBits.GuildMessageReactions,
        discord_js_1.GatewayIntentBits.GuildVoiceStates,
        discord_js_1.GatewayIntentBits.DirectMessages,
        discord_js_1.GatewayIntentBits.MessageContent,
    ],
    partials: [discord_js_1.Partials.Channel, discord_js_1.Partials.Message, discord_js_1.Partials.Reaction, discord_js_1.Partials.User],
});
const commands = new discord_js_1.Collection();
const commandData = [];
const commandsPath = node_path_1.default.join(__dirname, "commands");
for (const file of node_fs_1.default.readdirSync(commandsPath)) {
    if (!file.endsWith(".js"))
        continue;
    const command = require(node_path_1.default.join(commandsPath, file));
    if (command?.data?.name) {
        commands.set(command.data.name, command);
        commandData.push(command.data.toJSON());
    }
    if (command?.contextMenu?.name) {
        commands.set(command.contextMenu.name, command);
        commandData.push(command.contextMenu.toJSON());
    }
}
async function registerCommandsOnStartup() {
    if (process.env.NODE_ENV === "test")
        return;
    const clientId = process.env.CLIENT_ID;
    const guildId = process.env.GUILD_ID;
    const token = process.env.DISCORD_TOKEN;
    if (!clientId || !token) {
        console.error("[register] Missing CLIENT_ID or DISCORD_TOKEN. Skipping registration.");
        return;
    }
    const rest = new discord_js_1.REST({ version: "10" }).setToken(token);
    try {
        if (guildId) {
            await rest.put(discord_js_1.Routes.applicationGuildCommands(clientId, guildId), {
                body: commandData,
            });
            console.log(`[register] Registered guild commands for ${guildId}.`);
        }
        else {
            await rest.put(discord_js_1.Routes.applicationCommands(clientId), { body: commandData });
            console.log("[register] Registered global commands.");
        }
    }
    catch (error) {
        console.error("[register] Failed to register commands:", error);
    }
}
const eventsPath = node_path_1.default.join(__dirname, "events");
for (const file of node_fs_1.default.readdirSync(eventsPath)) {
    if (!file.endsWith(".js"))
        continue;
    const event = require(node_path_1.default.join(eventsPath, file));
    if (!event?.name || !event?.execute)
        continue;
    client.on(event.name, (...args) => event.execute(...args));
}
client.on("interactionCreate", async (interaction) => {
    if (interaction.isChatInputCommand() || interaction.isContextMenuCommand()) {
        const commandName = interaction.isChatInputCommand()
            ? interaction.commandName
            : interaction.commandName;
        const command = commands.get(commandName);
        if (!command)
            return;
        try {
            await command.execute(interaction);
        }
        catch (error) {
            console.error("Command error:", error);
            const message = "명령 처리 중 오류가 발생했어요. 잠시 후 다시 시도해주세요.";
            if (interaction.replied || interaction.deferred) {
                await interaction.followUp({ content: message, flags: discord_js_1.MessageFlags.Ephemeral });
            }
            else {
                await interaction.reply({ content: message, flags: discord_js_1.MessageFlags.Ephemeral });
            }
        }
        return;
    }
    if (interaction.isModalSubmit()) {
        if (!interaction.inGuild()) {
            try {
                await interaction.reply({
                    content: "이 작업은 서버에서만 사용할 수 있어요.",
                    flags: discord_js_1.MessageFlags.Ephemeral,
                });
            }
            catch {
                // ignore
            }
            return;
        }
        if (interaction.customId === ticketService.TICKET_CREATE_MODAL_ID) {
            const config = (0, guildConfigRepo_1.getConfig)(interaction.guild.id);
            try {
                await ticketService.handleTicketCreateModalSubmit(interaction, config);
            }
            catch (error) {
                console.warn("[ticket-create-modal] Failed:", error);
                try {
                    if (interaction.replied || interaction.deferred) {
                        await interaction.followUp({
                            content: "티켓 생성 처리 중 오류가 발생했어요.",
                            flags: discord_js_1.MessageFlags.Ephemeral,
                        });
                    }
                    else {
                        await interaction.reply({
                            content: "티켓 생성 처리 중 오류가 발생했어요.",
                            flags: discord_js_1.MessageFlags.Ephemeral,
                        });
                    }
                }
                catch {
                    // ignore
                }
            }
            return;
        }
        return;
    }
    if (!interaction.isButton())
        return;
    if (!interaction.inGuild()) {
        await interaction.reply({
            content: "이 버튼은 서버에서만 사용할 수 있어요.",
            flags: discord_js_1.MessageFlags.Ephemeral,
        });
        return;
    }
    if (interaction.customId === ticketService.TICKET_CREATE_BUTTON_ID) {
        const config = (0, guildConfigRepo_1.getConfig)(interaction.guild.id);
        try {
            await ticketService.createTicketChannelTicket(interaction, config);
        }
        catch (error) {
            console.warn("[ticket-create] Failed:", error);
            const message = "티켓 생성에 실패했어요. 권한/설정을 확인해주세요.";
            try {
                if (interaction.replied || interaction.deferred) {
                    await interaction.followUp({ content: message, flags: discord_js_1.MessageFlags.Ephemeral });
                }
                else {
                    await interaction.reply({ content: message, flags: discord_js_1.MessageFlags.Ephemeral });
                }
            }
            catch {
                // ignore (interaction may be expired/unknown)
            }
        }
        return;
    }
    if (interaction.customId === "ticket_close") {
        await ticketService.handleTicketCloseButton(interaction);
        return;
    }
    if (interaction.customId === "ticket_claim" || interaction.customId === "ticket_unclaim") {
        await ticketService.handleTicketClaimButton(interaction);
        return;
    }
});
client.once("clientReady", async () => {
    console.log(`Logged in as ${client.user?.tag}`);
    await registerCommandsOnStartup();
    startTicketCleanup();
});
client.login(token);
