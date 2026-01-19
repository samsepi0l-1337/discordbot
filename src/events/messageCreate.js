const { getConfig } = require("../config/guildConfigRepo");
const { assignRole } = require("../utils/discord");
const {
  getLatestOpenTicketForUser,
  storeForwardedMessage,
  getForwardedMessage,
  touchTicket,
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
      config.grant_on_post_channel_id &&
      channelId === config.grant_on_post_channel_id &&
      config.grant_on_post_role_id
    ) {
      await assignRole(
        member,
        config.grant_on_post_role_id,
        "grant-on-post"
      );
    }

    if (
      config.intro_channel_id &&
      channelId === config.intro_channel_id &&
      config.intro_role_id
    ) {
      const emoji = config.check_emoji || "✅";
      try {
        await message.react(emoji);
      } catch (error) {
        console.warn("[intro-react] Failed to react:", error);
      }
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
  if (!config || config.ticket_recipient_id !== message.author.id) {
    await safeDmReply(message, "이 답장은 처리할 수 없어요.");
    return;
  }

  try {
    const opener = await message.client.users.fetch(mapping.opener_id);
    await opener.send({
      content: [
        `담당자 답장 (티켓 #${mapping.ticket_id})`,
        message.content || "(내용 없음)",
        formatAttachments(message),
      ]
        .filter(Boolean)
        .join("\n"),
    });
    touchTicket(mapping.ticket_id);
    await safeDmReply(message, "답장을 전달했어요.");
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
  if (!config?.ticket_recipient_id) {
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

  try {
    const staffUser = await message.client.users.fetch(
      config.ticket_recipient_id
    );
    const staffMessage = await staffUser.send({
      content: [
        `새 티켓 메시지 (티켓 #${ticket.id})`,
        `서버: ${guildName}`,
        `보낸 사람: ${message.author.tag} (${message.author.id})`,
        message.content || "(내용 없음)",
        formatAttachments(message),
        "이 메시지에 reply로 답장하면 유저에게 전달돼요.",
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
    touchTicket(ticket.id);
    await safeDmReply(message, "담당자에게 전달했어요. 답장을 기다려주세요.");
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
