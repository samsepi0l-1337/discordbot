const { ActionRowBuilder, ButtonBuilder, ButtonStyle } = require("discord.js");
const { getDb } = require("../config/db");

const TICKET_CREATE_BUTTON_ID = "ticket_create";

function buildTicketPanelPayload() {
  const button = new ButtonBuilder()
    .setCustomId(TICKET_CREATE_BUTTON_ID)
    .setLabel("티켓 생성")
    .setStyle(ButtonStyle.Primary);
  const row = new ActionRowBuilder().addComponents(button);
  return {
    content:
      "문의가 필요하시면 아래 버튼을 눌러 티켓을 생성해주세요.\n" +
      "버튼을 누르면 DM으로 안내가 전송됩니다.",
    components: [row],
  };
}

async function postTicketPanel(channel) {
  return channel.send(buildTicketPanelPayload());
}

function createTicketSession(guildId, openerId) {
  const db = getDb();
  const now = Date.now();
  const info = db
    .prepare(
      `
      INSERT INTO ticket_sessions (guild_id, opener_id, status, created_at, updated_at)
      VALUES (?, ?, 'open', ?, ?)
    `
    )
    .run(guildId, openerId, now, now);
  return Number(info.lastInsertRowid);
}

function getLatestOpenTicketForUser(openerId) {
  const db = getDb();
  return db
    .prepare(
      `
      SELECT *
      FROM ticket_sessions
      WHERE opener_id = ? AND status = 'open'
      ORDER BY created_at DESC
      LIMIT 1
    `
    )
    .get(openerId);
}

function getTicketById(ticketId) {
  const db = getDb();
  return db
    .prepare(
      `
      SELECT *
      FROM ticket_sessions
      WHERE id = ?
    `
    )
    .get(ticketId);
}

function touchTicket(ticketId) {
  const db = getDb();
  db.prepare("UPDATE ticket_sessions SET updated_at = ? WHERE id = ?").run(
    Date.now(),
    ticketId
  );
}

function closeTicketSession(ticketId) {
  const db = getDb();
  db.prepare(
    "UPDATE ticket_sessions SET status = 'closed', updated_at = ? WHERE id = ?"
  ).run(Date.now(), ticketId);
}

function storeForwardedMessage(ticketId, guildId, openerId, staffMessageId) {
  const db = getDb();
  db.prepare(
    `
    INSERT OR IGNORE INTO ticket_forwarded_messages
      (ticket_id, guild_id, opener_id, staff_message_id, created_at)
    VALUES (?, ?, ?, ?, ?)
  `
  ).run(ticketId, guildId, openerId, staffMessageId, Date.now());
}

function getForwardedMessage(staffMessageId) {
  const db = getDb();
  return db
    .prepare(
      `
      SELECT *
      FROM ticket_forwarded_messages
      WHERE staff_message_id = ?
    `
    )
    .get(staffMessageId);
}

module.exports = {
  TICKET_CREATE_BUTTON_ID,
  postTicketPanel,
  createTicketSession,
  getLatestOpenTicketForUser,
  getTicketById,
  touchTicket,
  closeTicketSession,
  storeForwardedMessage,
  getForwardedMessage,
};
