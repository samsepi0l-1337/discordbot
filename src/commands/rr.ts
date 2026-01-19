import {
  SlashCommandBuilder,
  PermissionsBitField,
  ChannelType,
  type ChatInputCommandInteraction,
} from "discord.js";
import { getConfig } from "../config/guildConfigRepo";
import {
  setActiveMessage,
  getActiveMessage,
  clearActiveMessage,
  addRule,
  listRulesByMessage,
  listRulesByGuild,
  listRulesByMessageEmoji,
  deleteRulesByMessage,
  deleteRulesByEmoji,
  deleteRulesByRole,
  deleteRulesMissingRoles,
} from "../config/rrRepo";
import { setDmEnabled, getDmEnabled } from "../config/rrSettingsRepo";
import { addAutorole, removeAutorole, listAutoroles } from "../config/autoroleRepo";
import { addTimedRole, removeTimedRole, listTimedRoles } from "../config/timedRoleRepo";
import { addVoiceRole, removeVoiceRole, listVoiceRoles } from "../config/voiceRoleRepo";
import { canManageCommands } from "../core/permissions";
import { formatRole, formatChannel } from "../core/formatters/mentions";
import { formatEmojiKey } from "../core/formatters/mentions";
import { parseEmojiToken } from "../core/parsers/emoji";
import { parseTimeToMs } from "../core/parsers/time";

type RrRule = {
  message_id: string;
  emoji_key: string;
  role_id: string;
  type: string;
  toggle_group?: string | null;
};

async function fetchActiveMessage(interaction: ChatInputCommandInteraction) {
  const active = getActiveMessage(interaction.guild!.id);
  if (!active?.message_id) return null;
  const channel = await interaction.guild!.channels.fetch(active.channel_id).catch(() => null);
  if (!channel?.isTextBased()) return null;
  const message = await channel.messages.fetch(active.message_id).catch(() => null);
  if (!message) return null;
  return { channel, message };
}

module.exports = {
  data: new SlashCommandBuilder()
    .setName("rr")
    .setDescription("Reaction Roles 관리")
    .addSubcommand((sub) =>
      sub
        .setName("channel")
        .setDescription("활성 채널 선택")
        .addChannelOption((option) =>
          option
            .setName("channel")
            .setDescription("대상 채널")
            .setRequired(true)
            .addChannelTypes(ChannelType.GuildText)
        )
    )
    .addSubcommand((sub) =>
      sub
        .setName("message")
        .setDescription("활성 메시지 선택")
        .addStringOption((option) =>
          option.setName("message_id").setDescription("메시지 ID").setRequired(true)
        )
    )
    .addSubcommandGroup((group) =>
      group
        .setName("add")
        .setDescription("리액션 역할 추가")
        .addSubcommand((sub) =>
          sub
            .setName("normal")
            .setDescription("리액션 추가 시 역할 부여, 제거 시 해제")
            .addStringOption((option) =>
              option.setName("emoji").setDescription("이모지").setRequired(true)
            )
            .addRoleOption((option) =>
              option.setName("role").setDescription("역할").setRequired(true)
            )
        )
        .addSubcommand((sub) =>
          sub
            .setName("once")
            .setDescription("1회성 역할 부여(리액션 제거)")
            .addStringOption((option) =>
              option.setName("emoji").setDescription("이모지").setRequired(true)
            )
            .addRoleOption((option) =>
              option.setName("role").setDescription("역할").setRequired(true)
            )
        )
        .addSubcommand((sub) =>
          sub
            .setName("remove")
            .setDescription("리액션 시 역할 제거")
            .addStringOption((option) =>
              option.setName("emoji").setDescription("이모지").setRequired(true)
            )
            .addRoleOption((option) =>
              option.setName("role").setDescription("역할").setRequired(true)
            )
        )
        .addSubcommand((sub) =>
          sub
            .setName("toggle")
            .setDescription("같은 그룹 내에서 하나만 선택")
            .addStringOption((option) =>
              option.setName("emoji").setDescription("이모지").setRequired(true)
            )
            .addRoleOption((option) =>
              option.setName("role").setDescription("역할").setRequired(true)
            )
            .addStringOption((option) =>
              option
                .setName("group")
                .setDescription("토글 그룹(기본 default)")
                .setRequired(false)
            )
        )
    )
    .addSubcommand((sub) =>
      sub
        .setName("list")
        .setDescription("리액션 역할 목록")
        .addStringOption((option) =>
          option.setName("message_id").setDescription("특정 메시지 ID(선택)")
        )
    )
    .addSubcommandGroup((group) =>
      group
        .setName("delete")
        .setDescription("리액션 역할 삭제")
        .addSubcommand((sub) =>
          sub
            .setName("all")
            .setDescription("메시지의 모든 리액션 역할 삭제")
            .addStringOption((option) =>
              option.setName("message_id").setDescription("메시지 ID").setRequired(true)
            )
        )
        .addSubcommand((sub) =>
          sub
            .setName("reaction-role")
            .setDescription("메시지에서 특정 역할 삭제")
            .addStringOption((option) =>
              option.setName("message_id").setDescription("메시지 ID").setRequired(true)
            )
            .addRoleOption((option) =>
              option.setName("role").setDescription("역할").setRequired(true)
            )
        )
        .addSubcommand((sub) =>
          sub
            .setName("reaction-emoji")
            .setDescription("메시지에서 특정 이모지 삭제")
            .addStringOption((option) =>
              option.setName("message_id").setDescription("메시지 ID").setRequired(true)
            )
            .addStringOption((option) =>
              option.setName("emoji").setDescription("이모지").setRequired(true)
            )
        )
        .addSubcommand((sub) =>
          sub
            .setName("check")
            .setDescription("삭제된 역할 참조 정리")
            .addStringOption((option) =>
              option.setName("message_id").setDescription("메시지 ID").setRequired(true)
            )
        )
    )
    .addSubcommandGroup((group) =>
      group
        .setName("autorole")
        .setDescription("입장 시 역할 부여")
        .addSubcommand((sub) =>
          sub
            .setName("add")
            .setDescription("autorole 추가")
            .addStringOption((option) =>
              option
                .setName("target")
                .setDescription("대상")
                .setRequired(true)
                .addChoices(
                  { name: "user", value: "user" },
                  { name: "bot", value: "bot" }
                )
            )
            .addRoleOption((option) =>
              option.setName("role").setDescription("역할").setRequired(true)
            )
        )
        .addSubcommand((sub) =>
          sub
            .setName("delete")
            .setDescription("autorole 제거")
            .addStringOption((option) =>
              option
                .setName("target")
                .setDescription("대상")
                .setRequired(true)
                .addChoices(
                  { name: "user", value: "user" },
                  { name: "bot", value: "bot" }
                )
            )
            .addRoleOption((option) =>
              option.setName("role").setDescription("역할").setRequired(true)
            )
        )
        .addSubcommand((sub) => sub.setName("show").setDescription("autorole 목록"))
    )
    .addSubcommandGroup((group) =>
      group
        .setName("timed")
        .setDescription("지연 역할 부여")
        .addSubcommand((sub) =>
          sub
            .setName("add")
            .setDescription("timed role 추가")
            .addRoleOption((option) =>
              option.setName("role").setDescription("역할").setRequired(true)
            )
            .addStringOption((option) =>
              option
                .setName("time")
                .setDescription("시간(예: 10m, 2h, 1d)")
                .setRequired(true)
            )
        )
        .addSubcommand((sub) =>
          sub
            .setName("delete")
            .setDescription("timed role 제거")
            .addRoleOption((option) =>
              option.setName("role").setDescription("역할").setRequired(true)
            )
        )
        .addSubcommand((sub) => sub.setName("show").setDescription("timed role 목록"))
    )
    .addSubcommandGroup((group) =>
      group
        .setName("voice")
        .setDescription("음성 채널 역할")
        .addSubcommand((sub) =>
          sub
            .setName("add")
            .setDescription("음성 채널 역할 추가")
            .addChannelOption((option) =>
              option
                .setName("channel")
                .setDescription("음성 채널")
                .setRequired(true)
                .addChannelTypes(ChannelType.GuildVoice, ChannelType.GuildStageVoice)
            )
            .addRoleOption((option) =>
              option.setName("role").setDescription("역할").setRequired(true)
            )
        )
        .addSubcommand((sub) =>
          sub
            .setName("delete")
            .setDescription("음성 채널 역할 제거")
            .addChannelOption((option) =>
              option
                .setName("channel")
                .setDescription("음성 채널")
                .setRequired(true)
                .addChannelTypes(ChannelType.GuildVoice, ChannelType.GuildStageVoice)
            )
            .addRoleOption((option) =>
              option.setName("role").setDescription("역할").setRequired(true)
            )
        )
        .addSubcommand((sub) => sub.setName("show").setDescription("음성 채널 역할 목록"))
    )
    .addSubcommand((sub) =>
      sub
        .setName("dm")
        .setDescription("리액션 역할 DM 알림")
        .addStringOption((option) =>
          option
            .setName("state")
            .setDescription("on/off")
            .setRequired(true)
            .addChoices(
              { name: "on", value: "on" },
              { name: "off", value: "off" }
            )
        )
    ),

  async execute(interaction: ChatInputCommandInteraction) {
    if (!interaction.inGuild()) {
      await interaction.reply({
        content: "이 명령은 서버에서만 사용할 수 있어요.",
        ephemeral: true,
      });
      return;
    }

    const guild = interaction.guild!;
    const guildId = guild.id;
    const config = getConfig(guildId);
    const hasAdmin = interaction.memberPermissions?.has(
      PermissionsBitField.Flags.ManageGuild
    );
    const allowed = canManageCommands(
      interaction.member as never,
      interaction.user.id,
      config || {},
      Boolean(hasAdmin)
    );
    if (!allowed) {
      await interaction.reply({
        content:
          "이 명령을 사용하려면 서버 관리 권한 또는 허용된 역할/유저가 필요해요.",
        ephemeral: true,
      });
      return;
    }

    const sub = interaction.options.getSubcommand();
    const group = interaction.options.getSubcommandGroup(false);

    if (sub === "channel") {
      const channel = interaction.options.getChannel("channel", true);
      setActiveMessage(guildId, channel.id, "");
      await interaction.reply({
        content: `활성 채널을 ${formatChannel(channel.id)}로 설정했어요. 이제 /rr message로 메시지를 지정해주세요.`,
        ephemeral: true,
      });
      return;
    }

    if (sub === "message") {
      const messageId = interaction.options.getString("message_id", true);
      const active = getActiveMessage(guildId);
      if (!active?.channel_id) {
        await interaction.reply({
          content: "먼저 /rr channel로 채널을 지정해주세요.",
          ephemeral: true,
        });
        return;
      }
      const channel = await guild.channels.fetch(active.channel_id).catch(() => null);
      if (!channel?.isTextBased()) {
        await interaction.reply({
          content: "활성 채널을 찾을 수 없어요.",
          ephemeral: true,
        });
        return;
      }
      const message = await channel.messages.fetch(messageId).catch(() => null);
      if (!message) {
        await interaction.reply({
          content: "메시지를 찾지 못했어요. ID를 확인해주세요.",
          ephemeral: true,
        });
        return;
      }
      setActiveMessage(guildId, channel.id, messageId);
      await interaction.reply({
        content: `활성 메시지를 설정했어요. 메시지 ID: ${messageId}`,
        ephemeral: true,
      });
      return;
    }

    if (group === "add") {
      const active = await fetchActiveMessage(interaction);
      if (!active) {
        await interaction.reply({
          content: "활성 메시지가 없어요. /rr channel + /rr message로 설정해주세요.",
          ephemeral: true,
        });
        return;
      }
      const emojiInput = interaction.options.getString("emoji", true);
      const role = interaction.options.getRole("role", true);
      const parsed = parseEmojiToken(emojiInput);
      if (!parsed) {
        await interaction.reply({
          content: "이모지 형식이 올바르지 않아요.",
          ephemeral: true,
        });
        return;
      }

      const type = sub;
      const rules = listRulesByMessage(guildId, active.message.id) as RrRule[];
      if (type === "once") {
        const hasOther = rules.some((rule) => rule.type !== "once");
        if (hasOther) {
          await interaction.reply({
            content: "once 타입은 다른 리액션 타입과 함께 사용할 수 없어요.",
            ephemeral: true,
          });
          return;
        }
      } else {
        const hasOnce = rules.some((rule) => rule.type === "once");
        if (hasOnce) {
          await interaction.reply({
            content: "once 타입이 설정된 메시지에는 다른 타입을 추가할 수 없어요.",
            ephemeral: true,
          });
          return;
        }
      }

      const toggleGroup =
        type === "toggle" ? interaction.options.getString("group") || "default" : null;
      addRule({
        guildId,
        messageId: active.message.id,
        emojiKey: parsed.key,
        roleId: role.id,
        type,
        toggleGroup,
      });

      try {
        await active.message.react(parsed.raw);
      } catch {
        // ignore react failure
      }

      await interaction.reply({
        content: `리액션 역할을 추가했어요. ${formatEmojiKey(parsed.key)} → ${formatRole(
          role.id
        )}`,
        ephemeral: true,
      });
      return;
    }

    if (sub === "list") {
      const messageId = interaction.options.getString("message_id");
      const rules = messageId ? listRulesByMessage(guildId, messageId) : listRulesByGuild(guildId);
      if (!rules.length) {
        await interaction.reply({
          content: "등록된 리액션 역할이 없어요.",
          ephemeral: true,
        });
        return;
      }
      const grouped: Record<string, RrRule[]> = {};
      for (const rule of rules) {
        grouped[rule.message_id] = grouped[rule.message_id] || [];
        grouped[rule.message_id].push(rule);
      }
      const lines = Object.entries(grouped).map(([msgId, items]) => {
        const detail = items
          .map(
            (rule: RrRule) =>
              `${formatEmojiKey(rule.emoji_key)} → ${formatRole(rule.role_id)} (${rule.type}${
                rule.toggle_group ? `:${rule.toggle_group}` : ""
              })`
          )
          .join(", ");
        return `- ${msgId}: ${detail}`;
      });
      await interaction.reply({
        content: `리액션 역할 목록\n${lines.join("\n")}`,
        ephemeral: true,
      });
      return;
    }

    if (group === "delete") {
      const messageId = interaction.options.getString("message_id", true);
      if (sub === "all") {
        const removed = deleteRulesByMessage(guildId, messageId);
        await interaction.reply({
          content: `삭제 완료: ${removed}개`,
          ephemeral: true,
        });
        return;
      }
      if (sub === "reaction-role") {
        const role = interaction.options.getRole("role", true);
        const removed = deleteRulesByRole(guildId, messageId, role.id);
        await interaction.reply({
          content: `삭제 완료: ${removed}개`,
          ephemeral: true,
        });
        return;
      }
      if (sub === "reaction-emoji") {
        const emojiInput = interaction.options.getString("emoji", true);
        const parsed = parseEmojiToken(emojiInput);
        if (!parsed) {
          await interaction.reply({
            content: "이모지 형식이 올바르지 않아요.",
            ephemeral: true,
          });
          return;
        }
        const removed = deleteRulesByEmoji(guildId, messageId, parsed.key);
        await interaction.reply({
          content: `삭제 완료: ${removed}개`,
          ephemeral: true,
        });
        return;
      }
      if (sub === "check") {
        const channelId = getActiveMessage(guildId)?.channel_id;
        if (!channelId) {
          await interaction.reply({
            content: "먼저 /rr channel로 채널을 지정해주세요.",
            ephemeral: true,
          });
          return;
        }
        const channel = await guild.channels.fetch(channelId).catch(() => null);
        const message = channel?.isTextBased()
          ? await channel.messages.fetch(messageId).catch(() => null)
          : null;
        if (!message) {
          const removed = deleteRulesByMessage(guildId, messageId);
          await interaction.reply({
            content: `메시지를 찾지 못해 규칙을 삭제했어요. 삭제 수: ${removed}`,
            ephemeral: true,
          });
          return;
        }
        const roleIds = [...message.guild.roles.cache.keys()];
        const removed = deleteRulesMissingRoles(guildId, messageId, roleIds);
        await interaction.reply({
          content: `삭제된 역할 참조 정리: ${removed}개`,
          ephemeral: true,
        });
        return;
      }
    }

    if (group === "autorole") {
      if (sub === "add") {
        const target = interaction.options.getString("target", true);
        const role = interaction.options.getRole("role", true);
        addAutorole(guildId, target, role.id);
        await interaction.reply({
          content: `autorole을 추가했어요. 대상: ${target}, 역할: ${formatRole(role.id)}`,
          ephemeral: true,
        });
        return;
      }
      if (sub === "delete") {
        const target = interaction.options.getString("target", true);
        const role = interaction.options.getRole("role", true);
        const removed = removeAutorole(guildId, target, role.id);
        await interaction.reply({
          content: `삭제 완료: ${removed}개`,
          ephemeral: true,
        });
        return;
      }
      if (sub === "show") {
        const items = listAutoroles(guildId);
        if (!items.length) {
          await interaction.reply({
            content: "autorole 설정이 없어요.",
            ephemeral: true,
          });
          return;
        }
        const lines = items.map(
          (item: { target: string; role_id: string }) =>
            `- ${item.target}: ${formatRole(item.role_id)}`
        );
        await interaction.reply({
          content: `autorole 목록\n${lines.join("\n")}`,
          ephemeral: true,
        });
        return;
      }
    }

    if (group === "timed") {
      if (sub === "add") {
        const role = interaction.options.getRole("role", true);
        const time = interaction.options.getString("time", true);
        const delayMs = parseTimeToMs(time);
        if (!delayMs) {
          await interaction.reply({
            content: "시간 형식이 올바르지 않아요. 예: 10m, 2h, 1d",
            ephemeral: true,
          });
          return;
        }
        addTimedRole(guildId, role.id, delayMs);
        await interaction.reply({
          content: `timed role을 추가했어요. ${formatRole(role.id)} (${time})`,
          ephemeral: true,
        });
        return;
      }
      if (sub === "delete") {
        const role = interaction.options.getRole("role", true);
        const removed = removeTimedRole(guildId, role.id);
        await interaction.reply({
          content: `삭제 완료: ${removed}개`,
          ephemeral: true,
        });
        return;
      }
      if (sub === "show") {
        const items = listTimedRoles(guildId);
        if (!items.length) {
          await interaction.reply({
            content: "timed role 설정이 없어요.",
            ephemeral: true,
          });
          return;
        }
        const lines = items.map(
          (item: { role_id: string; delay_ms: number }) =>
            `- ${formatRole(item.role_id)}: ${Math.round(item.delay_ms / 60000)}분`
        );
        await interaction.reply({
          content: `timed role 목록\n${lines.join("\n")}`,
          ephemeral: true,
        });
        return;
      }
    }

    if (group === "voice") {
      if (sub === "add") {
        const channel = interaction.options.getChannel("channel", true);
        const role = interaction.options.getRole("role", true);
        addVoiceRole(guildId, channel.id, role.id);
        await interaction.reply({
          content: `음성 채널 역할을 추가했어요. ${formatChannel(channel.id)} → ${formatRole(
            role.id
          )}`,
          ephemeral: true,
        });
        return;
      }
      if (sub === "delete") {
        const channel = interaction.options.getChannel("channel", true);
        const role = interaction.options.getRole("role", true);
        const removed = removeVoiceRole(guildId, channel.id, role.id);
        await interaction.reply({
          content: `삭제 완료: ${removed}개`,
          ephemeral: true,
        });
        return;
      }
      if (sub === "show") {
        const items = listVoiceRoles(guildId);
        if (!items.length) {
          await interaction.reply({
            content: "음성 채널 역할 설정이 없어요.",
            ephemeral: true,
          });
          return;
        }
        const lines = items.map(
          (item: { voice_channel_id: string; role_id: string }) =>
            `- <#${item.voice_channel_id}>: ${formatRole(item.role_id)}`
        );
        await interaction.reply({
          content: `음성 채널 역할 목록\n${lines.join("\n")}`,
          ephemeral: true,
        });
        return;
      }
    }

    if (sub === "dm") {
      const state = interaction.options.getString("state", true);
      setDmEnabled(guildId, state === "on");
      await interaction.reply({
        content: `DM 알림을 ${state === "on" ? "켜짐" : "꺼짐"}으로 설정했어요.`,
        ephemeral: true,
      });
      return;
    }

    await interaction.reply({
      content: "알 수 없는 명령이에요.",
      ephemeral: true,
    });
  },
};
