const { getDb } = require("./db");

const DEFAULT_CHECK_EMOJI = "✅";

function ensureGuildRow(guildId) {
  const db = getDb();
  db.prepare("INSERT OR IGNORE INTO guild_config (guild_id) VALUES (?)").run(
    guildId
  );
}

function getConfig(guildId) {
  const db = getDb();
  const row = db
    .prepare(
      `
      SELECT guild_id,
             join_delay_ms,
             base_role_id,
             intro_channel_id,
             intro_role_id,
             grant_on_post_channel_id,
             grant_on_post_role_id,
             check_emoji
      FROM guild_config
      WHERE guild_id = ?
    `
    )
    .get(guildId);
  if (!row) return null;
  return {
    ...row,
    check_emoji: row.check_emoji || DEFAULT_CHECK_EMOJI,
  };
}

function setJoinDelayMs(guildId, joinDelayMs) {
  ensureGuildRow(guildId);
  const db = getDb();
  db.prepare(
    "UPDATE guild_config SET join_delay_ms = ? WHERE guild_id = ?"
  ).run(joinDelayMs, guildId);
}

function setBaseRole(guildId, roleId) {
  ensureGuildRow(guildId);
  const db = getDb();
  db.prepare("UPDATE guild_config SET base_role_id = ? WHERE guild_id = ?").run(
    roleId,
    guildId
  );
}

function setIntro(guildId, channelId, roleId, emoji) {
  ensureGuildRow(guildId);
  const current = getConfig(guildId);
  const finalEmoji = emoji || current?.check_emoji || DEFAULT_CHECK_EMOJI;
  const db = getDb();
  db.prepare(
    `
    UPDATE guild_config
    SET intro_channel_id = ?,
        intro_role_id = ?,
        check_emoji = ?
    WHERE guild_id = ?
  `
  ).run(channelId, roleId, finalEmoji, guildId);
}

function setGrantOnPost(guildId, channelId, roleId) {
  ensureGuildRow(guildId);
  const db = getDb();
  db.prepare(
    `
    UPDATE guild_config
    SET grant_on_post_channel_id = ?,
        grant_on_post_role_id = ?
    WHERE guild_id = ?
  `
  ).run(channelId, roleId, guildId);
}

function clearField(guildId, fieldKey) {
  const fieldMap = {
    base_role: "base_role_id",
    join_delay: "join_delay_ms",
    intro_channel: "intro_channel_id",
    intro_role: "intro_role_id",
    grant_on_post_channel: "grant_on_post_channel_id",
    grant_on_post_role: "grant_on_post_role_id",
    check_emoji: "check_emoji",
  };
  const column = fieldMap[fieldKey];
  if (!column) return false;
  ensureGuildRow(guildId);
  const db = getDb();
  db.prepare(`UPDATE guild_config SET ${column} = NULL WHERE guild_id = ?`).run(
    guildId
  );
  return true;
}

function resetConfig(guildId) {
  const db = getDb();
  db.prepare("DELETE FROM guild_config WHERE guild_id = ?").run(guildId);
}

module.exports = {
  DEFAULT_CHECK_EMOJI,
  getConfig,
  setJoinDelayMs,
  setBaseRole,
  setIntro,
  setGrantOnPost,
  clearField,
  resetConfig,
};
