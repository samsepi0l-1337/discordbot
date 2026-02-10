"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const discord_js_1 = require("discord.js");
const guildConfigRepo_1 = require("../config/guildConfigRepo");
const rrRepo_1 = require("../config/rrRepo");
const rrSettingsRepo_1 = require("../config/rrSettingsRepo");
const autoroleRepo_1 = require("../config/autoroleRepo");
const timedRoleRepo_1 = require("../config/timedRoleRepo");
const voiceRoleRepo_1 = require("../config/voiceRoleRepo");
const permissions_1 = require("../core/permissions");
const mentions_1 = require("../core/formatters/mentions");
const mentions_2 = require("../core/formatters/mentions");
const emoji_1 = require("../core/parsers/emoji");
const time_1 = require("../core/parsers/time");
function formatDelayMs(ms) {
    const safe = Math.max(0, Math.floor(ms));
    if (safe < 60000)
        return `${Math.round(safe / 1000)}초`;
    if (safe < 60 * 60000)
        return `${Math.round(safe / 60000)}분`;
    if (safe < 24 * 60 * 60000)
        return `${Math.round(safe / (60 * 60000))}시간`;
    return `${Math.round(safe / (24 * 60 * 60000))}일`;
}
async function fetchActiveMessage(interaction) {
    const guild = interaction.guild;
    let messageId = interaction.options?.getString?.("message_id");
    // 1. Check if the interaction itself is a reply (Slash Command only)
    if (!messageId && interaction.message?.id) {
        messageId = interaction.message.id;
    }
    // 2. Check if it's a Context Menu interaction
    if (!messageId && interaction.targetId) {
        messageId = interaction.targetId;
    }
    // 3. Fallback to DB active message
    if (!messageId) {
        const active = (0, rrRepo_1.getActiveMessage)(guild.id);
        if (!active?.message_id)
            return null;
        const channel = await guild.channels.fetch(active.channel_id).catch(() => null);
        if (!channel?.isTextBased())
            return null;
        const message = await channel.messages.fetch(active.message_id).catch(() => null);
        if (!message)
            return null;
        return { channel, message };
    }
    // If we have an ID (from arg, reply, or context menu), resolve the channel and message
    const active = (0, rrRepo_1.getActiveMessage)(guild.id);
    const channelId = active?.channel_id || interaction.channelId;
    const channel = await guild.channels.fetch(channelId).catch(() => null);
    if (!channel?.isTextBased())
        return null;
    const message = await channel.messages.fetch(messageId).catch(() => null);
    if (!message)
        return null;
    // For convenience, if found via reply or arg, set as active
    if (message.id !== active?.message_id) {
        (0, rrRepo_1.setActiveMessage)(guild.id, channel.id, message.id);
    }
    return { channel, message };
}
module.exports = {
    contextMenu: new discord_js_1.ContextMenuCommandBuilder()
        .setName("RR: 활성 메시지로 설정")
        .setType(discord_js_1.ApplicationCommandType.Message),
    data: new discord_js_1.SlashCommandBuilder()
        .setName("rr")
        .setDescription("Reaction Roles 관리")
        .addSubcommand((sub) => sub
        .setName("channel")
        .setDescription("활성 채널 선택")
        .addChannelOption((option) => option
        .setName("channel")
        .setDescription("대상 채널")
        .setRequired(true)
        .addChannelTypes(discord_js_1.ChannelType.GuildText)))
        .addSubcommand((sub) => sub
        .setName("message")
        .setDescription("활성 메시지 선택 (ID 미입력 시 답글 대상 사용)")
        .addStringOption((option) => option.setName("message_id").setDescription("메시지 ID (선택)").setRequired(false)))
        .addSubcommandGroup((group) => group
        .setName("add")
        .setDescription("리액션 역할 추가")
        .addSubcommand((sub) => sub
        .setName("normal")
        .setDescription("리액션 추가 시 역할 부여, 제거 시 해제")
        .addStringOption((option) => option.setName("emoji").setDescription("이모지").setRequired(true))
        .addRoleOption((option) => option.setName("role").setDescription("역할").setRequired(true)))
        .addSubcommand((sub) => sub
        .setName("once")
        .setDescription("1회성 역할 부여(리액션 제거)")
        .addStringOption((option) => option.setName("emoji").setDescription("이모지").setRequired(true))
        .addRoleOption((option) => option.setName("role").setDescription("역할").setRequired(true)))
        .addSubcommand((sub) => sub
        .setName("remove")
        .setDescription("리액션 시 역할 제거")
        .addStringOption((option) => option.setName("emoji").setDescription("이모지").setRequired(true))
        .addRoleOption((option) => option.setName("role").setDescription("역할").setRequired(true)))
        .addSubcommand((sub) => sub
        .setName("toggle")
        .setDescription("같은 그룹 내에서 하나만 선택")
        .addStringOption((option) => option.setName("emoji").setDescription("이모지").setRequired(true))
        .addRoleOption((option) => option.setName("role").setDescription("역할").setRequired(true))
        .addStringOption((option) => option
        .setName("group")
        .setDescription("토글 그룹(기본 default)")
        .setRequired(false))))
        .addSubcommand((sub) => sub
        .setName("list")
        .setDescription("리액션 역할 목록")
        .addStringOption((option) => option.setName("message_id").setDescription("특정 메시지 ID(선택)")))
        .addSubcommandGroup((group) => group
        .setName("delete")
        .setDescription("리액션 역할 삭제")
        .addSubcommand((sub) => sub
        .setName("all")
        .setDescription("메시지의 모든 리액션 역할 삭제 (ID 미입력 시 답글 대상 사용)")
        .addStringOption((option) => option.setName("message_id").setDescription("메시지 ID (선택)").setRequired(false)))
        .addSubcommand((sub) => sub
        .setName("reaction-role")
        .setDescription("메시지에서 특정 역할 삭제 (ID 미입력 시 답글 대상 사용)")
        .addRoleOption((option) => option.setName("role").setDescription("역할").setRequired(true))
        .addStringOption((option) => option.setName("message_id").setDescription("메시지 ID (선택)").setRequired(false)))
        .addSubcommand((sub) => sub
        .setName("reaction-emoji")
        .setDescription("메시지에서 특정 이모지 삭제 (ID 미입력 시 답글 대상 사용)")
        .addStringOption((option) => option.setName("emoji").setDescription("이모지").setRequired(true))
        .addStringOption((option) => option.setName("message_id").setDescription("메시지 ID (선택)").setRequired(false)))
        .addSubcommand((sub) => sub
        .setName("check")
        .setDescription("삭제된 역할 참조 정리 (ID 미입력 시 답글 대상 사용)")
        .addStringOption((option) => option.setName("message_id").setDescription("메시지 ID (선택)").setRequired(false))))
        .addSubcommandGroup((group) => group
        .setName("autorole")
        .setDescription("입장 시 역할 부여")
        .addSubcommand((sub) => sub
        .setName("add")
        .setDescription("autorole 추가")
        .addStringOption((option) => option
        .setName("target")
        .setDescription("대상")
        .setRequired(true)
        .addChoices({ name: "user", value: "user" }, { name: "bot", value: "bot" }))
        .addRoleOption((option) => option.setName("role").setDescription("역할").setRequired(true)))
        .addSubcommand((sub) => sub
        .setName("delete")
        .setDescription("autorole 제거")
        .addStringOption((option) => option
        .setName("target")
        .setDescription("대상")
        .setRequired(true)
        .addChoices({ name: "user", value: "user" }, { name: "bot", value: "bot" }))
        .addRoleOption((option) => option.setName("role").setDescription("역할").setRequired(true)))
        .addSubcommand((sub) => sub.setName("show").setDescription("autorole 목록")))
        .addSubcommandGroup((group) => group
        .setName("timed")
        .setDescription("지연 역할 부여")
        .addSubcommand((sub) => sub
        .setName("add")
        .setDescription("timed role 추가")
        .addRoleOption((option) => option.setName("role").setDescription("역할").setRequired(true))
        .addStringOption((option) => option
        .setName("time")
        .setDescription("시간(예: 10s, 10m, 2h, 1d)")
        .setRequired(true)))
        .addSubcommand((sub) => sub
        .setName("delete")
        .setDescription("timed role 제거")
        .addRoleOption((option) => option.setName("role").setDescription("역할").setRequired(true)))
        .addSubcommand((sub) => sub.setName("show").setDescription("timed role 목록")))
        .addSubcommandGroup((group) => group
        .setName("voice")
        .setDescription("음성 채널 역할")
        .addSubcommand((sub) => sub
        .setName("add")
        .setDescription("음성 채널 역할 추가")
        .addChannelOption((option) => option
        .setName("channel")
        .setDescription("음성 채널")
        .setRequired(true)
        .addChannelTypes(discord_js_1.ChannelType.GuildVoice, discord_js_1.ChannelType.GuildStageVoice))
        .addRoleOption((option) => option.setName("role").setDescription("역할").setRequired(true)))
        .addSubcommand((sub) => sub
        .setName("delete")
        .setDescription("음성 채널 역할 제거")
        .addChannelOption((option) => option
        .setName("channel")
        .setDescription("음성 채널")
        .setRequired(true)
        .addChannelTypes(discord_js_1.ChannelType.GuildVoice, discord_js_1.ChannelType.GuildStageVoice))
        .addRoleOption((option) => option.setName("role").setDescription("역할").setRequired(true)))
        .addSubcommand((sub) => sub.setName("show").setDescription("음성 채널 역할 목록")))
        .addSubcommand((sub) => sub
        .setName("dm")
        .setDescription("리액션 역할 DM 알림")
        .addStringOption((option) => option
        .setName("state")
        .setDescription("on/off")
        .setRequired(true)
        .addChoices({ name: "on", value: "on" }, { name: "off", value: "off" }))),
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
        const hasAdmin = interaction.memberPermissions?.has(discord_js_1.PermissionsBitField.Flags.ManageGuild);
        const allowed = (0, permissions_1.canManageCommands)(interaction.member, interaction.user.id, config || {}, Boolean(hasAdmin));
        if (!allowed) {
            await interaction.reply({
                content: "이 명령을 사용하려면 서버 관리 권한 또는 허용된 역할/유저가 필요해요.",
                flags: discord_js_1.MessageFlags.Ephemeral,
            });
            return;
        }
        // Handle Message Context Menu
        if (interaction.isMessageContextMenuCommand()) {
            const message = interaction.targetMessage;
            (0, rrRepo_1.setActiveMessage)(guildId, message.channel.id, message.id);
            await interaction.reply({
                content: `활성 메시지를 설정했어요. 메시지 ID: ${message.id}\n채널: <#${message.channel.id}>`,
                flags: discord_js_1.MessageFlags.Ephemeral,
            });
            return;
        }
        if (!interaction.isChatInputCommand())
            return;
        const sub = interaction.options.getSubcommand();
        const group = interaction.options.getSubcommandGroup(false);
        if (sub === "channel") {
            const channel = interaction.options.getChannel("channel", true);
            (0, rrRepo_1.setActiveMessage)(guildId, channel.id, "");
            await interaction.reply({
                content: `활성 채널을 ${(0, mentions_1.formatChannel)(channel.id)}로 설정했어요. 이제 /rr message로 메시지를 지정해주세요.`,
                flags: discord_js_1.MessageFlags.Ephemeral,
            });
            return;
        }
        if (sub === "message") {
            const messageId = interaction.options.getString("message_id");
            let targetMessageId = messageId;
            // Fallback to reply
            if (!targetMessageId && interaction.message?.id) {
                targetMessageId = interaction.message.id;
            }
            if (!targetMessageId) {
                await interaction.reply({
                    content: "메시지 ID를 입력하거나, 대상 메시지에 답글(Reply)을 달고 명령어를 실행해주세요.",
                    flags: discord_js_1.MessageFlags.Ephemeral,
                });
                return;
            }
            const active = (0, rrRepo_1.getActiveMessage)(guildId);
            const channelId = active?.channel_id || interaction.channelId;
            const channel = await guild.channels.fetch(channelId).catch(() => null);
            if (!channel?.isTextBased()) {
                await interaction.reply({
                    content: "활성 채널을 찾을 수 없어요. /rr channel로 먼저 설정해주세요.",
                    flags: discord_js_1.MessageFlags.Ephemeral,
                });
                return;
            }
            const message = await channel.messages.fetch(targetMessageId).catch(() => null);
            if (!message) {
                await interaction.reply({
                    content: "메시지를 찾지 못했어요. ID를 확인하거나 해당 채널이 맞는지 확인해주세요.",
                    flags: discord_js_1.MessageFlags.Ephemeral,
                });
                return;
            }
            (0, rrRepo_1.setActiveMessage)(guildId, channel.id, message.id);
            await interaction.reply({
                content: `활성 메시지를 설정했어요. 메시지 ID: ${message.id}`,
                flags: discord_js_1.MessageFlags.Ephemeral,
            });
            return;
        }
        if (group === "add") {
            const active = await fetchActiveMessage(interaction);
            if (!active) {
                await interaction.reply({
                    content: "활성 메시지가 없어요. /rr channel + /rr message로 설정해주세요.",
                    flags: discord_js_1.MessageFlags.Ephemeral,
                });
                return;
            }
            const emojiInput = interaction.options.getString("emoji", true);
            const role = interaction.options.getRole("role", true);
            const parsed = (0, emoji_1.parseEmojiToken)(emojiInput);
            if (!parsed) {
                await interaction.reply({
                    content: "이모지 형식이 올바르지 않아요.",
                    flags: discord_js_1.MessageFlags.Ephemeral,
                });
                return;
            }
            const type = sub;
            const rules = (0, rrRepo_1.listRulesByMessage)(guildId, active.message.id);
            if (type === "once") {
                const hasOther = rules.some((rule) => rule.type !== "once");
                if (hasOther) {
                    await interaction.reply({
                        content: "once 타입은 다른 리액션 타입과 함께 사용할 수 없어요.",
                        flags: discord_js_1.MessageFlags.Ephemeral,
                    });
                    return;
                }
            }
            else {
                const hasOnce = rules.some((rule) => rule.type === "once");
                if (hasOnce) {
                    await interaction.reply({
                        content: "once 타입이 설정된 메시지에는 다른 타입을 추가할 수 없어요.",
                        flags: discord_js_1.MessageFlags.Ephemeral,
                    });
                    return;
                }
            }
            const toggleGroup = type === "toggle" ? interaction.options.getString("group") || "default" : null;
            (0, rrRepo_1.addRule)({
                guildId,
                messageId: active.message.id,
                emojiKey: parsed.key,
                roleId: role.id,
                type,
                toggleGroup,
            });
            try {
                await active.message.react(parsed.raw);
            }
            catch {
                // ignore react failure
            }
            await interaction.reply({
                content: `리액션 역할을 추가했어요. ${(0, mentions_2.formatEmojiKey)(parsed.key)} → ${(0, mentions_1.formatRole)(role.id)}`,
                flags: discord_js_1.MessageFlags.Ephemeral,
            });
            return;
        }
        if (sub === "list") {
            const messageId = interaction.options.getString("message_id");
            const rules = messageId ? (0, rrRepo_1.listRulesByMessage)(guildId, messageId) : (0, rrRepo_1.listRulesByGuild)(guildId);
            if (!rules.length) {
                await interaction.reply({
                    content: "등록된 리액션 역할이 없어요.",
                    flags: discord_js_1.MessageFlags.Ephemeral,
                });
                return;
            }
            const grouped = {};
            for (const rule of rules) {
                grouped[rule.message_id] = grouped[rule.message_id] || [];
                grouped[rule.message_id].push(rule);
            }
            const lines = Object.entries(grouped).map(([msgId, items]) => {
                const detail = items
                    .map((rule) => `${(0, mentions_2.formatEmojiKey)(rule.emoji_key)} → ${(0, mentions_1.formatRole)(rule.role_id)} (${rule.type}${rule.toggle_group ? `:${rule.toggle_group}` : ""})`)
                    .join(", ");
                return `- ${msgId}: ${detail}`;
            });
            await interaction.reply({
                content: `리액션 역할 목록\n${lines.join("\n")}`,
                flags: discord_js_1.MessageFlags.Ephemeral,
            });
            return;
        }
        if (group === "delete") {
            const messageIdInput = interaction.options.getString("message_id");
            let targetMessageId = messageIdInput;
            if (!targetMessageId && interaction.message?.id) {
                targetMessageId = interaction.message.id;
            }
            if (!targetMessageId) {
                const active = (0, rrRepo_1.getActiveMessage)(guildId);
                if (active?.message_id) {
                    targetMessageId = active.message_id;
                }
                else {
                    await interaction.reply({
                        content: "메시지 ID를 입력하거나, 대상 메시지에 답글(Reply)을 달아주세요.",
                        flags: discord_js_1.MessageFlags.Ephemeral,
                    });
                    return;
                }
            }
            if (sub === "all") {
                const removed = (0, rrRepo_1.deleteRulesByMessage)(guildId, targetMessageId);
                await interaction.reply({
                    content: `삭제 완료: ${removed}개 (메시지 ID: ${targetMessageId})`,
                    flags: discord_js_1.MessageFlags.Ephemeral,
                });
                return;
            }
            if (sub === "reaction-role") {
                const role = interaction.options.getRole("role", true);
                const removed = (0, rrRepo_1.deleteRulesByRole)(guildId, targetMessageId, role.id);
                await interaction.reply({
                    content: `삭제 완료: ${removed}개 (메시지 ID: ${targetMessageId})`,
                    flags: discord_js_1.MessageFlags.Ephemeral,
                });
                return;
            }
            if (sub === "reaction-emoji") {
                const emojiInput = interaction.options.getString("emoji", true);
                const parsed = (0, emoji_1.parseEmojiToken)(emojiInput);
                if (!parsed) {
                    await interaction.reply({
                        content: "이모지 형식이 올바르지 않아요.",
                        flags: discord_js_1.MessageFlags.Ephemeral,
                    });
                    return;
                }
                const removed = (0, rrRepo_1.deleteRulesByEmoji)(guildId, targetMessageId, parsed.key);
                await interaction.reply({
                    content: `삭제 완료: ${removed}개 (메시지 ID: ${targetMessageId})`,
                    flags: discord_js_1.MessageFlags.Ephemeral,
                });
                return;
            }
            if (sub === "check") {
                const channelId = (0, rrRepo_1.getActiveMessage)(guildId)?.channel_id || interaction.channelId;
                const channel = await guild.channels.fetch(channelId).catch(() => null);
                const message = (channel?.isTextBased() && targetMessageId)
                    ? await channel.messages.fetch(targetMessageId).catch(() => null)
                    : null;
                if (!message) {
                    const removed = (0, rrRepo_1.deleteRulesByMessage)(guildId, targetMessageId);
                    await interaction.reply({
                        content: `메시지를 찾지 못해 규칙을 삭제했어요. 삭제 수: ${removed}`,
                        flags: discord_js_1.MessageFlags.Ephemeral,
                    });
                    return;
                }
                const roleIds = [...message.guild.roles.cache.keys()];
                const removed = (0, rrRepo_1.deleteRulesMissingRoles)(guildId, targetMessageId, roleIds);
                await interaction.reply({
                    content: `삭제된 역할 참조 정리: ${removed}개`,
                    flags: discord_js_1.MessageFlags.Ephemeral,
                });
                return;
            }
        }
        if (group === "autorole") {
            if (sub === "add") {
                const target = interaction.options.getString("target", true);
                const role = interaction.options.getRole("role", true);
                (0, autoroleRepo_1.addAutorole)(guildId, target, role.id);
                await interaction.reply({
                    content: `autorole을 추가했어요. 대상: ${target}, 역할: ${(0, mentions_1.formatRole)(role.id)}`,
                    flags: discord_js_1.MessageFlags.Ephemeral,
                });
                return;
            }
            if (sub === "delete") {
                const target = interaction.options.getString("target", true);
                const role = interaction.options.getRole("role", true);
                const removed = (0, autoroleRepo_1.removeAutorole)(guildId, target, role.id);
                await interaction.reply({
                    content: `삭제 완료: ${removed}개`,
                    flags: discord_js_1.MessageFlags.Ephemeral,
                });
                return;
            }
            if (sub === "show") {
                const items = (0, autoroleRepo_1.listAutoroles)(guildId);
                if (!items.length) {
                    await interaction.reply({
                        content: "autorole 설정이 없어요.",
                        flags: discord_js_1.MessageFlags.Ephemeral,
                    });
                    return;
                }
                const lines = items.map((item) => `- ${item.target}: ${(0, mentions_1.formatRole)(item.role_id)}`);
                await interaction.reply({
                    content: `autorole 목록\n${lines.join("\n")}`,
                    flags: discord_js_1.MessageFlags.Ephemeral,
                });
                return;
            }
        }
        if (group === "timed") {
            if (sub === "add") {
                const role = interaction.options.getRole("role", true);
                const time = interaction.options.getString("time", true);
                const delayMs = (0, time_1.parseTimeToMs)(time);
                if (!delayMs) {
                    await interaction.reply({
                        content: "시간 형식이 올바르지 않아요. 예: 10s, 10m, 2h, 1d",
                        flags: discord_js_1.MessageFlags.Ephemeral,
                    });
                    return;
                }
                (0, timedRoleRepo_1.addTimedRole)(guildId, role.id, delayMs);
                await interaction.reply({
                    content: `timed role을 추가했어요. ${(0, mentions_1.formatRole)(role.id)} (${time})`,
                    flags: discord_js_1.MessageFlags.Ephemeral,
                });
                return;
            }
            if (sub === "delete") {
                const role = interaction.options.getRole("role", true);
                const removed = (0, timedRoleRepo_1.removeTimedRole)(guildId, role.id);
                await interaction.reply({
                    content: `삭제 완료: ${removed}개`,
                    flags: discord_js_1.MessageFlags.Ephemeral,
                });
                return;
            }
            if (sub === "show") {
                const items = (0, timedRoleRepo_1.listTimedRoles)(guildId);
                if (!items.length) {
                    await interaction.reply({
                        content: "timed role 설정이 없어요.",
                        flags: discord_js_1.MessageFlags.Ephemeral,
                    });
                    return;
                }
                const lines = items.map((item) => `- ${(0, mentions_1.formatRole)(item.role_id)}: ${formatDelayMs(item.delay_ms)}`);
                await interaction.reply({
                    content: `timed role 목록\n${lines.join("\n")}`,
                    flags: discord_js_1.MessageFlags.Ephemeral,
                });
                return;
            }
        }
        if (group === "voice") {
            if (sub === "add") {
                const channel = interaction.options.getChannel("channel", true);
                const role = interaction.options.getRole("role", true);
                (0, voiceRoleRepo_1.addVoiceRole)(guildId, channel.id, role.id);
                await interaction.reply({
                    content: `음성 채널 역할을 추가했어요. ${(0, mentions_1.formatChannel)(channel.id)} → ${(0, mentions_1.formatRole)(role.id)}`,
                    flags: discord_js_1.MessageFlags.Ephemeral,
                });
                return;
            }
            if (sub === "delete") {
                const channel = interaction.options.getChannel("channel", true);
                const role = interaction.options.getRole("role", true);
                const removed = (0, voiceRoleRepo_1.removeVoiceRole)(guildId, channel.id, role.id);
                await interaction.reply({
                    content: `삭제 완료: ${removed}개`,
                    flags: discord_js_1.MessageFlags.Ephemeral,
                });
                return;
            }
            if (sub === "show") {
                const items = (0, voiceRoleRepo_1.listVoiceRoles)(guildId);
                if (!items.length) {
                    await interaction.reply({
                        content: "음성 채널 역할 설정이 없어요.",
                        flags: discord_js_1.MessageFlags.Ephemeral,
                    });
                    return;
                }
                const lines = items.map((item) => `- <#${item.voice_channel_id}>: ${(0, mentions_1.formatRole)(item.role_id)}`);
                await interaction.reply({
                    content: `음성 채널 역할 목록\n${lines.join("\n")}`,
                    flags: discord_js_1.MessageFlags.Ephemeral,
                });
                return;
            }
        }
        if (sub === "dm") {
            const state = interaction.options.getString("state", true);
            (0, rrSettingsRepo_1.setDmEnabled)(guildId, state === "on");
            await interaction.reply({
                content: `DM 알림을 ${state === "on" ? "켜짐" : "꺼짐"}으로 설정했어요.`,
                flags: discord_js_1.MessageFlags.Ephemeral,
            });
            return;
        }
        await interaction.reply({
            content: "알 수 없는 명령이에요.",
            flags: discord_js_1.MessageFlags.Ephemeral,
        });
    },
};
