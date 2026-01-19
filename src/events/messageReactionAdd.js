const { getConfig } = require("../config/guildConfigRepo");
const { assignRole } = require("../utils/discord");

function getEmojiKey(reaction) {
  const emoji = reaction.emoji;
  if (emoji?.id) return `c:${emoji.id}`;
  if (emoji?.name) return `u:${emoji.name}`;
  return null;
}

module.exports = {
  name: "messageReactionAdd",
  async execute(reaction, user) {
    if (user?.bot) return;

    if (reaction.partial) {
      try {
        await reaction.fetch();
      } catch {
        return;
      }
    }

    const message = reaction.message;
    if (!message?.guild) return;

    const config = getConfig(message.guild.id);
    if (!config?.grant_on_post_message_id) return;

    if (message.id !== config.grant_on_post_message_id) return;

    const emojiKey = getEmojiKey(reaction);
    if (!emojiKey) return;

    const roleId = config.grant_on_post_emoji_map?.[emojiKey];
    if (!roleId) return;

    let member = message.member;
    if (!member) {
      try {
        member = await message.guild.members.fetch(user.id);
      } catch {
        return;
      }
    }

    await assignRole(member, roleId, "grant-on-reaction");
  },
};
