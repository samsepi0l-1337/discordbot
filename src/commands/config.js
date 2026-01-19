const {
  SlashCommandBuilder,
  PermissionsBitField,
  ChannelType,
} = require("discord.js");
const {
  DEFAULT_CHECK_EMOJI,
  getConfig,
  setJoinDelayMs,
  setBaseRole,
  setIntro,
  setGrantOnPost,
  clearField,
  resetConfig,
} = require("../config/guildConfigRepo");

function formatRole(id) {
  return id ? `<@&${id}>` : "미설정";
}

function formatChannel(id) {
  return id ? `<#${id}>` : "미설정";
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
        .addStringOption((option) =>
          option
            .setName("emoji")
            .setDescription("체크 이모지(기본 ✅)")
            .setRequired(false)
        )
    )
    .addSubcommand((sub) =>
      sub
        .setName("set-grant-on-post")
        .setDescription("특정 채널 글 작성 시 역할 부여 설정")
        .addChannelOption((option) =>
          option
            .setName("channel")
            .setDescription("권한부여 채널")
            .setRequired(true)
            .addChannelTypes(ChannelType.GuildText)
        )
        .addRoleOption((option) =>
          option.setName("role").setDescription("역할").setRequired(true)
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
              { name: "grant_on_post_channel", value: "grant_on_post_channel" },
              { name: "grant_on_post_role", value: "grant_on_post_role" },
              { name: "check_emoji", value: "check_emoji" }
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

    if (
      !interaction.memberPermissions?.has(
        PermissionsBitField.Flags.ManageGuild
      )
    ) {
      await interaction.reply({
        content: "이 명령을 사용하려면 서버 관리 권한이 필요해요.",
        ephemeral: true,
      });
      return;
    }

    const guildId = interaction.guild.id;
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
      const emoji = interaction.options.getString("emoji");
      setIntro(guildId, channel.id, role.id, emoji);
      await interaction.reply({
        content: `자기소개 채널 ${formatChannel(
          channel.id
        )}, 역할 ${formatRole(role.id)}로 설정했어요.`,
        ephemeral: true,
      });
      return;
    }

    if (sub === "set-grant-on-post") {
      const channel = interaction.options.getChannel("channel", true);
      const role = interaction.options.getRole("role", true);
      setGrantOnPost(guildId, channel.id, role.id);
      await interaction.reply({
        content: `권한부여 채널 ${formatChannel(
          channel.id
        )}, 역할 ${formatRole(role.id)}로 설정했어요.`,
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
        `- grant_on_post_channel: ${formatChannel(
          config.grant_on_post_channel_id
        )}`,
        `- grant_on_post_role: ${formatRole(
          config.grant_on_post_role_id
        )}`,
        `- check_emoji: ${config.check_emoji || DEFAULT_CHECK_EMOJI}`,
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
