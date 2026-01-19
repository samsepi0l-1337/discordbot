"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.formatRole = formatRole;
exports.formatUser = formatUser;
exports.formatChannel = formatChannel;
exports.formatEmojiKey = formatEmojiKey;
function formatRole(id) {
    return id ? `<@&${id}>` : "미설정";
}
function formatUser(id) {
    return id ? `<@${id}>` : "미설정";
}
function formatChannel(id) {
    return id ? `<#${id}>` : "미설정";
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
