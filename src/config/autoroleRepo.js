const { getDb } = require("./db");

function addAutorole(guildId, target, roleId) {
  const db = getDb();
  db.prepare(
    `
    INSERT OR IGNORE INTO autoroles (guild_id, target, role_id)
    VALUES (?, ?, ?)
  `
  ).run(guildId, target, roleId);
}

function removeAutorole(guildId, target, roleId) {
  const db = getDb();
  return db
    .prepare(
      `
      DELETE FROM autoroles
      WHERE guild_id = ? AND target = ? AND role_id = ?
    `
    )
    .run(guildId, target, roleId).changes;
}

function listAutoroles(guildId) {
  const db = getDb();
  return db
    .prepare(
      `
      SELECT *
      FROM autoroles
      WHERE guild_id = ?
      ORDER BY target ASC, role_id ASC
    `
    )
    .all(guildId);
}

module.exports = { addAutorole, removeAutorole, listAutoroles };
