"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const emoji_1 = require("../core/parsers/emoji");
const serviceContainer_1 = require("../presentation/discord/serviceContainer");
async function resolveMember(reaction, user) {
    const message = reaction.message;
    if (message.member)
        return message.member;
    try {
        return await message.guild?.members.fetch(user.id);
    }
    catch {
        return null;
    }
}
module.exports = {
    name: "messageReactionAdd",
    async execute(reaction, user) {
        if (user?.bot)
            return;
        if (reaction.partial) {
            try {
                await reaction.fetch();
            }
            catch {
                return;
            }
        }
        const message = reaction.message;
        if (!message?.guild)
            return;
        const emojiKey = (0, emoji_1.emojiKeyFromReaction)(reaction.emoji?.id, reaction.emoji?.name);
        if (!emojiKey)
            return;
        const member = await resolveMember(reaction, user);
        if (!member)
            return;
        await serviceContainer_1.reactionRoleService.handleReactionAdd({
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
