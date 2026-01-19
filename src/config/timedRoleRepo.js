const { getDb } = require("./db");

function addTimedRole(guildId, roleId, delayMs) {
  const db = getDb();
  db.prepare(
    `
    INSERT INTO timed_roles (guild_id, role_id, delay_ms)
    VALUES (?, ?, ?)
    ON CONFLICT(guild_id, role_id) DO UPDATE SET
      delay_ms = excluded.delay_ms
  `
  ).run(guildId, roleId, delayMs);
}

function removeTimedRole(guildId, roleId) {
  const db = getDb();
  return db
    .prepare(
      `
      DELETE FROM timed_roles
      WHERE guild_id = ? AND role_id = ?
    `
    )
    .run(guildId, roleId).changes;
}

function listTimedRoles(guildId) {
  const db = getDb();
  return db
    .prepare(
      `
      SELECT *
      FROM timed_roles
      WHERE guild_id = ?
      ORDER BY delay_ms ASC
    `
    )
    .all(guildId);
}

module.exports = { addTimedRole, removeTimedRole, listTimedRoles };
