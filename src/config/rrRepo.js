const { getDb } = require("./db");

function setActiveMessage(guildId, channelId, messageId) {
  const db = getDb();
  db.prepare(
    `
    INSERT INTO rr_active_message (guild_id, channel_id, message_id)
    VALUES (?, ?, ?)
    ON CONFLICT(guild_id) DO UPDATE SET
      channel_id = excluded.channel_id,
      message_id = excluded.message_id
  `,
  ).run(guildId, channelId, messageId);
}

function getActiveMessage(guildId) {
  const db = getDb();
  return db
    .prepare(
      `
      SELECT guild_id, channel_id, message_id
      FROM rr_active_message
      WHERE guild_id = ?
    `,
    )
    .get(guildId);
}

function clearActiveMessage(guildId) {
  const db = getDb();
  db.prepare("DELETE FROM rr_active_message WHERE guild_id = ?").run(guildId);
}

function addRule(rule) {
  const db = getDb();
  const now = Date.now();
  db.prepare(
    `
    INSERT OR IGNORE INTO rr_rules
      (guild_id, message_id, emoji_key, role_id, type, toggle_group, created_at)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `,
  ).run(
    rule.guildId,
    rule.messageId,
    rule.emojiKey,
    rule.roleId,
    rule.type,
    rule.toggleGroup || "",
    now,
  );
}

function listRulesByMessage(guildId, messageId) {
  const db = getDb();
  return db
    .prepare(
      `
      SELECT *
      FROM rr_rules
      WHERE guild_id = ? AND message_id = ?
      ORDER BY created_at ASC
    `,
    )
    .all(guildId, messageId);
}

function listRulesByGuild(guildId) {
  const db = getDb();
  return db
    .prepare(
      `
      SELECT *
      FROM rr_rules
      WHERE guild_id = ?
      ORDER BY message_id ASC, created_at ASC
    `,
    )
    .all(guildId);
}

function listRulesByMessageEmoji(guildId, messageId, emojiKey) {
  const db = getDb();
  return db
    .prepare(
      `
      SELECT *
      FROM rr_rules
      WHERE guild_id = ? AND message_id = ? AND emoji_key = ?
      ORDER BY created_at ASC
    `,
    )
    .all(guildId, messageId, emojiKey);
}

function deleteRulesByMessage(guildId, messageId) {
  const db = getDb();
  return db
    .prepare(
      `
      DELETE FROM rr_rules
      WHERE guild_id = ? AND message_id = ?
    `,
    )
    .run(guildId, messageId).changes;
}

function deleteRulesByEmoji(guildId, messageId, emojiKey) {
  const db = getDb();
  return db
    .prepare(
      `
      DELETE FROM rr_rules
      WHERE guild_id = ? AND message_id = ? AND emoji_key = ?
    `,
    )
    .run(guildId, messageId, emojiKey).changes;
}

function deleteRulesByRole(guildId, messageId, roleId) {
  const db = getDb();
  return db
    .prepare(
      `
      DELETE FROM rr_rules
      WHERE guild_id = ? AND message_id = ? AND role_id = ?
    `,
    )
    .run(guildId, messageId, roleId).changes;
}

function deleteRulesMissingRoles(guildId, messageId, roleIds) {
  const db = getDb();
  const placeholders = roleIds.map(() => "?").join(", ");
  const query =
    placeholders.length ?
      `
      DELETE FROM rr_rules
      WHERE guild_id = ? AND message_id = ? AND role_id NOT IN (${placeholders})
    `
    : `
      DELETE FROM rr_rules
      WHERE guild_id = ? AND message_id = ?
    `;
  const params = [guildId, messageId, ...roleIds];
  return db.prepare(query).run(...params).changes;
}

module.exports = {
  setActiveMessage,
  getActiveMessage,
  clearActiveMessage,
  addRule,
  listRulesByMessage,
  listRulesByGuild,
  listRulesByMessageEmoji,
  deleteRulesByMessage,
  deleteRulesByEmoji,
  deleteRulesByRole,
  deleteRulesMissingRoles,
};
