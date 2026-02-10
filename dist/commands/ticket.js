"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const discord_js_1 = require("discord.js");
const guildConfigRepo_1 = require("../config/guildConfigRepo");
const ticketService = require("../tickets/ticketService");
const permissions_1 = require("../core/permissions");
const mentions_1 = require("../core/formatters/mentions");
function formatRoles(ids) {
    if (!ids?.length)
        return "미설정";
    return ids.map((id) => (0, mentions_1.formatRole)(id)).join(", ");
}
function formatUsers(ids) {
    if (!ids?.length)
        return "미설정";
    return ids.map((id) => (0, mentions_1.formatUser)(id)).join(", ");
}
function formatChannel(id) {
    return id ? `<#${id}>` : "미설정";
}
function isSupport(interaction, config) {
    if (config?.ticket_support_user_ids?.includes(interaction.user.id))
        return true;
    if (!config?.ticket_support_role_ids?.length)
        return false;
    const roleCache = interaction.member?.roles?.cache;
    return roleCache?.some((role) => config.ticket_support_role_ids.includes(role.id));
}
async function isThreadParticipant(interaction) {
    if (!interaction.channel?.isThread?.())
        return false;
    try {
        const member = await interaction.channel.members.fetch(interaction.user.id).catch(() => null);
        return Boolean(member);
    }
    catch {
        return false;
    }
}
module.exports = {
    data: new discord_js_1.SlashCommandBuilder()
        .setName("ticket")
        .setDescription("티켓 설정/관리")
        .addSubcommand((sub) => sub.setName("show").setDescription("현재 티켓 설정 보기"))
        .addSubcommand((sub) => sub.setName("panel").setDescription("이 채널에 티켓 생성 버튼(패널 메시지) 올리기"))
        .addSubcommand((sub) => sub
        .setName("set-category")
        .setDescription("티켓을 정리할 카테고리(기본값) 설정")
        .addChannelOption((option) => option
        .setName("category")
        .setDescription("카테고리")
        .setRequired(true)
        .addChannelTypes(discord_js_1.ChannelType.GuildCategory)))
        .addSubcommand((sub) => sub
        .setName("set-transcripts")
        .setDescription("티켓 종료 로그(트랜스크립트) 받을 채널 설정")
        .addChannelOption((option) => option
        .setName("channel")
        .setDescription("전송 채널")
        .setRequired(true)
        .addChannelTypes(discord_js_1.ChannelType.GuildText)))
        .addSubcommand((sub) => sub
        .setName("add-support-role")
        .setDescription("지원팀 역할 추가(티켓 스레드에 초대)")
        .addRoleOption((option) => option.setName("role").setDescription("역할").setRequired(true)))
        .addSubcommand((sub) => sub
        .setName("remove-support-role")
        .setDescription("지원팀 역할 제거")
        .addRoleOption((option) => option.setName("role").setDescription("역할").setRequired(true)))
        .addSubcommand((sub) => sub
        .setName("add-support-user")
        .setDescription("지원팀 유저 추가(티켓 스레드에 초대)")
        .addUserOption((option) => option.setName("user").setDescription("유저").setRequired(true)))
        .addSubcommand((sub) => sub
        .setName("remove-support-user")
        .setDescription("지원팀 유저 제거")
        .addUserOption((option) => option.setName("user").setDescription("유저").setRequired(true)))
        .addSubcommand((sub) => sub
        .setName("close")
        .setDescription("이 티켓 스레드 닫기(잠금/아카이브)")
        .addStringOption((option) => option.setName("reason").setDescription("사유(선택)")))
        .addSubcommand((sub) => sub.setName("claim").setDescription("이 티켓 담당하기(클레임)"))
        .addSubcommand((sub) => sub.setName("unclaim").setDescription("담당 해제하기(언클레임)"))
        .addSubcommand((sub) => sub
        .setName("transfer")
        .setDescription("담당자를 다른 스태프로 넘기기(transfer)")
        .addUserOption((option) => option.setName("user").setDescription("대상").setRequired(true)))
        .addSubcommand((sub) => sub
        .setName("add")
        .setDescription("이 티켓에 유저 초대하기")
        .addUserOption((option) => option.setName("user").setDescription("유저").setRequired(true)))
        .addSubcommand((sub) => sub
        .setName("remove")
        .setDescription("이 티켓에서 유저 내보내기")
        .addUserOption((option) => option.setName("user").setDescription("유저").setRequired(true))),
    async execute(interaction) {
        if (!interaction.inGuild()) {
            await interaction.reply({
                content: "이 명령은 서버에서만 사용할 수 있어요.",
                flags: discord_js_1.MessageFlags.Ephemeral,
            });
            return;
        }
        const guild = interaction.guild;
        const guildId = guild.id;
        const config = (0, guildConfigRepo_1.getConfig)(guildId);
        const sub = interaction.options.getSubcommand();
        const hasAdmin = interaction.memberPermissions?.has(discord_js_1.PermissionsBitField.Flags.ManageGuild);
        const canManage = (0, permissions_1.canManageCommands)(interaction.member, interaction.user.id, config || {}, Boolean(hasAdmin));
        if ([
            "show",
            "panel",
            "set-category",
            "set-transcripts",
            "add-support-role",
            "remove-support-role",
            "add-support-user",
            "remove-support-user",
        ].includes(sub)) {
            if (!canManage) {
                await interaction.reply({
                    content: "이 작업은 관리자 또는 허용된 권한이 필요해요.",
                    flags: discord_js_1.MessageFlags.Ephemeral,
                });
                return;
            }
        }
        if (sub === "show") {
            const current = (0, guildConfigRepo_1.getConfig)(guildId) || {};
            const lines = [
                `- ticket_channel: ${formatChannel(current.ticket_channel_id)}`,
                `- ticket_panel_message_id: ${current.ticket_panel_message_id || "미설정"}`,
                `- ticket_category: ${formatChannel(current.ticket_category_id)}`,
                `- ticket_transcripts: ${formatChannel(current.ticket_transcript_channel_id)}`,
                `- support_roles: ${formatRoles(current.ticket_support_role_ids)}`,
                `- support_users: ${formatUsers(current.ticket_support_user_ids)}`,
            ];
            await interaction.reply({
                content: `현재 티켓 설정\n${lines.join("\n")}`,
                flags: discord_js_1.MessageFlags.Ephemeral,
            });
            return;
        }
        if (sub === "panel") {
            const channel = interaction.channel;
            if (!channel || !channel.isTextBased() || channel.isDMBased?.()) {
                await interaction.reply({
                    content: "텍스트 채널에서만 사용할 수 있어요.",
                    flags: discord_js_1.MessageFlags.Ephemeral,
                });
                return;
            }
            const panel = await ticketService.postTicketPanel(channel);
            (0, guildConfigRepo_1.setTicketChannel)(guildId, channel.id);
            (0, guildConfigRepo_1.setTicketPanelMessage)(guildId, panel.id);
            await interaction.reply({
                content: "티켓 패널을 게시했어요.",
                flags: discord_js_1.MessageFlags.Ephemeral,
            });
            return;
        }
        if (sub === "set-category") {
            const category = interaction.options.getChannel("category", true);
            (0, guildConfigRepo_1.setTicketCategory)(guildId, category.id);
            await interaction.reply({
                content: `티켓 카테고리를 ${category}로 설정했어요.`,
                flags: discord_js_1.MessageFlags.Ephemeral,
            });
            return;
        }
        if (sub === "set-transcripts") {
            const channel = interaction.options.getChannel("channel", true);
            (0, guildConfigRepo_1.setTicketTranscriptChannel)(guildId, channel.id);
            await interaction.reply({
                content: `트랜스크립트 채널을 ${channel}로 설정했어요.`,
                flags: discord_js_1.MessageFlags.Ephemeral,
            });
            return;
        }
        if (sub === "add-support-role") {
            const role = interaction.options.getRole("role", true);
            (0, guildConfigRepo_1.addTicketSupportRole)(guildId, role.id);
            await interaction.reply({
                content: `티켓 지원 역할에 ${(0, mentions_1.formatRole)(role.id)}를 추가했어요.`,
                flags: discord_js_1.MessageFlags.Ephemeral,
            });
            return;
        }
        if (sub === "remove-support-role") {
            const role = interaction.options.getRole("role", true);
            (0, guildConfigRepo_1.removeTicketSupportRole)(guildId, role.id);
            await interaction.reply({
                content: `티켓 지원 역할에서 ${(0, mentions_1.formatRole)(role.id)}를 제거했어요.`,
                flags: discord_js_1.MessageFlags.Ephemeral,
            });
            return;
        }
        if (sub === "add-support-user") {
            const user = interaction.options.getUser("user", true);
            (0, guildConfigRepo_1.addTicketRecipient)(guildId, user.id);
            await interaction.reply({
                content: `티켓 지원 유저에 ${(0, mentions_1.formatUser)(user.id)}를 추가했어요.`,
                flags: discord_js_1.MessageFlags.Ephemeral,
            });
            return;
        }
        if (sub === "remove-support-user") {
            const user = interaction.options.getUser("user", true);
            (0, guildConfigRepo_1.removeTicketRecipient)(guildId, user.id);
            await interaction.reply({
                content: `티켓 지원 유저에서 ${(0, mentions_1.formatUser)(user.id)}를 제거했어요.`,
                flags: discord_js_1.MessageFlags.Ephemeral,
            });
            return;
        }
        const ticket = ticketService.getOpenTicketByChannel(guildId, interaction.channel.id);
        if (!ticket) {
            await interaction.reply({
                content: "이 채널은 티켓 채널이 아니에요.",
                flags: discord_js_1.MessageFlags.Ephemeral,
            });
            return;
        }
        const canSupport = isSupport(interaction, config);
        const isOpener = ticket.opener_id === interaction.user.id;
        if (sub === "close") {
            const isParticipant = await isThreadParticipant(interaction);
            if (!canSupport && !isOpener && !isParticipant) {
                await interaction.reply({
                    content: "티켓을 닫을 권한이 없어요.",
                    flags: discord_js_1.MessageFlags.Ephemeral,
                });
                return;
            }
            const reason = interaction.options.getString("reason") || null;
            ticketService.closeTicketSession(ticket.id, interaction.user.id, reason);
            ticketService.touchTicket(ticket.id);
            await interaction.reply({
                content: "티켓을 닫았어요. (버튼 닫기와 동일하게 처리됩니다)",
                flags: discord_js_1.MessageFlags.Ephemeral,
            });
            return;
        }
        if (sub === "claim") {
            if (!canSupport) {
                await interaction.reply({
                    content: "지원팀만 클레임할 수 있어요.",
                    flags: discord_js_1.MessageFlags.Ephemeral,
                });
                return;
            }
            ticketService.setTicketClaim(ticket.id, interaction.user.id);
            await interaction.reply({
                content: `이 티켓을 ${(0, mentions_1.formatUser)(interaction.user.id)}가 클레임했어요.`,
            });
            return;
        }
        if (sub === "unclaim") {
            if (!canSupport) {
                await interaction.reply({
                    content: "지원팀만 언클레임할 수 있어요.",
                    flags: discord_js_1.MessageFlags.Ephemeral,
                });
                return;
            }
            ticketService.setTicketClaim(ticket.id, null);
            await interaction.reply({
                content: "클레임이 해제되었어요.",
            });
            return;
        }
        if (sub === "transfer") {
            if (!canSupport) {
                await interaction.reply({
                    content: "지원팀만 transfer를 사용할 수 있어요.",
                    flags: discord_js_1.MessageFlags.Ephemeral,
                });
                return;
            }
            const user = interaction.options.getUser("user", true);
            ticketService.setTicketClaim(ticket.id, user.id);
            await interaction.reply({
                content: `클레임을 ${(0, mentions_1.formatUser)(user.id)}에게 전달했어요.`,
            });
            return;
        }
        if (sub === "add" || sub === "remove") {
            if (!canSupport && !isOpener) {
                await interaction.reply({
                    content: "이 작업을 할 권한이 없어요.",
                    flags: discord_js_1.MessageFlags.Ephemeral,
                });
                return;
            }
            const user = interaction.options.getUser("user", true);
            try {
                if (interaction.channel?.isThread?.()) {
                    if (sub === "add") {
                        await interaction.channel.members.add(user.id);
                    }
                    else {
                        await interaction.channel.members.remove(user.id);
                    }
                }
                else if ("permissionOverwrites" in interaction.channel) {
                    await interaction.channel.permissionOverwrites.edit(user.id, {
                        ViewChannel: sub === "add",
                        SendMessages: sub === "add",
                        ReadMessageHistory: sub === "add",
                    });
                }
            }
            catch {
                await interaction.reply({
                    content: "권한 변경에 실패했어요.",
                    flags: discord_js_1.MessageFlags.Ephemeral,
                });
                return;
            }
            await interaction.reply({
                content: sub === "add"
                    ? `티켓에 ${(0, mentions_1.formatUser)(user.id)}를 추가했어요.`
                    : `티켓에서 ${(0, mentions_1.formatUser)(user.id)}를 제거했어요.`,
            });
        }
    },
};
