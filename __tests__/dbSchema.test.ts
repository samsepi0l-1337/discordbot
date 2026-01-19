import { cleanupTestDbPath, setTestDbPath } from "./testDb";

describe("db schema", () => {
  beforeEach(() => {
    setTestDbPath(`schema-${Date.now()}`);
  });

  afterEach(() => {
    cleanupTestDbPath();
  });

  test("creates core tables and columns", () => {
    const { getDb } = require("../src/config/db");
    const db = getDb();

    const tables = db
      .prepare("SELECT name FROM sqlite_master WHERE type = 'table'")
      .all()
      .map((r: { name: string }) => r.name);

    expect(tables).toEqual(
      expect.arrayContaining([
        "guild_config",
        "ticket_sessions",
        "rr_active_message",
        "rr_rules",
        "rr_settings",
        "autoroles",
        "timed_roles",
        "voice_roles",
      ])
    );

    const guildConfigCols = db
      .prepare("PRAGMA table_info(guild_config)")
      .all()
      .map((r: { name: string }) => r.name);
    expect(guildConfigCols).toEqual(
      expect.arrayContaining([
        "guild_id",
        "join_delay_ms",
        "base_role_id",
        "intro_channel_id",
        "intro_role_id",
        "command_role_ids",
        "command_user_ids",
        "ticket_channel_id",
        "ticket_panel_message_id",
        "ticket_category_id",
        "ticket_transcript_channel_id",
        "ticket_support_role_ids",
        "ticket_recipient_id",
      ])
    );

    const ticketCols = db
      .prepare("PRAGMA table_info(ticket_sessions)")
      .all()
      .map((r: { name: string }) => r.name);
    expect(ticketCols).toEqual(
      expect.arrayContaining([
        "id",
        "guild_id",
        "opener_id",
        "channel_id",
        "claimed_by_id",
        "closed_by_id",
        "closed_reason",
        "closed_at",
        "status",
        "created_at",
        "updated_at",
      ])
    );
  });
});
