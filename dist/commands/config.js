"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const discord_js_1 = require("discord.js");
const guildConfigRepo_1 = require("../config/guildConfigRepo");
const permissions_1 = require("../core/permissions");
const mentions_1 = require("../core/formatters/mentions");
function formatRoles(ids) {
    if (!ids?.length)
        return "미설정";
    return ids.map((id) => (0, mentions_1.formatRole)(id)).join(", ");
}
function formatUsersList(ids) {
    if (!ids?.length)
        return "미설정";
    return ids.map((id) => (0, mentions_1.formatUser)(id)).join(", ");
}
function formatSeconds(ms) {
    return `${Math.max(0, Math.round((ms || 0) / 1000))}초`;
}
module.exports = {
    data: new discord_js_1.SlashCommandBuilder()
        .setName("config")
        .setDescription("봇 관리 권한 및 기본 채널 설정")
        .addSubcommand((sub) => sub
        .setName("set-intro")
        .setDescription("자기소개 채널/역할 설정 (add=부여, remove=제거)")
        .addChannelOption((option) => option
        .setName("channel")
        .setDescription("자기소개 채널")
        .setRequired(true)
        .addChannelTypes(discord_js_1.ChannelType.GuildText))
        .addRoleOption((option) => option.setName("role").setDescription("역할").setRequired(true))
        .addStringOption((option) => option
        .setName("mode")
        .setDescription("역할 동작")
        .setRequired(false)
        .addChoices({ name: "add (역할 부여)", value: "add" }, { name: "remove (역할 제거)", value: "remove" })))
        .addSubcommand((sub) => sub
        .setName("allow-command-role")
        .setDescription("봇 커맨드 사용 허용 역할 추가")
        .addRoleOption((option) => option.setName("role").setDescription("허용 역할").setRequired(true)))
        .addSubcommand((sub) => sub
        .setName("remove-command-role")
        .setDescription("봇 커맨드 사용 허용 역할 제거")
        .addRoleOption((option) => option.setName("role").setDescription("허용 역할").setRequired(true)))
        .addSubcommand((sub) => sub
        .setName("allow-command-user")
        .setDescription("봇 커맨드 사용 허용 유저 추가")
        .addUserOption((option) => option.setName("user").setDescription("허용 유저").setRequired(true)))
        .addSubcommand((sub) => sub
        .setName("remove-command-user")
        .setDescription("봇 커맨드 사용 허용 유저 제거")
        .addUserOption((option) => option.setName("user").setDescription("허용 유저").setRequired(true)))
        .addSubcommand((sub) => sub.setName("show").setDescription("현재 설정 보기"))
        .addSubcommand((sub) => sub
        .setName("clear")
        .setDescription("특정 설정만 초기화")
        .addStringOption((option) => option
        .setName("field")
        .setDescription("초기화 항목")
        .setRequired(true)
        .addChoices({ name: "intro_channel", value: "intro_channel" }, { name: "intro_add_role", value: "intro_add_role" }, { name: "intro_remove_role", value: "intro_remove_role" }, { name: "command_roles", value: "command_roles" }, { name: "command_users", value: "command_users" })))
        .addSubcommand((sub) => sub.setName("reset").setDescription("모든 설정 초기화")),
    async execute(interaction) {
        if (!interaction.inGuild()) {
            await interaction.reply({
                content: "이 명령은 서버에서만 사용할 수 있어요.",
                ephemeral: true,
            });
            return;
        }
        const guild = interaction.guild;
        const guildId = guild.id;
        const config = (0, guildConfigRepo_1.getConfig)(guildId);
        const hasAdmin = interaction.memberPermissions?.has(discord_js_1.PermissionsBitField.Flags.ManageGuild);
        const allowed = (0, permissions_1.canManageCommands)(interaction.member, interaction.user.id, config || {}, Boolean(hasAdmin));
        if (!allowed) {
            await interaction.reply({
                content: "이 명령을 사용하려면 서버 관리 권한 또는 허용된 역할이 필요해요.",
                ephemeral: true,
            });
            return;
        }
        const sub = interaction.options.getSubcommand();
        if (sub === "set-intro") {
            const channel = interaction.options.getChannel("channel", true);
            const role = interaction.options.getRole("role", true);
            const mode = interaction.options.getString("mode");
            (0, guildConfigRepo_1.setIntro)(guildId, channel.id, role.id, mode || "add");
            await interaction.reply({
                content: `자기소개 채널 ${(0, mentions_1.formatChannel)(channel.id)}, 역할 ${(0, mentions_1.formatRole)(role.id)}, mode=${mode || "add"} 로 설정했어요.`,
                ephemeral: true,
            });
            return;
        }
        if (sub === "allow-command-role") {
            if (!hasAdmin) {
                await interaction.reply({
                    content: "허용 역할 설정은 서버 관리 권한이 필요해요.",
                    ephemeral: true,
                });
                return;
            }
            const role = interaction.options.getRole("role", true);
            (0, guildConfigRepo_1.addCommandRole)(guildId, role.id);
            await interaction.reply({
                content: `커맨드 허용 역할에 ${(0, mentions_1.formatRole)(role.id)}를 추가했어요.`,
                ephemeral: true,
            });
            return;
        }
        if (sub === "allow-command-user") {
            if (!hasAdmin) {
                await interaction.reply({
                    content: "허용 유저 설정은 서버 관리 권한이 필요해요.",
                    ephemeral: true,
                });
                return;
            }
            const user = interaction.options.getUser("user", true);
            (0, guildConfigRepo_1.addCommandUser)(guildId, user.id);
            await interaction.reply({
                content: `커맨드 허용 유저에 ${(0, mentions_1.formatUser)(user.id)}를 추가했어요.`,
                ephemeral: true,
            });
            return;
        }
        if (sub === "remove-command-user") {
            if (!hasAdmin) {
                await interaction.reply({
                    content: "허용 유저 설정은 서버 관리 권한이 필요해요.",
                    ephemeral: true,
                });
                return;
            }
            const user = interaction.options.getUser("user", true);
            (0, guildConfigRepo_1.removeCommandUser)(guildId, user.id);
            await interaction.reply({
                content: `커맨드 허용 유저에서 ${(0, mentions_1.formatUser)(user.id)}를 제거했어요.`,
                ephemeral: true,
            });
            return;
        }
        if (sub === "remove-command-role") {
            if (!hasAdmin) {
                await interaction.reply({
                    content: "허용 역할 설정은 서버 관리 권한이 필요해요.",
                    ephemeral: true,
                });
                return;
            }
            const role = interaction.options.getRole("role", true);
            (0, guildConfigRepo_1.removeCommandRole)(guildId, role.id);
            await interaction.reply({
                content: `커맨드 허용 역할에서 ${(0, mentions_1.formatRole)(role.id)}를 제거했어요.`,
                ephemeral: true,
            });
            return;
        }
        if (sub === "show") {
            const current = (0, guildConfigRepo_1.getConfig)(guildId);
            if (!current) {
                await interaction.reply({
                    content: "현재 설정이 없습니다. 먼저 /config 명령으로 설정해주세요.",
                    ephemeral: true,
                });
                return;
            }
            const lines = [
                `- intro_channel: ${(0, mentions_1.formatChannel)(current.intro_channel_id)}`,
                `- intro_add_role: ${(0, mentions_1.formatRole)(current.intro_add_role_id)}`,
                `- intro_remove_role: ${(0, mentions_1.formatRole)(current.intro_remove_role_id)}`,
                `- command_roles: ${formatRoles(current.command_role_ids)}`,
                `- command_users: ${formatUsersList(current.command_user_ids)}`,
            ];
            await interaction.reply({
                content: `현재 설정\n${lines.join("\n")}`,
                ephemeral: true,
            });
            return;
        }
        if (sub === "clear") {
            const field = interaction.options.getString("field", true);
            const ok = (0, guildConfigRepo_1.clearField)(guildId, field);
            if (!ok) {
                await interaction.reply({
                    content: "알 수 없는 설정 항목이에요.",
                    ephemeral: true,
                });
                return;
            }
            await interaction.reply({
                content: `설정 항목 ${field} 을(를) 초기화했어요.`,
                ephemeral: true,
            });
            return;
        }
        if (sub === "reset") {
            (0, guildConfigRepo_1.resetConfig)(guildId);
            await interaction.reply({
                content: "모든 설정을 초기화했어요.",
                ephemeral: true,
            });
        }
    },
};
