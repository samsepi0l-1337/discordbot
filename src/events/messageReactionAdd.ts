import { emojiKeyFromReaction } from "../core/parsers/emoji";
import { reactionRoleService } from "../presentation/discord/serviceContainer";
import type { MessageReaction, User } from "discord.js";

async function resolveMember(reaction: MessageReaction, user: User) {
  const message = reaction.message;
  if (message.member) return message.member;
  try {
    return await message.guild?.members.fetch(user.id);
  } catch {
    return null;
  }
}

module.exports = {
  name: "messageReactionAdd",
  async execute(reaction: MessageReaction, user: User) {
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

    const emojiKey = emojiKeyFromReaction(reaction.emoji?.id, reaction.emoji?.name);
    if (!emojiKey) return;

    const member = await resolveMember(reaction, user);
    if (!member) return;

    await reactionRoleService.handleReactionAdd({
      guildId: message.guild.id,
      messageId: message.id,
      emojiKey,
      member,
      userId: user.id,
      removeReaction: (userId) => reaction.users.remove(userId),
      sendDm: (content) => user.send({ content }),
    });
  },
};
