const { getDb } = require("./db");

function setDmEnabled(guildId, enabled) {
  const db = getDb();
  db.prepare(
    `
    INSERT INTO rr_settings (guild_id, dm_enabled)
    VALUES (?, ?)
    ON CONFLICT(guild_id) DO UPDATE SET
      dm_enabled = excluded.dm_enabled
  `
  ).run(guildId, enabled ? 1 : 0);
}

function getDmEnabled(guildId) {
  const db = getDb();
  const row = db
    .prepare(
      `
      SELECT dm_enabled
      FROM rr_settings
      WHERE guild_id = ?
    `
    )
    .get(guildId);
  return row ? row.dm_enabled === 1 : false;
}

module.exports = { setDmEnabled, getDmEnabled };
