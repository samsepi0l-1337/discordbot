"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.parseEmojiToken = parseEmojiToken;
exports.emojiKeyFromReaction = emojiKeyFromReaction;
function parseEmojiToken(token) {
    const trimmed = token.trim();
    if (!trimmed)
        return null;
    const customMatch = trimmed.match(/^<a?:\w+:(\d+)>$/);
    if (customMatch) {
        return { key: `c:${customMatch[1]}`, raw: trimmed };
    }
    return { key: `u:${trimmed}`, raw: trimmed };
}
function emojiKeyFromReaction(emojiId, emojiName) {
    if (emojiId)
        return `c:${emojiId}`;
    if (emojiName)
        return `u:${emojiName}`;
    return null;
}
