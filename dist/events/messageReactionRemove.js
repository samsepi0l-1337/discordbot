"use strict";
const { removeRole } = require("../utils/discord");
const { listRulesByMessageEmoji } = require("../config/rrRepo");
const { getDmEnabled } = require("../config/rrSettingsRepo");
function getEmojiKey(reaction) {
    const emoji = reaction.emoji;
    if (emoji?.id)
        return `c:${emoji.id}`;
    if (emoji?.name)
        return `u:${emoji.name}`;
    return null;
}
async function resolveMember(message, user) {
    if (message.member)
        return message.member;
    try {
        return await message.guild.members.fetch(user.id);
    }
    catch {
        return null;
    }
}
function formatEmojiKey(key) {
    if (!key)
        return "알 수 없음";
    if (key.startsWith("c:"))
        return `<:emoji:${key.slice(2)}>`;
    if (key.startsWith("u:"))
        return key.slice(2);
    return key;
}
module.exports = {
    name: "messageReactionRemove",
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
        const emojiKey = getEmojiKey(reaction);
        if (!emojiKey)
            return;
        const rules = listRulesByMessageEmoji(message.guild.id, message.id, emojiKey);
        if (!rules.length)
            return;
        const member = await resolveMember(message, user);
        if (!member)
            return;
        const dmEnabled = getDmEnabled(message.guild.id);
        const dmLines = [];
        for (const rule of rules) {
            if (rule.type !== "normal" && rule.type !== "toggle")
                continue;
            await removeRole(member, rule.role_id, "rr-remove-reaction");
            dmLines.push(`역할 제거: ${formatEmojiKey(rule.emoji_key)} → <@&${rule.role_id}>`);
        }
        if (dmEnabled && dmLines.length) {
            try {
                await user.send({ content: dmLines.join("\n") });
            }
            catch {
                // ignore dm failure
            }
        }
    },
};
