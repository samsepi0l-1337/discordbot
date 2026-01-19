const {
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  ChannelType,
  PermissionsBitField,
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
      "티켓은 서버 내 전용 채널로 생성되며, 지원팀만 볼 수 있어요.",
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
  if (!config?.ticket_channel_id) {
    await interaction.reply({
      content: "티켓 패널 채널이 설정되지 않았어요. 관리자에게 문의해주세요.",
      ephemeral: true,
    });
    return;
  }
  if (!config?.ticket_category_id) {
    await interaction.reply({
      content: "티켓 카테고리가 설정되지 않았어요. 관리자에게 문의해주세요.",
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

  const guild = interaction.guild;
  const category = await guild.channels
    .fetch(config.ticket_category_id)
    .catch(() => null);
  if (!category || category.type !== ChannelType.GuildCategory) {
    await interaction.reply({
      content: "티켓 카테고리를 찾을 수 없어요. 설정을 확인해주세요.",
      ephemeral: true,
    });
    return;
  }

  const overwrites = [
    {
      id: guild.roles.everyone.id,
      deny: [PermissionsBitField.Flags.ViewChannel],
    },
    {
      id: interaction.user.id,
      allow: [
        PermissionsBitField.Flags.ViewChannel,
        PermissionsBitField.Flags.SendMessages,
        PermissionsBitField.Flags.ReadMessageHistory,
        PermissionsBitField.Flags.AttachFiles,
        PermissionsBitField.Flags.EmbedLinks,
      ],
    },
  ];
  for (const roleId of config.ticket_support_role_ids || []) {
    overwrites.push({
      id: roleId,
      allow: [
        PermissionsBitField.Flags.ViewChannel,
        PermissionsBitField.Flags.SendMessages,
        PermissionsBitField.Flags.ReadMessageHistory,
        PermissionsBitField.Flags.ManageMessages,
      ],
    });
  }
  for (const userId of config.ticket_support_user_ids || []) {
    overwrites.push({
      id: userId,
      allow: [
        PermissionsBitField.Flags.ViewChannel,
        PermissionsBitField.Flags.SendMessages,
        PermissionsBitField.Flags.ReadMessageHistory,
      ],
    });
  }

  const safeName = interaction.user.username
    .toLowerCase()
    .replace(/[^a-z0-9-]/g, "-")
    .slice(0, 20);
  const channelName = `ticket-${safeName || "user"}`;
  const channel = await guild.channels.create({
    name: channelName,
    type: ChannelType.GuildText,
    parent: category.id,
    permissionOverwrites: overwrites,
    topic: `Ticket opener=${interaction.user.id}`,
    reason: "Ticket created",
  });

  const ticketId = createTicketSession(guild.id, interaction.user.id, channel.id);

  const closeButton = new ButtonBuilder()
    .setCustomId(TICKET_CLOSE_BUTTON_ID)
    .setLabel("닫기")
    .setStyle(ButtonStyle.Danger);
  const claimButton = new ButtonBuilder()
    .setCustomId(TICKET_CLAIM_BUTTON_ID)
    .setLabel("클레임")
    .setStyle(ButtonStyle.Secondary);
  const row = new ActionRowBuilder().addComponents(claimButton, closeButton);

  await channel.send({
    content: [
      `티켓 #${ticketId}가 생성되었습니다.`,
      `생성자: <@${interaction.user.id}>`,
      "원하시는 문의 내용을 이 채널에 작성해주세요.",
    ].join("\n"),
    components: [row],
  });

  await interaction.reply({
    content: `티켓이 생성되었어요. <#${channel.id}>`,
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

async function handleTicketCloseButton(interaction) {
  const guildId = interaction.guild.id;
  const ticket = getOpenTicketByChannel(guildId, interaction.channel.id);
  if (!ticket) {
    await interaction.reply({ content: "티켓을 찾을 수 없어요.", ephemeral: true });
    return;
  }
  const config = getConfig(guildId);
  const member = interaction.member;
  const canClose = ticket.opener_id === interaction.user.id || isTicketSupport(config, member);
  if (!canClose) {
    await interaction.reply({ content: "이 티켓을 닫을 권한이 없어요.", ephemeral: true });
    return;
  }

  closeTicketSession(ticket.id, interaction.user.id, "closed-by-button");
  touchTicket(ticket.id);

  try {
    const openerOverwrite = interaction.channel.permissionOverwrites.cache.get(ticket.opener_id);
    await interaction.channel.permissionOverwrites.edit(ticket.opener_id, {
      ViewChannel: true,
      SendMessages: false,
      ReadMessageHistory: true,
    });
    if (openerOverwrite) {
      // noop, edit already applied
    }
  } catch {
    // ignore
  }

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
    await interaction.channel.setName(`closed-${interaction.channel.name}`.slice(0, 100));
  } catch {
    // ignore
  }

  await interaction.reply({ content: "티켓을 닫았어요.", ephemeral: true });
}

async function handleTicketClaimButton(interaction) {
  const guildId = interaction.guild.id;
  const ticket = getOpenTicketByChannel(guildId, interaction.channel.id);
  if (!ticket) {
    await interaction.reply({ content: "티켓을 찾을 수 없어요.", ephemeral: true });
    return;
  }
  const config = getConfig(guildId);
  if (!isTicketSupport(config, interaction.member)) {
    await interaction.reply({ content: "지원팀만 클레임할 수 있어요.", ephemeral: true });
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
