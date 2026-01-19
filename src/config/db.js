const fs = require("node:fs");
const path = require("node:path");
const Database = require("better-sqlite3");

let db;

function ensureGuildConfigColumns(dbInstance) {
  const columns = dbInstance
    .prepare("PRAGMA table_info(guild_config)")
    .all()
    .map((row) => row.name);
  const missing = [];
  if (!columns.includes("ticket_channel_id")) {
    missing.push("ALTER TABLE guild_config ADD COLUMN ticket_channel_id TEXT");
  }
  if (!columns.includes("ticket_recipient_id")) {
    missing.push("ALTER TABLE guild_config ADD COLUMN ticket_recipient_id TEXT");
  }
  for (const statement of missing) {
    dbInstance.exec(statement);
  }
}

function getDb() {
  if (db) return db;
  const dataDir = path.join(__dirname, "..", "..", "data");
  if (!fs.existsSync(dataDir)) {
    fs.mkdirSync(dataDir, { recursive: true });
  }
  const dbPath = path.join(dataDir, "bot.db");
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
      check_emoji TEXT DEFAULT '✅',
      ticket_channel_id TEXT,
      ticket_recipient_id TEXT
    );
  `);
  ensureGuildConfigColumns(db);
  db.exec(`
    CREATE TABLE IF NOT EXISTS ticket_sessions (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      guild_id TEXT NOT NULL,
      opener_id TEXT NOT NULL,
      status TEXT NOT NULL DEFAULT 'open',
      created_at INTEGER NOT NULL,
      updated_at INTEGER NOT NULL
    );
  `);
  db.exec(`
    CREATE TABLE IF NOT EXISTS ticket_forwarded_messages (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      ticket_id INTEGER NOT NULL,
      guild_id TEXT NOT NULL,
      opener_id TEXT NOT NULL,
      staff_message_id TEXT NOT NULL UNIQUE,
      created_at INTEGER NOT NULL
    );
  `);
  db.exec(`
    CREATE INDEX IF NOT EXISTS idx_ticket_sessions_opener
      ON ticket_sessions (opener_id, status, created_at);
  `);
  db.exec(`
    CREATE INDEX IF NOT EXISTS idx_ticket_forwarded_staff_msg
      ON ticket_forwarded_messages (staff_message_id);
  `);
  return db;
}

module.exports = { getDb };
