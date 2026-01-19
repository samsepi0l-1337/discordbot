const path = require("node:path");
const Database = require("better-sqlite3");

let db;

function getDb() {
  if (db) return db;
  const dbPath = path.join(__dirname, "..", "..", "data", "bot.db");
  db = new Database(dbPath);
  db.pragma("journal_mode = WAL");
  db.exec(`
    CREATE TABLE IF NOT EXISTS guild_config (
      guild_id TEXT PRIMARY KEY,
      join_delay_ms INTEGER DEFAULT 0,
      base_role_id TEXT,
      intro_channel_id TEXT,
      intro_role_id TEXT,
      grant_on_post_channel_id TEXT,
      grant_on_post_role_id TEXT,
      check_emoji TEXT DEFAULT '✅'
    );
  `);
  return db;
}

module.exports = { getDb };
