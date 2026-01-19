import type { TicketRepo, TicketSession } from "../../application/ports/ticketRepo";
import { getDb } from "../../config/db";

export class SqliteTicketRepo implements TicketRepo {
  createSession(guildId: string, openerId: string, channelId: string) {
    const db = getDb();
    const now = Date.now();
    const info = db
      .prepare(
        `
        INSERT INTO ticket_sessions (guild_id, opener_id, channel_id, status, created_at, updated_at)
        VALUES (?, ?, ?, 'open', ?, ?)
      `
      )
      .run(guildId, openerId, channelId, now, now);
    return Number(info.lastInsertRowid);
  }

  getLatestOpenByUser(guildId: string, openerId: string) {
    const db = getDb();
    return db
      .prepare(
        `
        SELECT *
        FROM ticket_sessions
        WHERE guild_id = ? AND opener_id = ? AND status = 'open'
        ORDER BY created_at DESC
        LIMIT 1
      `
      )
      .get(guildId, openerId) as TicketSession | undefined;
  }

  getById(ticketId: number) {
    const db = getDb();
    return db
      .prepare(
        `
        SELECT *
        FROM ticket_sessions
        WHERE id = ?
      `
      )
      .get(ticketId) as TicketSession | undefined;
  }

  getOpenByChannel(guildId: string, channelId: string) {
    const db = getDb();
    return db
      .prepare(
        `
        SELECT *
        FROM ticket_sessions
        WHERE guild_id = ? AND channel_id = ? AND status = 'open'
        ORDER BY created_at DESC
        LIMIT 1
      `
      )
      .get(guildId, channelId) as TicketSession | undefined;
  }

  touch(ticketId: number) {
    const db = getDb();
    db.prepare("UPDATE ticket_sessions SET updated_at = ? WHERE id = ?").run(
      Date.now(),
      ticketId
    );
  }

  close(ticketId: number, closedById?: string | null, reason?: string | null) {
    const db = getDb();
    db.prepare(
      `
      UPDATE ticket_sessions
      SET status = 'closed',
          closed_by_id = ?,
          closed_reason = ?,
          closed_at = ?,
          updated_at = ?
      WHERE id = ?
    `
    ).run(closedById || null, reason || null, Date.now(), Date.now(), ticketId);
  }

  setClaim(ticketId: number, claimedById?: string | null) {
    const db = getDb();
    db.prepare(
      `
      UPDATE ticket_sessions
      SET claimed_by_id = ?,
          updated_at = ?
      WHERE id = ?
    `
    ).run(claimedById || null, Date.now(), ticketId);
  }

  purgeClosedBefore(timestampMs: number) {
    const db = getDb();
    const deleteSessions = db
      .prepare(
        `
        DELETE FROM ticket_sessions
        WHERE status = 'closed' AND updated_at < ?
      `
      )
      .run(timestampMs);
    return deleteSessions.changes || 0;
  }
}
