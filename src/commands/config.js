const {
  SlashCommandBuilder,
  PermissionsBitField,
  ChannelType,
} = require("discord.js");
const {
  getConfig,
  setJoinDelayMs,
  setBaseRole,
  setIntro,
  setTicketChannel,
  setTicketRecipient,
  addTicketRecipient,
  removeTicketRecipient,
  addCommandRole,
  removeCommandRole,
  addCommandUser,
  removeCommandUser,
  clearField,
  resetConfig,
} = require("../config/guildConfigRepo");
const { postTicketPanel } = require("../tickets/ticketService");

function formatRole(id) {
  return id ? `<@&${id}>` : "미설정";
}

function formatChannel(id) {
  return id ? `<#${id}>` : "미설정";
}

function formatUser(id) {
  return id ? `<@${id}>` : "미설정";
}

function formatUsers(ids) {
  if (!ids?.length) return "미설정";
  return ids.map((id) => `<@${id}>`).join(", ");
}

function formatRoles(ids) {
  if (!ids?.length) return "미설정";
  return ids.map((id) => formatRole(id)).join(", ");
}

function formatUsersList(ids) {
  if (!ids?.length) return "미설정";
  return ids.map((id) => formatUser(id)).join(", ");
}

function formatSeconds(ms) {
  return `${Math.max(0, Math.round((ms || 0) / 1000))}초`;
}

module.exports = {
  data: new SlashCommandBuilder()
    .setName("config")
    .setDescription("온보딩/역할 부여 봇 설정")
    .addSubcommand((sub) =>
      sub
        .setName("set-base-role")
        .setDescription("입장 후 부여할 기본 권한 역할을 설정")
        .addRoleOption((option) =>
          option.setName("role").setDescription("역할").setRequired(true)
        )
    )
    .addSubcommand((sub) =>
      sub
        .setName("set-join-delay")
        .setDescription("입장 후 역할 부여 딜레이(초)")
        .addIntegerOption((option) =>
          option
            .setName("seconds")
            .setDescription("딜레이(초)")
            .setRequired(true)
            .setMinValue(0)
        )
    )
    .addSubcommand((sub) =>
      sub
        .setName("set-intro")
        .setDescription("자기소개 채널/역할/체크 이모지 설정")
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
    .addSubcommand((sub) =>
      sub
        .setName("set-ticket-channel")
        .setDescription("티켓 패널을 게시할 채널 설정")
        .addChannelOption((option) =>
          option
            .setName("channel")
            .setDescription("티켓 채널")
            .setRequired(true)
            .addChannelTypes(ChannelType.GuildText)
        )
    )
    .addSubcommand((sub) =>
      sub
        .setName("set-ticket-recipient")
        .setDescription("티켓 메시지를 받을 담당자 설정")
        .addUserOption((option) =>
          option.setName("user").setDescription("담당자").setRequired(true)
        )
    )
    .addSubcommand((sub) =>
      sub
        .setName("remove-ticket-recipient")
        .setDescription("티켓 담당자 제거")
        .addUserOption((option) =>
          option.setName("user").setDescription("담당자").setRequired(true)
        )
    )
    .addSubcommand((sub) =>
      sub.setName("show").setDescription("현재 설정 보기")
    )
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
              { name: "base_role", value: "base_role" },
              { name: "join_delay", value: "join_delay" },
              { name: "intro_channel", value: "intro_channel" },
              { name: "intro_role", value: "intro_role" },
              { name: "ticket_channel", value: "ticket_channel" },
              { name: "ticket_recipient", value: "ticket_recipient" },
              { name: "command_roles", value: "command_roles" },
              { name: "command_users", value: "command_users" }
            )
        )
    )
    .addSubcommand((sub) =>
      sub.setName("reset").setDescription("모든 설정 초기화")
    ),

  async execute(interaction) {
    if (!interaction.inGuild()) {
      await interaction.reply({
        content: "이 명령은 서버에서만 사용할 수 있어요.",
        ephemeral: true,
      });
      return;
    }

    const guildId = interaction.guild.id;
    const config = getConfig(guildId);
    const hasAdmin = interaction.memberPermissions?.has(
      PermissionsBitField.Flags.ManageGuild
    );
    const hasAllowedRole =
      !!config?.command_role_ids?.length &&
      interaction.member?.roles?.cache?.some((role) =>
        config.command_role_ids.includes(role.id)
      );
    const hasAllowedUser = config?.command_user_ids?.includes(
      interaction.user.id
    );
    if (!hasAdmin && !hasAllowedRole && !hasAllowedUser) {
      await interaction.reply({
        content:
          "이 명령을 사용하려면 서버 관리 권한 또는 허용된 역할이 필요해요.",
        ephemeral: true,
      });
      return;
    }

    const sub = interaction.options.getSubcommand();

    if (sub === "set-base-role") {
      const role = interaction.options.getRole("role", true);
      setBaseRole(guildId, role.id);
      await interaction.reply({
        content: `입장 기본 권한 역할을 ${formatRole(role.id)}로 설정했어요.`,
        ephemeral: true,
      });
      return;
    }

    if (sub === "set-join-delay") {
      const seconds = interaction.options.getInteger("seconds", true);
      const ms = Math.max(0, Number(seconds) * 1000);
      setJoinDelayMs(guildId, ms);
      await interaction.reply({
        content: `입장 딜레이를 ${seconds}초로 설정했어요.`,
        ephemeral: true,
      });
      return;
    }

    if (sub === "set-intro") {
      const channel = interaction.options.getChannel("channel", true);
      const role = interaction.options.getRole("role", true);
      setIntro(guildId, channel.id, role.id);
      await interaction.reply({
        content: `자기소개 채널 ${formatChannel(
          channel.id
        )}, 역할 ${formatRole(role.id)}로 설정했어요.`,
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

    if (sub === "set-ticket-channel") {
      const channel = interaction.options.getChannel("channel", true);
      setTicketChannel(guildId, channel.id);
      let panelPosted = false;
      try {
        await postTicketPanel(channel);
        panelPosted = true;
      } catch (error) {
        console.warn("[ticket-panel] Failed to post panel:", error);
      }
      await interaction.reply({
        content: panelPosted
          ? `티켓 채널을 ${formatChannel(channel.id)}로 설정하고 패널을 게시했어요.`
          : `티켓 채널을 ${formatChannel(
            channel.id
          )}로 설정했어요. 패널 게시에 실패했으니 채널 권한을 확인해주세요.`,
        ephemeral: true,
      });
      return;
    }

    if (sub === "set-ticket-recipient") {
      const user = interaction.options.getUser("user", true);
      addTicketRecipient(guildId, user.id);
      await interaction.reply({
        content: `티켓 담당자에 ${formatUser(user.id)}를 추가했어요.`,
        ephemeral: true,
      });
      return;
    }

    if (sub === "remove-ticket-recipient") {
      const user = interaction.options.getUser("user", true);
      removeTicketRecipient(guildId, user.id);
      await interaction.reply({
        content: `티켓 담당자에서 ${formatUser(user.id)}를 제거했어요.`,
        ephemeral: true,
      });
      return;
    }

    if (sub === "show") {
      const config = getConfig(guildId);
      if (!config) {
        await interaction.reply({
          content: "현재 설정이 없습니다. 먼저 /config 명령으로 설정해주세요.",
          ephemeral: true,
        });
        return;
      }
      const lines = [
        `- base_role: ${formatRole(config.base_role_id)}`,
        `- join_delay: ${formatSeconds(config.join_delay_ms)}`,
        `- intro_channel: ${formatChannel(config.intro_channel_id)}`,
        `- intro_role: ${formatRole(config.intro_role_id)}`,
        `- command_roles: ${formatRoles(config.command_role_ids)}`,
        `- command_users: ${formatUsersList(config.command_user_ids)}`,
        `- ticket_channel: ${formatChannel(config.ticket_channel_id)}`,
        `- ticket_recipient: ${formatUsers(config.ticket_recipient_ids)}`,
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
