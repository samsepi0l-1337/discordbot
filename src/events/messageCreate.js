const { getConfig } = require("../config/guildConfigRepo");
const { assignRole } = require("../utils/discord");

async function resolveMember(message) {
  if (message.member) return message.member;
  try {
    return await message.guild.members.fetch(message.author.id);
  } catch {
    return null;
  }
}

module.exports = {
  name: "messageCreate",
  async execute(message) {
    if (!message.guild || message.author?.bot || message.system) return;
    if (message.partial) {
      try {
        await message.fetch();
      } catch {
        return;
      }
    }

    const config = getConfig(message.guild.id);
    if (!config) return;

    const member = await resolveMember(message);
    if (!member) return;

    const channelId = message.channel.id;

    if (
      config.grant_on_post_channel_id &&
      channelId === config.grant_on_post_channel_id &&
      config.grant_on_post_role_id
    ) {
      await assignRole(
        member,
        config.grant_on_post_role_id,
        "grant-on-post"
      );
    }

    if (
      config.intro_channel_id &&
      channelId === config.intro_channel_id &&
      config.intro_role_id
    ) {
      const emoji = config.check_emoji || "✅";
      try {
        await message.react(emoji);
      } catch (error) {
        console.warn("[intro-react] Failed to react:", error);
      }
      await assignRole(member, config.intro_role_id, "intro-role");
    }
  },
};
