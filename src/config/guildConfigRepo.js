const { getDb } = require("./db");

function ensureGuildRow(guildId) {
  const db = getDb();
  db.prepare("INSERT OR IGNORE INTO guild_config (guild_id) VALUES (?)").run(
    guildId,
  );
}

function getConfig(guildId) {
  const db = getDb();
  const row = db
    .prepare(
      `
      SELECT guild_id,
             intro_channel_id,
             intro_role_id,
             intro_add_role_id,
             intro_remove_role_id,
             intro_role_mode,
             grant_on_post_channel_id,
             grant_on_post_role_id,
             grant_on_post_message_id,
             grant_on_post_emoji_map,
             command_role_ids,
             command_user_ids,
             check_emoji,
             ticket_channel_id,
             ticket_panel_message_id,
             ticket_category_id,
             ticket_transcript_channel_id,
             ticket_support_role_ids,
             ticket_recipient_id
      FROM guild_config
      WHERE guild_id = ?
    `,
    )
    .get(guildId);
  if (!row) return null;
  const recipientIds =
    row.ticket_recipient_id ?
      row.ticket_recipient_id
        .split(",")
        .map((value) => value.trim())
        .filter(Boolean)
    : [];
  const commandRoleIds =
    row.command_role_ids ?
      row.command_role_ids
        .split(",")
        .map((value) => value.trim())
        .filter(Boolean)
    : [];
  const commandUserIds =
    row.command_user_ids ?
      row.command_user_ids
        .split(",")
        .map((value) => value.trim())
        .filter(Boolean)
    : [];
  const ticketSupportRoleIds =
    row.ticket_support_role_ids ?
      row.ticket_support_role_ids
        .split(",")
        .map((value) => value.trim())
        .filter(Boolean)
    : [];
  let grantOnPostEmojiMap = {};
  if (row.grant_on_post_emoji_map) {
    try {
      grantOnPostEmojiMap = JSON.parse(row.grant_on_post_emoji_map);
    } catch {
      grantOnPostEmojiMap = {};
    }
  }
  // Backwards compatibility:
  // Older schema used intro_role_id + intro_role_mode (one of add/delete) which could not express both.
  // If new columns are empty but legacy exists, map legacy to the corresponding new field.
  const legacyMode = row.intro_role_mode || "add";
  const derivedAdd =
    row.intro_add_role_id ||
    (row.intro_role_id && legacyMode !== "delete" ? row.intro_role_id : null);
  const derivedRemove =
    row.intro_remove_role_id ||
    (row.intro_role_id && legacyMode === "delete" ? row.intro_role_id : null);
  return {
    ...row,
    intro_role_mode: legacyMode,
    intro_add_role_id: derivedAdd,
    intro_remove_role_id: derivedRemove,
    ticket_support_user_ids: recipientIds,
    ticket_support_role_ids: ticketSupportRoleIds,
    command_role_ids: commandRoleIds,
    command_user_ids: commandUserIds,
    grant_on_post_emoji_map: grantOnPostEmojiMap,
  };
}

function setIntro(guildId, channelId, roleId, mode) {
  ensureGuildRow(guildId);
  const normalizedMode =
    mode === "delete" || mode === "remove" ? "remove" : "add";
  const db = getDb();
  if (normalizedMode === "remove") {
    db.prepare(
      `
      UPDATE guild_config
      SET intro_channel_id = ?,
          intro_remove_role_id = ?
      WHERE guild_id = ?
    `,
    ).run(channelId, roleId, guildId);
    return;
  }
  db.prepare(
    `
    UPDATE guild_config
    SET intro_channel_id = ?,
        intro_add_role_id = ?
    WHERE guild_id = ?
  `,
  ).run(channelId, roleId, guildId);
}

function setTicketChannel(guildId, channelId) {
  ensureGuildRow(guildId);
  const db = getDb();
  db.prepare(
    "UPDATE guild_config SET ticket_channel_id = ? WHERE guild_id = ?",
  ).run(channelId, guildId);
}

function setTicketPanelMessage(guildId, messageId) {
  ensureGuildRow(guildId);
  const db = getDb();
  db.prepare(
    "UPDATE guild_config SET ticket_panel_message_id = ? WHERE guild_id = ?",
  ).run(messageId, guildId);
}

function setTicketCategory(guildId, categoryId) {
  ensureGuildRow(guildId);
  const db = getDb();
  db.prepare(
    "UPDATE guild_config SET ticket_category_id = ? WHERE guild_id = ?",
  ).run(categoryId, guildId);
}

function setTicketTranscriptChannel(guildId, channelId) {
  ensureGuildRow(guildId);
  const db = getDb();
  db.prepare(
    "UPDATE guild_config SET ticket_transcript_channel_id = ? WHERE guild_id = ?",
  ).run(channelId, guildId);
}

function addTicketSupportRole(guildId, roleId) {
  ensureGuildRow(guildId);
  const current = getConfig(guildId);
  const ids = current?.ticket_support_role_ids || [];
  if (ids.includes(roleId)) return;
  ids.push(roleId);
  const db = getDb();
  db.prepare(
    "UPDATE guild_config SET ticket_support_role_ids = ? WHERE guild_id = ?",
  ).run(ids.join(","), guildId);
}

function removeTicketSupportRole(guildId, roleId) {
  ensureGuildRow(guildId);
  const current = getConfig(guildId);
  const ids = (current?.ticket_support_role_ids || []).filter(
    (id) => id !== roleId,
  );
  const db = getDb();
  db.prepare(
    "UPDATE guild_config SET ticket_support_role_ids = ? WHERE guild_id = ?",
  ).run(ids.length ? ids.join(",") : null, guildId);
}

function setTicketRecipient(guildId, userId) {
  ensureGuildRow(guildId);
  const db = getDb();
  db.prepare(
    "UPDATE guild_config SET ticket_recipient_id = ? WHERE guild_id = ?",
  ).run(userId, guildId);
}

function addTicketRecipient(guildId, userId) {
  ensureGuildRow(guildId);
  const current = getConfig(guildId);
  const ids = current?.ticket_support_user_ids || [];
  if (ids.includes(userId)) return;
  ids.push(userId);
  const db = getDb();
  db.prepare(
    "UPDATE guild_config SET ticket_recipient_id = ? WHERE guild_id = ?",
  ).run(ids.join(","), guildId);
}

function removeTicketRecipient(guildId, userId) {
  ensureGuildRow(guildId);
  const current = getConfig(guildId);
  const ids = (current?.ticket_support_user_ids || []).filter(
    (id) => id !== userId,
  );
  const db = getDb();
  db.prepare(
    "UPDATE guild_config SET ticket_recipient_id = ? WHERE guild_id = ?",
  ).run(ids.length ? ids.join(",") : null, guildId);
}

function addCommandRole(guildId, roleId) {
  ensureGuildRow(guildId);
  const current = getConfig(guildId);
  const ids = current?.command_role_ids || [];
  if (ids.includes(roleId)) return;
  ids.push(roleId);
  const db = getDb();
  db.prepare(
    "UPDATE guild_config SET command_role_ids = ? WHERE guild_id = ?",
  ).run(ids.join(","), guildId);
}

function removeCommandRole(guildId, roleId) {
  ensureGuildRow(guildId);
  const current = getConfig(guildId);
  const ids = (current?.command_role_ids || []).filter((id) => id !== roleId);
  const db = getDb();
  db.prepare(
    "UPDATE guild_config SET command_role_ids = ? WHERE guild_id = ?",
  ).run(ids.length ? ids.join(",") : null, guildId);
}

function addCommandUser(guildId, userId) {
  ensureGuildRow(guildId);
  const current = getConfig(guildId);
  const ids = current?.command_user_ids || [];
  if (ids.includes(userId)) return;
  ids.push(userId);
  const db = getDb();
  db.prepare(
    "UPDATE guild_config SET command_user_ids = ? WHERE guild_id = ?",
  ).run(ids.join(","), guildId);
}

function removeCommandUser(guildId, userId) {
  ensureGuildRow(guildId);
  const current = getConfig(guildId);
  const ids = (current?.command_user_ids || []).filter((id) => id !== userId);
  const db = getDb();
  db.prepare(
    "UPDATE guild_config SET command_user_ids = ? WHERE guild_id = ?",
  ).run(ids.length ? ids.join(",") : null, guildId);
}

function clearField(guildId, fieldKey) {
  const fieldMap = {
    intro_channel: "intro_channel_id",
    intro_add_role: "intro_add_role_id",
    intro_remove_role: "intro_remove_role_id",
    // legacy fields (kept for older DB rows / compatibility)
    intro_role: "intro_role_id",
    intro_mode: "intro_role_mode",
    check_emoji: "check_emoji",
    ticket_channel: "ticket_channel_id",
    ticket_panel_message: "ticket_panel_message_id",
    ticket_category: "ticket_category_id",
    ticket_transcript_channel: "ticket_transcript_channel_id",
    ticket_support_roles: "ticket_support_role_ids",
    ticket_recipient: "ticket_recipient_id",
    command_roles: "command_role_ids",
    command_users: "command_user_ids",
  };
  const column = fieldMap[fieldKey];
  if (!column) return false;
  ensureGuildRow(guildId);
  const db = getDb();
  db.prepare(`UPDATE guild_config SET ${column} = NULL WHERE guild_id = ?`).run(
    guildId,
  );
  return true;
}

function resetConfig(guildId) {
  const db = getDb();
  db.prepare("DELETE FROM guild_config WHERE guild_id = ?").run(guildId);
}

module.exports = {
  getConfig,
  setIntro,
  setTicketChannel,
  setTicketPanelMessage,
  setTicketCategory,
  setTicketTranscriptChannel,
  addTicketSupportRole,
  removeTicketSupportRole,
  setTicketRecipient,
  addTicketRecipient,
  removeTicketRecipient,
  addCommandRole,
  removeCommandRole,
  addCommandUser,
  removeCommandUser,
  clearField,
  resetConfig,
};
