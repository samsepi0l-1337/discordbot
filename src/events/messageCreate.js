const { getConfig } = require("../config/guildConfigRepo");
const { assignRole } = require("../utils/discord");

module.exports = {
  name: "messageCreate",
  async execute(message) {
    if (!message.guild || message.author?.bot) return;
    if (message.partial) {
      try {
        await message.fetch();
      } catch {
        return;
      }
    }

    const config = getConfig(message.guild.id);
    if (!config) return;

    const channelId = message.channel.id;

    if (
      config.grant_on_post_channel_id &&
      channelId === config.grant_on_post_channel_id
    ) {
      await assignRole(
        message.member,
        config.grant_on_post_role_id,
        "grant-on-post"
      );
    }

    if (config.intro_channel_id && channelId === config.intro_channel_id) {
      const emoji = config.check_emoji || "✅";
      try {
        await message.react(emoji);
      } catch (error) {
        console.warn("[intro-react] Failed to react:", error);
      }
      await assignRole(message.member, config.intro_role_id, "intro-role");
    }
  },
};
