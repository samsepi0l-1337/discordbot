const {
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  ChannelType,
} = require("discord.js");
const { getDb } = require("../config/db");
const { getConfig } = require("../config/guildConfigRepo");

const TICKET_CREATE_BUTTON_ID = "ticket_create";
const TICKET_CLOSE_BUTTON_ID = "ticket_close";
const TICKET_CLAIM_BUTTON_ID = "ticket_claim";
const TICKET_UNCLAIM_BUTTON_ID = "ticket_unclaim";

function buildTicketPanelPayload() {
  const button = new ButtonBuilder()
    .setCustomId(TICKET_CREATE_BUTTON_ID)
    .setLabel("티켓 생성")
    .setStyle(ButtonStyle.Primary);
  const row = new ActionRowBuilder().addComponents(button);
  return {
    content:
      "문의가 필요하시면 아래 버튼을 눌러 티켓을 생성해주세요.\n" +
      "티켓은 비공개 스레드로 생성되며, 지원팀만 볼 수 있어요.",
    components: [row],
  };
}

async function postTicketPanel(channel) {
  return channel.send(buildTicketPanelPayload());
}

function createTicketSession(guildId, openerId, channelId) {
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

function getLatestOpenTicketForUser(guildId, openerId) {
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
    .get(guildId, openerId);
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

function getOpenTicketByChannel(guildId, channelId) {
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
    .get(guildId, channelId);
}

function touchTicket(ticketId) {
  const db = getDb();
  db.prepare("UPDATE ticket_sessions SET updated_at = ? WHERE id = ?").run(
    Date.now(),
    ticketId
  );
}

function closeTicketSession(ticketId, closedById, reason) {
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

function setTicketClaim(ticketId, claimedById) {
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

function isTicketSupport(config, member) {
  if (!member) return false;
  const userId = member.user?.id;
  if (config?.ticket_support_user_ids?.includes(userId)) return true;
  if (!config?.ticket_support_role_ids?.length) return false;
  return member.roles?.cache?.some((role) =>
    config.ticket_support_role_ids.includes(role.id)
  );
}

async function createTicketChannelTicket(interaction, config) {
  const panelChannelId = config?.ticket_channel_id;
  const panelMessageId = config?.ticket_panel_message_id;
  if (!panelChannelId) {
    await interaction.reply({
      content: "티켓 패널 채널이 설정되지 않았어요. 관리자에게 문의해주세요.",
      ephemeral: true,
    });
    return;
  }

  const hasSupportUsers = !!config?.ticket_support_user_ids?.length;
  const hasSupportRoles = !!config?.ticket_support_role_ids?.length;
  if (!hasSupportUsers && !hasSupportRoles) {
    await interaction.reply({
      content: "티켓 지원팀(역할/유저)이 설정되지 않았어요. 관리자에게 문의해주세요.",
      ephemeral: true,
    });
    return;
  }

  const existing = getLatestOpenTicketForUser(
    interaction.guild.id,
    interaction.user.id
  );
  if (existing?.channel_id) {
    await interaction.reply({
      content: `이미 열린 티켓이 있어요. <#${existing.channel_id}>`,
      ephemeral: true,
    });
    return;
  }

  const panelChannel = await interaction.guild.channels
    .fetch(panelChannelId)
    .catch(() => null);
  if (!panelChannel?.isTextBased()) {
    await interaction.reply({
      content: "티켓 패널 채널을 찾을 수 없어요. 설정을 확인해주세요.",
      ephemeral: true,
    });
    return;
  }

  const safeName = interaction.user.username
    .toLowerCase()
    .replace(/[^a-z0-9-]/g, "-")
    .slice(0, 20);
  const threadName = `ticket-${safeName || "user"}`;
  const thread = await panelChannel.threads.create({
    name: threadName,
    type: ChannelType.PrivateThread,
    autoArchiveDuration: 1440,
    reason: "Ticket created",
  });

  await thread.members.add(interaction.user.id).catch(() => null);
  for (const userId of config.ticket_support_user_ids || []) {
    await thread.members.add(userId).catch(() => null);
  }
  for (const roleId of config.ticket_support_role_ids || []) {
    const role = interaction.guild.roles.cache.get(roleId);
    if (!role) continue;
    for (const member of role.members.values()) {
      await thread.members.add(member.id).catch(() => null);
    }
  }

  const ticketId = createTicketSession(
    interaction.guild.id,
    interaction.user.id,
    thread.id
  );

  const closeButton = new ButtonBuilder()
    .setCustomId(TICKET_CLOSE_BUTTON_ID)
    .setLabel("닫기")
    .setStyle(ButtonStyle.Danger);
  const claimButton = new ButtonBuilder()
    .setCustomId(TICKET_CLAIM_BUTTON_ID)
    .setLabel("클레임")
    .setStyle(ButtonStyle.Secondary);
  const row = new ActionRowBuilder().addComponents(claimButton, closeButton);

  await thread.send({
    content: [
      `티켓 #${ticketId}가 생성되었습니다.`,
      `생성자: <@${interaction.user.id}>`,
      "원하시는 문의 내용을 이 채널에 작성해주세요.",
    ].join("\n"),
    components: [row],
  });

  await interaction.reply({
    content: `티켓이 생성되었어요. <#${thread.id}>`,
    ephemeral: true,
  });
}

async function buildTranscriptText(channel) {
  const messages = await channel.messages
    .fetch({ limit: 100 })
    .catch(() => null);
  if (!messages) return "Transcript fetch failed.";
  const lines = [];
  const sorted = [...messages.values()].sort((a, b) => a.createdTimestamp - b.createdTimestamp);
  for (const msg of sorted) {
    const ts = new Date(msg.createdTimestamp).toISOString();
    const author = msg.author?.tag || "Unknown";
    const content = msg.content || "";
    const attachments = msg.attachments?.size
      ? ` attachments=${[...msg.attachments.values()].map((a) => a.url).join(" ")}`
      : "";
    lines.push(`[${ts}] ${author}: ${content}${attachments}`);
  }
  return lines.join("\n");
}

async function ensureThreadUnarchived(channel) {
  if (!channel?.isThread?.()) return;
  if (!channel.archived) return;
  try {
    await channel.setArchived(false);
  } catch {
    // If we can't unarchive, interaction callbacks may fail.
  }
}

async function handleTicketCloseButton(interaction) {
  try {
    await ensureThreadUnarchived(interaction.channel);

    const guildId = interaction.guild.id;
    const ticket = getOpenTicketByChannel(guildId, interaction.channel.id);
    if (!ticket) {
      await interaction.reply({
        content: "티켓을 찾을 수 없어요.",
        ephemeral: true,
      });
      return;
    }

    const config = getConfig(guildId);
    const member = interaction.member;
    const canClose =
      ticket.opener_id === interaction.user.id || isTicketSupport(config, member);
    if (!canClose) {
      await interaction.reply({
        content: "이 티켓을 닫을 권한이 없어요.",
        ephemeral: true,
      });
      return;
    }

    // Ack early (important if we later archive the thread).
    await interaction.deferReply({ ephemeral: true });

    closeTicketSession(ticket.id, interaction.user.id, "closed-by-button");
    touchTicket(ticket.id);

    if (config?.ticket_transcript_channel_id) {
      const transcriptChannel = await interaction.guild.channels
        .fetch(config.ticket_transcript_channel_id)
        .catch(() => null);
      if (transcriptChannel?.isTextBased()) {
        const text = await buildTranscriptText(interaction.channel);
        await transcriptChannel.send({
          content: `티켓 #${ticket.id} 트랜스크립트 (채널: <#${interaction.channel.id}>)`,
          files: [
            {
              attachment: Buffer.from(text, "utf8"),
              name: `ticket-${ticket.id}.txt`,
            },
          ],
        });
      }
    }

    try {
      if (interaction.channel?.isThread?.()) {
        await interaction.channel.setLocked(true);
        await interaction.channel.setArchived(true);
      }
    } catch {
      // ignore
    }

    await interaction.editReply({ content: "티켓을 닫았어요." });
  } catch (error) {
    console.warn("[ticket-close] Failed:", error);
    // Best effort response; may still fail if thread remains archived.
    try {
      if (interaction.deferred || interaction.replied) {
        await interaction.followUp({
          content: "티켓 닫기 처리 중 오류가 발생했어요.",
          ephemeral: true,
        });
      } else {
        await interaction.reply({
          content: "티켓 닫기 처리 중 오류가 발생했어요.",
          ephemeral: true,
        });
      }
    } catch {
      // ignore
    }
  }
}

async function handleTicketClaimButton(interaction) {
  try {
    await ensureThreadUnarchived(interaction.channel);

    const guildId = interaction.guild.id;
    const ticket = getOpenTicketByChannel(guildId, interaction.channel.id);
    if (!ticket) {
      await interaction.reply({
        content: "티켓을 찾을 수 없어요.",
        ephemeral: true,
      });
      return;
    }
    const config = getConfig(guildId);
    if (!isTicketSupport(config, interaction.member)) {
      await interaction.reply({
        content: "지원팀만 클레임할 수 있어요.",
        ephemeral: true,
      });
      return;
    }

    if (interaction.customId === TICKET_CLAIM_BUTTON_ID) {
      setTicketClaim(ticket.id, interaction.user.id);
      const row = new ActionRowBuilder().addComponents(
        new ButtonBuilder()
          .setCustomId(TICKET_UNCLAIM_BUTTON_ID)
          .setLabel("언클레임")
          .setStyle(ButtonStyle.Secondary),
        new ButtonBuilder()
          .setCustomId(TICKET_CLOSE_BUTTON_ID)
          .setLabel("닫기")
          .setStyle(ButtonStyle.Danger)
      );
      await interaction.update({
        content: `이 티켓은 <@${interaction.user.id}>가 클레임했어요.`,
        components: [row],
      });
      return;
    }

    if (interaction.customId === TICKET_UNCLAIM_BUTTON_ID) {
      setTicketClaim(ticket.id, null);
      const row = new ActionRowBuilder().addComponents(
        new ButtonBuilder()
          .setCustomId(TICKET_CLAIM_BUTTON_ID)
          .setLabel("클레임")
          .setStyle(ButtonStyle.Secondary),
        new ButtonBuilder()
          .setCustomId(TICKET_CLOSE_BUTTON_ID)
          .setLabel("닫기")
          .setStyle(ButtonStyle.Danger)
      );
      await interaction.update({
        content: "클레임이 해제되었어요.",
        components: [row],
      });
    }
  } catch (error) {
    console.warn("[ticket-claim] Failed:", error);
    try {
      if (interaction.deferred || interaction.replied) {
        await interaction.followUp({
          content: "클레임 처리 중 오류가 발생했어요.",
          ephemeral: true,
        });
      } else {
        await interaction.reply({
          content: "클레임 처리 중 오류가 발생했어요.",
          ephemeral: true,
        });
      }
    } catch {
      // ignore
    }
  }
}

function purgeOldTickets(retentionMs) {
  const db = getDb();
  const cutoff = Date.now() - retentionMs;
  if (!Number.isFinite(cutoff)) return { sessionsDeleted: 0, forwardsDeleted: 0 };
  const deleteSessions = db
    .prepare(
      `
      DELETE FROM ticket_sessions
      WHERE status = 'closed' AND updated_at < ?
    `
    )
    .run(cutoff);
  return {
    sessionsDeleted: deleteSessions.changes || 0,
    forwardsDeleted: 0,
  };
}

module.exports = {
  TICKET_CREATE_BUTTON_ID,
  TICKET_CLOSE_BUTTON_ID,
  TICKET_CLAIM_BUTTON_ID,
  TICKET_UNCLAIM_BUTTON_ID,
  postTicketPanel,
  createTicketSession,
  getLatestOpenTicketForUser,
  getTicketById,
  getOpenTicketByChannel,
  touchTicket,
  closeTicketSession,
  setTicketClaim,
  createTicketChannelTicket,
  handleTicketCloseButton,
  handleTicketClaimButton,
  purgeOldTickets,
};
