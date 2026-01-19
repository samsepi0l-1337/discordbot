"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.SqliteTicketRepo = void 0;
const db_1 = require("../../config/db");
class SqliteTicketRepo {
    createSession(guildId, openerId, channelId) {
        const db = (0, db_1.getDb)();
        const now = Date.now();
        const info = db
            .prepare(`
        INSERT INTO ticket_sessions (guild_id, opener_id, channel_id, status, created_at, updated_at)
        VALUES (?, ?, ?, 'open', ?, ?)
      `)
            .run(guildId, openerId, channelId, now, now);
        return Number(info.lastInsertRowid);
    }
    getLatestOpenByUser(guildId, openerId) {
        const db = (0, db_1.getDb)();
        return db
            .prepare(`
        SELECT *
        FROM ticket_sessions
        WHERE guild_id = ? AND opener_id = ? AND status = 'open'
        ORDER BY created_at DESC
        LIMIT 1
      `)
            .get(guildId, openerId);
    }
    getById(ticketId) {
        const db = (0, db_1.getDb)();
        return db
            .prepare(`
        SELECT *
        FROM ticket_sessions
        WHERE id = ?
      `)
            .get(ticketId);
    }
    getOpenByChannel(guildId, channelId) {
        const db = (0, db_1.getDb)();
        return db
            .prepare(`
        SELECT *
        FROM ticket_sessions
        WHERE guild_id = ? AND channel_id = ? AND status = 'open'
        ORDER BY created_at DESC
        LIMIT 1
      `)
            .get(guildId, channelId);
    }
    touch(ticketId) {
        const db = (0, db_1.getDb)();
        db.prepare("UPDATE ticket_sessions SET updated_at = ? WHERE id = ?").run(Date.now(), ticketId);
    }
    close(ticketId, closedById, reason) {
        const db = (0, db_1.getDb)();
        db.prepare(`
      UPDATE ticket_sessions
      SET status = 'closed',
          closed_by_id = ?,
          closed_reason = ?,
          closed_at = ?,
          updated_at = ?
      WHERE id = ?
    `).run(closedById || null, reason || null, Date.now(), Date.now(), ticketId);
    }
    setClaim(ticketId, claimedById) {
        const db = (0, db_1.getDb)();
        db.prepare(`
      UPDATE ticket_sessions
      SET claimed_by_id = ?,
          updated_at = ?
      WHERE id = ?
    `).run(claimedById || null, Date.now(), ticketId);
    }
    purgeClosedBefore(timestampMs) {
        const db = (0, db_1.getDb)();
        const deleteSessions = db
            .prepare(`
        DELETE FROM ticket_sessions
        WHERE status = 'closed' AND updated_at < ?
      `)
            .run(timestampMs);
        return deleteSessions.changes || 0;
    }
}
exports.SqliteTicketRepo = SqliteTicketRepo;
