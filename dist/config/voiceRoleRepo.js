"use strict";
const { getDb } = require("./db");
function addVoiceRole(guildId, voiceChannelId, roleId) {
    const db = getDb();
    db.prepare(`
    INSERT OR IGNORE INTO voice_roles (guild_id, voice_channel_id, role_id)
    VALUES (?, ?, ?)
  `).run(guildId, voiceChannelId, roleId);
}
function removeVoiceRole(guildId, voiceChannelId, roleId) {
    const db = getDb();
    return db
        .prepare(`
      DELETE FROM voice_roles
      WHERE guild_id = ? AND voice_channel_id = ? AND role_id = ?
    `)
        .run(guildId, voiceChannelId, roleId).changes;
}
function listVoiceRoles(guildId) {
    const db = getDb();
    return db
        .prepare(`
      SELECT *
      FROM voice_roles
      WHERE guild_id = ?
      ORDER BY voice_channel_id ASC, role_id ASC
    `)
        .all(guildId);
}
function listVoiceRolesByChannel(guildId, voiceChannelId) {
    const db = getDb();
    return db
        .prepare(`
      SELECT *
      FROM voice_roles
      WHERE guild_id = ? AND voice_channel_id = ?
      ORDER BY role_id ASC
    `)
        .all(guildId, voiceChannelId);
}
module.exports = {
    addVoiceRole,
    removeVoiceRole,
    listVoiceRoles,
    listVoiceRolesByChannel,
};
