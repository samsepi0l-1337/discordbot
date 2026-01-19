"use strict";
const { assignRole, removeRole } = require("../utils/discord");
const { listRulesByMessage, listRulesByMessageEmoji, } = require("../config/rrRepo");
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
        const emojiKey = getEmojiKey(reaction);
        if (!emojiKey)
            return;
        const member = await resolveMember(message, user);
        if (!member)
            return;
        const rules = listRulesByMessageEmoji(message.guild.id, message.id, emojiKey);
        if (!rules.length)
            return;
        const allMessageRules = listRulesByMessage(message.guild.id, message.id);
        const dmEnabled = getDmEnabled(message.guild.id);
        const dmLines = [];
        for (const rule of rules) {
            if (rule.type === "toggle") {
                const group = rule.toggle_group || "default";
                const groupRules = allMessageRules.filter((item) => item.type === "toggle" && (item.toggle_group || "default") === group);
                for (const other of groupRules) {
                    if (other.role_id !== rule.role_id) {
                        await removeRole(member, other.role_id, "rr-toggle-remove");
                    }
                }
            }
            if (rule.type === "remove") {
                await removeRole(member, rule.role_id, "rr-remove");
                dmLines.push(`역할 제거: ${formatEmojiKey(rule.emoji_key)} → <@&${rule.role_id}>`);
                continue;
            }
            await assignRole(member, rule.role_id, `rr-${rule.type}`);
            dmLines.push(`역할 부여: ${formatEmojiKey(rule.emoji_key)} → <@&${rule.role_id}>`);
            if (rule.type === "once") {
                try {
                    await reaction.users.remove(user.id);
                }
                catch {
                    // ignore
                }
            }
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
