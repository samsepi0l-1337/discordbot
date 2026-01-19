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
  if (!columns.includes("grant_on_post_message_id")) {
    missing.push(
      "ALTER TABLE guild_config ADD COLUMN grant_on_post_message_id TEXT"
    );
  }
  if (!columns.includes("grant_on_post_emoji_map")) {
    missing.push(
      "ALTER TABLE guild_config ADD COLUMN grant_on_post_emoji_map TEXT"
    );
  }
  if (!columns.includes("command_role_ids")) {
    missing.push("ALTER TABLE guild_config ADD COLUMN command_role_ids TEXT");
  }
  if (!columns.includes("command_user_ids")) {
    missing.push("ALTER TABLE guild_config ADD COLUMN command_user_ids TEXT");
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
      grant_on_post_message_id TEXT,
      grant_on_post_emoji_map TEXT,
      command_role_ids TEXT,
      command_user_ids TEXT,
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
    CREATE TABLE IF NOT EXISTS rr_active_message (
      guild_id TEXT PRIMARY KEY,
      channel_id TEXT NOT NULL,
      message_id TEXT NOT NULL
    );
  `);
  db.exec(`
    CREATE TABLE IF NOT EXISTS rr_rules (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      guild_id TEXT NOT NULL,
      message_id TEXT NOT NULL,
      emoji_key TEXT NOT NULL,
      role_id TEXT NOT NULL,
      type TEXT NOT NULL,
      toggle_group TEXT,
      created_at INTEGER NOT NULL,
      UNIQUE(guild_id, message_id, emoji_key, role_id, type, toggle_group)
    );
  `);
  db.exec(`
    CREATE TABLE IF NOT EXISTS rr_settings (
      guild_id TEXT PRIMARY KEY,
      dm_enabled INTEGER NOT NULL DEFAULT 0
    );
  `);
  db.exec(`
    CREATE TABLE IF NOT EXISTS autoroles (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      guild_id TEXT NOT NULL,
      target TEXT NOT NULL,
      role_id TEXT NOT NULL,
      UNIQUE(guild_id, target, role_id)
    );
  `);
  db.exec(`
    CREATE TABLE IF NOT EXISTS timed_roles (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      guild_id TEXT NOT NULL,
      role_id TEXT NOT NULL,
      delay_ms INTEGER NOT NULL,
      UNIQUE(guild_id, role_id)
    );
  `);
  db.exec(`
    CREATE TABLE IF NOT EXISTS voice_roles (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      guild_id TEXT NOT NULL,
      voice_channel_id TEXT NOT NULL,
      role_id TEXT NOT NULL,
      UNIQUE(guild_id, voice_channel_id, role_id)
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
  db.exec(`
    CREATE INDEX IF NOT EXISTS idx_rr_rules_message
      ON rr_rules (guild_id, message_id, emoji_key);
  `);
  return db;
}

module.exports = { getDb };
