"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
require("dotenv/config");
const node_fs_1 = __importDefault(require("node:fs"));
const node_path_1 = __importDefault(require("node:path"));
const discord_js_1 = require("discord.js");
const token = process.env.DISCORD_TOKEN;
const clientId = process.env.CLIENT_ID;
const guildId = process.env.GUILD_ID;
if (!token || !clientId) {
    console.error("Missing DISCORD_TOKEN or CLIENT_ID in environment.");
    process.exit(1);
}
const commands = [];
const commandsPath = node_path_1.default.join(__dirname, "commands");
for (const file of node_fs_1.default.readdirSync(commandsPath)) {
    if (!file.endsWith(".js"))
        continue;
    const command = require(node_path_1.default.join(commandsPath, file));
    if (!command?.data)
        continue;
    commands.push(command.data.toJSON());
}
const rest = new discord_js_1.REST({ version: "10" }).setToken(token);
async function register() {
    if (guildId) {
        await rest.put(discord_js_1.Routes.applicationGuildCommands(clientId, guildId), {
            body: commands,
        });
        console.log(`Registered guild commands for ${guildId}.`);
    }
    else {
        await rest.put(discord_js_1.Routes.applicationCommands(clientId), { body: commands });
        console.log("Registered global commands.");
    }
}
register().catch((error) => {
    console.error("Failed to register commands:", error);
    process.exit(1);
});
