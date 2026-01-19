const { getConfig } = require("../config/guildConfigRepo");
const { assignRole } = require("../utils/discord");
const {
  getLatestOpenTicketForUser,
  getTicketById,
  storeForwardedMessage,
  getForwardedMessage,
  touchTicket,
  closeTicketSession,
} = require("../tickets/ticketService");

async function resolveMember(message) {
  if (message.member) return message.member;
  try {
    return await message.guild.members.fetch(message.author.id);
  } catch {
    return null;
  }
}

module.exports = {
  name: "messageCreate",
  async execute(message) {
    if (message.author?.bot || message.system) return;
    if (message.partial) {
      try {
        await message.fetch();
      } catch {
        return;
      }
    }

    if (!message.guild) {
      await handleDirectMessage(message);
      return;
    }

    const config = getConfig(message.guild.id);
    if (!config) return;

    const member = await resolveMember(message);
    if (!member) return;

    const channelId = message.channel.id;

    if (
      config.intro_channel_id &&
      channelId === config.intro_channel_id &&
      config.intro_role_id
    ) {
      await assignRole(member, config.intro_role_id, "intro-role");
    }
  },
};

function formatAttachments(message) {
  if (!message.attachments?.size) return "";
  const urls = [...message.attachments.values()].map((att) => att.url);
  if (!urls.length) return "";
  return `\n첨부파일:\n${urls.join("\n")}`;
}

async function handleDirectMessage(message) {
  const referenceId = message.reference?.messageId || null;
  if (referenceId) {
    const mapping = getForwardedMessage(referenceId);
    if (mapping) {
      await handleStaffReply(message, mapping);
      return;
    }
  }
  await handleTicketUserMessage(message);
}

async function handleStaffReply(message, mapping) {
  const config = getConfig(mapping.guild_id);
  if (!config?.ticket_recipient_ids?.includes(message.author.id)) {
    await safeDmReply(message, "이 답장은 처리할 수 없어요.");
    return;
  }

  const ticket = getTicketById(mapping.ticket_id);
  if (!ticket || ticket.status !== "open") {
    await safeDmReply(message, "이미 종료된 티켓이에요.");
    return;
  }

  try {
    const opener = await message.client.users.fetch(mapping.opener_id);
    await opener.send({
      content: [
        `담당자 답장 (티켓 #${mapping.ticket_id})`,
        `메시지: ${message.content || "(내용 없음)"}`,
        formatAttachments(message),
      ]
        .filter(Boolean)
        .join("\n"),
    });
    touchTicket(mapping.ticket_id);
    closeTicketSession(mapping.ticket_id);
    await safeDmReply(message, "답장을 전달했어요.");
    await notifyTicketExpired(message, config, mapping.ticket_id);
  } catch (error) {
    console.warn("[ticket-reply] Failed to DM opener:", error);
    await safeDmReply(message, "유저에게 전달하지 못했어요. DM 설정을 확인해주세요.");
  }
}

async function handleTicketUserMessage(message) {
  const ticket = getLatestOpenTicketForUser(message.author.id);
  if (!ticket) {
    await safeDmReply(
      message,
      "열린 티켓이 없어요. 서버의 티켓 생성 버튼을 먼저 눌러주세요."
    );
    return;
  }

  const config = getConfig(ticket.guild_id);
  if (!config?.ticket_recipient_ids?.length) {
    await safeDmReply(
      message,
      "담당자가 설정되지 않았어요. 서버 관리자에게 문의해주세요."
    );
    return;
  }

  const guild =
    message.client.guilds.cache.get(ticket.guild_id) ||
    (await message.client.guilds.fetch(ticket.guild_id).catch(() => null));
  const guildName = guild?.name || "Unknown Guild";
  const recipientIds = config.ticket_recipient_ids;

  try {
    let successCount = 0;
    for (const recipientId of recipientIds) {
      const staffUser = await message.client.users.fetch(recipientId);
      const staffMessage = await staffUser.send({
        content: [
          `새 티켓 메시지 (티켓 #${ticket.id})`,
          `서버: ${guildName}`,
          `보낸 사람: ${message.author.tag}`,
          `메시지: ${message.content || "(내용 없음)"}`,
          formatAttachments(message),
          "이 메시지에 reply로 답장하면 유저에게 전달됩니다.",
        ]
          .filter(Boolean)
          .join("\n"),
      });
      storeForwardedMessage(
        ticket.id,
        ticket.guild_id,
        ticket.opener_id,
        staffMessage.id
      );
      successCount += 1;
    }
    touchTicket(ticket.id);
    if (successCount > 0) {
      await safeDmReply(
        message,
        `담당자 ${successCount}명에게 전달되었습니다. 답장을 기다려주세요.`
      );
    } else {
      await safeDmReply(
        message,
        "담당자에게 전달하지 못했어요. 잠시 후 다시 시도해주세요."
      );
    }
  } catch (error) {
    console.warn("[ticket-forward] Failed to DM staff:", error);
    await safeDmReply(
      message,
      "담당자에게 전달하지 못했어요. 잠시 후 다시 시도해주세요."
    );
  }
}

async function safeDmReply(message, content) {
  try {
    await message.channel.send({ content });
  } catch {
    // Ignore DM failures.
  }
}

async function notifyTicketExpired(message, config, ticketId) {
  const recipients = config.ticket_recipient_ids.filter(
    (id) => id !== message.author.id
  );
  if (!recipients.length) return;
  const notice = `티켓 #${ticketId}는 ${message.author.tag}의 답변으로 종료되었어요.`;
  for (const recipientId of recipients) {
    try {
      const user = await message.client.users.fetch(recipientId);
      await user.send({ content: notice });
    } catch {
      // Ignore DM failures.
    }
  }
}
