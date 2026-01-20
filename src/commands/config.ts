import {
  SlashCommandBuilder,
  PermissionsBitField,
  ChannelType,
  type ChatInputCommandInteraction,
} from "discord.js";
import {
  getConfig,
  setIntro,
  addCommandRole,
  removeCommandRole,
  addCommandUser,
  removeCommandUser,
  clearField,
  resetConfig,
} from "../config/guildConfigRepo";
import { canManageCommands } from "../core/permissions";
import { formatChannel, formatRole, formatUser } from "../core/formatters/mentions";

function formatRoles(ids?: string[] | null) {
  if (!ids?.length) return "미설정";
  return ids.map((id) => formatRole(id)).join(", ");
}

function formatUsersList(ids?: string[] | null) {
  if (!ids?.length) return "미설정";
  return ids.map((id) => formatUser(id)).join(", ");
}

function formatSeconds(ms?: number | null) {
  return `${Math.max(0, Math.round((ms || 0) / 1000))}초`;
}

module.exports = {
  data: new SlashCommandBuilder()
    .setName("config")
    .setDescription("봇 관리 권한 및 기본 채널 설정")
    .addSubcommand((sub) =>
      sub
        .setName("set-intro")
        .setDescription("자기소개 채널/역할 설정 (add=부여, delete=제거)")
        .addChannelOption((option) =>
          option
            .setName("channel")
            .setDescription("자기소개 채널")
            .setRequired(true)
            .addChannelTypes(ChannelType.GuildText)
        )
        .addRoleOption((option) =>
          option.setName("role").setDescription("역할").setRequired(true)
        )
        .addStringOption((option) =>
          option
            .setName("mode")
            .setDescription("역할 동작")
            .setRequired(false)
            .addChoices(
              { name: "add (역할 부여)", value: "add" },
              { name: "delete (역할 제거)", value: "delete" }
            )
        )
    )
    .addSubcommand((sub) =>
      sub
        .setName("allow-command-role")
        .setDescription("봇 커맨드 사용 허용 역할 추가")
        .addRoleOption((option) =>
          option.setName("role").setDescription("허용 역할").setRequired(true)
        )
    )
    .addSubcommand((sub) =>
      sub
        .setName("remove-command-role")
        .setDescription("봇 커맨드 사용 허용 역할 제거")
        .addRoleOption((option) =>
          option.setName("role").setDescription("허용 역할").setRequired(true)
        )
    )
    .addSubcommand((sub) =>
      sub
        .setName("allow-command-user")
        .setDescription("봇 커맨드 사용 허용 유저 추가")
        .addUserOption((option) =>
          option.setName("user").setDescription("허용 유저").setRequired(true)
        )
    )
    .addSubcommand((sub) =>
      sub
        .setName("remove-command-user")
        .setDescription("봇 커맨드 사용 허용 유저 제거")
        .addUserOption((option) =>
          option.setName("user").setDescription("허용 유저").setRequired(true)
        )
    )
    .addSubcommand((sub) => sub.setName("show").setDescription("현재 설정 보기"))
    .addSubcommand((sub) =>
      sub
        .setName("clear")
        .setDescription("특정 설정만 초기화")
        .addStringOption((option) =>
          option
            .setName("field")
            .setDescription("초기화 항목")
            .setRequired(true)
            .addChoices(
              { name: "intro_channel", value: "intro_channel" },
              { name: "intro_role", value: "intro_role" },
              { name: "intro_mode", value: "intro_mode" },
              { name: "command_roles", value: "command_roles" },
              { name: "command_users", value: "command_users" }
            )
        )
    )
    .addSubcommand((sub) => sub.setName("reset").setDescription("모든 설정 초기화")),

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
        content: "이 명령을 사용하려면 서버 관리 권한 또는 허용된 역할이 필요해요.",
        ephemeral: true,
      });
      return;
    }

    const sub = interaction.options.getSubcommand();

    if (sub === "set-intro") {
      const channel = interaction.options.getChannel("channel", true);
      const role = interaction.options.getRole("role", true);
      const mode = interaction.options.getString("mode") as "add" | "delete" | null;
      setIntro(guildId, channel.id, role.id, mode || "add");
      await interaction.reply({
        content: `자기소개 채널 ${formatChannel(channel.id)}, 역할 ${formatRole(
          role.id
        )}, mode=${mode || "add"} 로 설정했어요.`,
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
      addCommandRole(guildId, role.id);
      await interaction.reply({
        content: `커맨드 허용 역할에 ${formatRole(role.id)}를 추가했어요.`,
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
      addCommandUser(guildId, user.id);
      await interaction.reply({
        content: `커맨드 허용 유저에 ${formatUser(user.id)}를 추가했어요.`,
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
      removeCommandUser(guildId, user.id);
      await interaction.reply({
        content: `커맨드 허용 유저에서 ${formatUser(user.id)}를 제거했어요.`,
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
      removeCommandRole(guildId, role.id);
      await interaction.reply({
        content: `커맨드 허용 역할에서 ${formatRole(role.id)}를 제거했어요.`,
        ephemeral: true,
      });
      return;
    }

    if (sub === "show") {
      const current = getConfig(guildId);
      if (!current) {
        await interaction.reply({
          content: "현재 설정이 없습니다. 먼저 /config 명령으로 설정해주세요.",
          ephemeral: true,
        });
        return;
      }
      const lines = [
        `- intro_channel: ${formatChannel(current.intro_channel_id)}`,
        `- intro_role: ${formatRole(current.intro_role_id)}`,
        `- intro_mode: ${current.intro_role_mode || "add"}`,
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
      const ok = clearField(guildId, field);
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
      resetConfig(guildId);
      await interaction.reply({
        content: "모든 설정을 초기화했어요.",
        ephemeral: true,
      });
    }
  },
};
