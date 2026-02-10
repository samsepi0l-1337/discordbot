import {
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  ChannelType,
  MessageFlags,
  ModalBuilder,
  TextInputBuilder,
  TextInputStyle,
  type GuildMember,
  type Interaction,
  type GuildTextBasedChannel,
  type ModalSubmitInteraction,
  type TextBasedChannel,
} from "discord.js";
import type { TicketRepo } from "../ports/ticketRepo";
import type { GuildConfigRepoPort } from "../ports/guildConfigPort";

export const TICKET_CREATE_BUTTON_ID = "ticket_create";
export const TICKET_CREATE_MODAL_ID = "ticket_create_modal";
export const TICKET_CREATE_MODAL_TITLE_INPUT_ID = "ticket_create_title";
export const TICKET_CLOSE_BUTTON_ID = "ticket_close";
export const TICKET_CLAIM_BUTTON_ID = "ticket_claim";
export const TICKET_UNCLAIM_BUTTON_ID = "ticket_unclaim";

export class TicketService {
  constructor(
    private readonly ticketRepo: TicketRepo,
    private readonly configRepo: GuildConfigRepoPort
  ) { }

  private sanitizeFilenamePart(input: string) {
    const trimmed = String(input || "").trim();
    const safe = trimmed
      // keep ascii letters/numbers, dash/underscore/dot
      .replace(/[^a-zA-Z0-9._-]/g, "-")
      .replace(/-+/g, "-")
      .replace(/^\.+/, "")
      .replace(/^[-_]+/, "")
      .slice(0, 40);
    return safe || "user";
  }

  private async resolveUserLabel(interaction: Interaction, userId: string) {
    // Prefer a stable, readable label for filenames. Fall back to userId.
    try {
      const member = await interaction.guild?.members.fetch(userId).catch(() => null);
      const name =
        member?.displayName ||
        member?.user?.username ||
        member?.user?.tag ||
        "";
      if (name) return this.sanitizeFilenamePart(name);
    } catch {
      // ignore
    }
    try {
      const user = await interaction.client.users.fetch(userId).catch(() => null);
      const name = user?.username || user?.tag || "";
      if (name) return this.sanitizeFilenamePart(name);
    } catch {
      // ignore
    }
    return this.sanitizeFilenamePart(userId);
  }

  private async notifyOpenerClaimed(interaction: Interaction, openerId: string, ticketId: number) {
    // Best-effort DM notification (DMs can be disabled/blocked).
    if (!interaction.inGuild()) return;
    if (interaction.user.id === openerId) return;
    const link = `https://discord.com/channels/${interaction.guildId}/${interaction.channelId}`;
    try {
      const user = await interaction.client.users.fetch(openerId).catch(() => null);
      if (!user) return;
      await user.send({
        content: [
          `티켓 #${ticketId}가 스태프에 의해 클레임되었습니다.`,
          `클레임: <@${interaction.user.id}>`,
          `티켓 링크: ${link}`,
        ].join("\n"),
      });
    } catch {
      // ignore
    }
  }

  buildTicketPanelPayload() {
    const button = new ButtonBuilder()
      .setCustomId(TICKET_CREATE_BUTTON_ID)
      .setLabel("티켓 생성")
      .setStyle(ButtonStyle.Primary);
    const row = new ActionRowBuilder<ButtonBuilder>().addComponents(button);
    return {
      content:
        "문의가 필요하시면 아래 버튼을 눌러 티켓을 생성해주세요.\n" +
        "티켓은 비공개 스레드로 생성되며, 지원팀만 볼 수 있어요.",
      components: [row],
    };
  }

  async postTicketPanel(channel: GuildTextBasedChannel) {
    return channel.send(this.buildTicketPanelPayload());
  }

  getOpenTicketByChannel(guildId: string, channelId: string) {
    return this.ticketRepo.getOpenByChannel(guildId, channelId);
  }

  touchTicket(ticketId: number) {
    this.ticketRepo.touch(ticketId);
  }

  closeTicketSession(ticketId: number, closedById?: string | null, reason?: string | null) {
    this.ticketRepo.close(ticketId, closedById, reason);
  }

  setTicketClaim(ticketId: number, claimedById?: string | null) {
    this.ticketRepo.setClaim(ticketId, claimedById);
  }

  private normalizeThreadTitle(input: string) {
    const raw = String(input || "");
    const trimmed = raw.trim().replace(/\s+/g, " ");
    // Keep unicode (Korean etc.) but remove newlines/control chars.
    const singleLine = trimmed.replace(/[\r\n\t]+/g, " ").trim();
    return singleLine.slice(0, 80);
  }

  private async createTicketThread(
    interaction: Interaction,
    config: any,
    title: string
  ) {
    const panelChannelId = config?.ticket_channel_id;
    if (!panelChannelId) {
      throw new Error("ticket_channel_id not set");
    }

    const panelChannel = await interaction.guild!.channels
      .fetch(panelChannelId)
      .catch(() => null);
    if (!panelChannel?.isTextBased() || !("threads" in panelChannel)) {
      throw new Error("panel channel not found or not thread-capable");
    }

    const safeUser = interaction.user.username
      .toLowerCase()
      .replace(/[^a-z0-9-]/g, "-")
      .slice(0, 20) || "user";

    const cleanTitle = this.normalizeThreadTitle(title);
    const threadName = cleanTitle ? `ticket-${cleanTitle}` : `ticket-${safeUser}`;

    const thread = await panelChannel.threads.create({
      name: threadName.slice(0, 100),
      type: ChannelType.PrivateThread,
      autoArchiveDuration: 1440,
      reason: "Ticket created",
    } as any);

    await thread.members.add(interaction.user.id).catch(() => null);
    for (const userId of config.ticket_support_user_ids || []) {
      await thread.members.add(userId).catch(() => null);
    }
    for (const roleId of config.ticket_support_role_ids || []) {
      const role = interaction.guild!.roles.cache.get(roleId);
      if (!role) continue;
      for (const member of role.members.values()) {
        await thread.members.add(member.id).catch(() => null);
      }
    }

    const ticketId = this.ticketRepo.createSession(
      interaction.guild!.id,
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
    const row = new ActionRowBuilder<ButtonBuilder>().addComponents(
      claimButton,
      closeButton
    );

    await thread.send({
      content: [
        `티켓 #${ticketId}가 생성되었습니다.`,
        `생성자: <@${interaction.user.id}>`,
        cleanTitle ? `제목: ${cleanTitle}` : null,
        "원하시는 문의 내용을 이 채널에 작성해주세요.",
      ]
        .filter(Boolean)
        .join("\n"),
      components: [row],
    });

    return { threadId: thread.id, ticketId };
  }

  private buildTicketCreateModal() {
    const input = new TextInputBuilder()
      .setCustomId(TICKET_CREATE_MODAL_TITLE_INPUT_ID)
      .setLabel("티켓 제목")
      .setStyle(TextInputStyle.Short)
      .setRequired(true)
      .setMinLength(2)
      .setMaxLength(80)
      .setPlaceholder("예: 결제 오류 문의, 역할 지급 요청 등");

    const row = new ActionRowBuilder<TextInputBuilder>().addComponents(input);
    return new ModalBuilder()
      .setCustomId(TICKET_CREATE_MODAL_ID)
      .setTitle("티켓 생성")
      .addComponents(row);
  }

  async createTicketChannelTicket(interaction: Interaction, config: any) {
    if (!interaction.isButton()) return;
    if (!interaction.inGuild()) {
      try {
        await interaction.reply({
          content: "이 버튼은 서버에서만 사용할 수 있어요.",
          flags: MessageFlags.Ephemeral,
        });
      } catch {
        // ignore
      }
      return;
    }

    const panelChannelId = config?.ticket_channel_id;
    if (!panelChannelId) {
      await interaction.reply({
        content: "티켓 패널 채널이 설정되지 않았어요. 관리자에게 문의해주세요.",
        flags: MessageFlags.Ephemeral,
      });
      return;
    }

    const hasSupportUsers = !!config?.ticket_support_user_ids?.length;
    const hasSupportRoles = !!config?.ticket_support_role_ids?.length;
    if (!hasSupportUsers && !hasSupportRoles) {
      await interaction.reply({
        content: "티켓 지원팀(역할/유저)이 설정되지 않았어요. 관리자에게 문의해주세요.",
        flags: MessageFlags.Ephemeral,
      });
      return;
    }

    const existing = this.ticketRepo.getLatestOpenByUser(
      interaction.guild!.id,
      interaction.user.id
    );
    if (existing?.channel_id) {
      await interaction.reply({
        content: `이미 열린 티켓이 있어요. <#${existing.channel_id}>`,
        flags: MessageFlags.Ephemeral,
      });
      return;
    }

    try {
      await interaction.showModal(this.buildTicketCreateModal());
    } catch (error) {
      console.warn("[ticket-create] Failed:", error);
      try {
        if (!interaction.replied && !interaction.deferred) {
          await interaction.reply({
            content: "티켓 생성 창을 열 수 없어요. 잠시 후 다시 시도해주세요.",
            flags: MessageFlags.Ephemeral,
          });
        }
      } catch {
        // ignore
      }
    }
  }

  async handleTicketCreateModalSubmit(interaction: ModalSubmitInteraction, config: any) {
    if (!interaction.inGuild()) {
      await interaction.reply({
        content: "이 작업은 서버에서만 사용할 수 있어요.",
        flags: MessageFlags.Ephemeral,
      });
      return;
    }

    // Acknowledge ASAP (thread creation can take time)
    await interaction.deferReply({ flags: MessageFlags.Ephemeral });

    const panelChannelId = config?.ticket_channel_id;
    if (!panelChannelId) {
      await interaction.editReply({
        content: "티켓 패널 채널이 설정되지 않았어요. 관리자에게 문의해주세요.",
      });
      return;
    }
    const hasSupportUsers = !!config?.ticket_support_user_ids?.length;
    const hasSupportRoles = !!config?.ticket_support_role_ids?.length;
    if (!hasSupportUsers && !hasSupportRoles) {
      await interaction.editReply({
        content: "티켓 지원팀(역할/유저)이 설정되지 않았어요. 관리자에게 문의해주세요.",
      });
      return;
    }

    // Double-check duplicates (user can submit multiple times)
    const existing = this.ticketRepo.getLatestOpenByUser(
      interaction.guild!.id,
      interaction.user.id
    );
    if (existing?.channel_id) {
      await interaction.editReply({
        content: `이미 열린 티켓이 있어요. <#${existing.channel_id}>`,
      });
      return;
    }

    const title = interaction.fields.getTextInputValue(TICKET_CREATE_MODAL_TITLE_INPUT_ID);
    const cleanTitle = this.normalizeThreadTitle(title);
    if (!cleanTitle || cleanTitle.length < 2) {
      await interaction.editReply({
        content: "제목은 2자 이상 입력해주세요.",
      });
      return;
    }

    try {
      const { threadId } = await this.createTicketThread(interaction, config, cleanTitle);
      await interaction.editReply({
        content: `티켓이 생성되었어요. <#${threadId}>`,
      });
    } catch (error) {
      console.warn("[ticket-create-modal] Failed:", error);
      await interaction.editReply({
        content: "티켓 생성에 실패했어요. 권한/설정을 확인해주세요.",
      });
    }
  }

  private isTicketSupport(config: any, member: GuildMember | null) {
    if (!member) return false;
    const userId = member.user?.id;
    if (config?.ticket_support_user_ids?.includes(userId)) return true;
    if (!config?.ticket_support_role_ids?.length) return false;
    return member.roles?.cache?.some((role) =>
      config.ticket_support_role_ids.includes(role.id)
    );
  }

  private async isTicketParticipant(interaction: Interaction) {
    // In Private Thread tickets, being a thread member == "in the ticket".
    if (!interaction.channel?.isThread?.()) return false;
    try {
      const me = await interaction.channel.members.fetch(interaction.user.id).catch(() => null);
      return Boolean(me);
    } catch {
      return false;
    }
  }

  private async buildTranscriptText(channel: TextBasedChannel) {
    const messages = await channel.messages.fetch({ limit: 100 }).catch(() => null);
    if (!messages) return "Transcript fetch failed.";
    const lines: string[] = [];
    const sorted = [...messages.values()].sort(
      (a, b) => a.createdTimestamp - b.createdTimestamp
    );
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

  private async ensureThreadUnarchived(channel: TextBasedChannel | null | undefined) {
    if (!channel?.isThread?.()) return;
    if (!channel.archived) return;
    try {
      await channel.setArchived(false);
    } catch {
      // ignore
    }
  }

  async handleTicketCloseButton(interaction: Interaction) {
    if (!interaction.isButton()) return;
    try {
      await this.ensureThreadUnarchived(interaction.channel as TextBasedChannel);

      const guildId = interaction.guild!.id;
      const ticket = this.ticketRepo.getOpenByChannel(
        guildId,
        interaction.channel!.id
      );
      if (!ticket) {
        await interaction.reply({
          content: "티켓을 찾을 수 없어요.",
          flags: MessageFlags.Ephemeral,
        });
        return;
      }

      const config = this.configRepo.getConfig(guildId);
      const canClose =
        ticket.opener_id === interaction.user.id ||
        this.isTicketSupport(config, interaction.member as GuildMember) ||
        (await this.isTicketParticipant(interaction));
      if (!canClose) {
        await interaction.reply({
          content: "이 티켓을 닫을 권한이 없어요.",
          flags: MessageFlags.Ephemeral,
        });
        return;
      }

      await interaction.deferReply({ flags: MessageFlags.Ephemeral });
      this.ticketRepo.close(ticket.id, interaction.user.id, "closed-by-button");
      this.ticketRepo.touch(ticket.id);

      // Update the control message (the one with buttons) to show closed state
      // and remove claim/close buttons.
      try {
        await interaction.message.edit({
          content: [
            "해당 티켓은 닫혔습니다.",
            `티켓 #${ticket.id}`,
            `닫은 사람: <@${interaction.user.id}>`,
          ].join("\n"),
          components: [],
        });
      } catch {
        // ignore (missing perms, message deleted, etc.)
      }

      if (config?.ticket_transcript_channel_id) {
        const transcriptChannel = await interaction.guild!.channels
          .fetch(config.ticket_transcript_channel_id)
          .catch(() => null);
        if (transcriptChannel?.isTextBased()) {
          const text = await this.buildTranscriptText(interaction.channel as TextBasedChannel);
          const openerLabel = await this.resolveUserLabel(interaction, ticket.opener_id);
          await transcriptChannel.send({
            content: `티켓 #${ticket.id} (생성자: <@${ticket.opener_id}> | ID: ${ticket.opener_id}) 트랜스크립트`,
            files: [
              {
                attachment: Buffer.from(text, "utf8"),
                name: `ticket-${ticket.id}-${openerLabel}.txt`,
              },
            ],
          });
        }
      }

      try {
        if (interaction.channel?.isThread?.()) {
          // Locking makes the thread read-only for regular members.
          // Keep it unarchived so participants can still easily view the history.
          await interaction.channel.setLocked(true);
        }
      } catch {
        // ignore
      }

      await interaction.editReply({ content: "티켓을 닫았어요." });
    } catch (error) {
      console.warn("[ticket-close] Failed:", error);
      try {
        if (interaction.deferred || interaction.replied) {
          await interaction.followUp({
            content: "티켓 닫기 처리 중 오류가 발생했어요.",
            flags: MessageFlags.Ephemeral,
          });
        } else {
          await interaction.reply({
            content: "티켓 닫기 처리 중 오류가 발생했어요.",
            flags: MessageFlags.Ephemeral,
          });
        }
      } catch {
        // ignore
      }
    }
  }

  async handleTicketClaimButton(interaction: Interaction) {
    if (!interaction.isButton()) return;
    try {
      await this.ensureThreadUnarchived(interaction.channel as TextBasedChannel);

      const guildId = interaction.guild!.id;
      const ticket = this.ticketRepo.getOpenByChannel(
        guildId,
        interaction.channel!.id
      );
      if (!ticket) {
        await interaction.reply({
          content: "티켓을 찾을 수 없어요.",
          flags: MessageFlags.Ephemeral,
        });
        return;
      }
      const config = this.configRepo.getConfig(guildId);
      if (!this.isTicketSupport(config, interaction.member as GuildMember)) {
        await interaction.reply({
          content: "지원팀만 클레임할 수 있어요.",
          flags: MessageFlags.Ephemeral,
        });
        return;
      }

      await interaction.deferUpdate();

      if (interaction.customId === TICKET_CLAIM_BUTTON_ID) {
        this.ticketRepo.setClaim(ticket.id, interaction.user.id);
        await this.notifyOpenerClaimed(interaction, ticket.opener_id, ticket.id);
        const row = new ActionRowBuilder<ButtonBuilder>().addComponents(
          new ButtonBuilder()
            .setCustomId(TICKET_UNCLAIM_BUTTON_ID)
            .setLabel("언클레임")
            .setStyle(ButtonStyle.Secondary),
          new ButtonBuilder()
            .setCustomId(TICKET_CLOSE_BUTTON_ID)
            .setLabel("닫기")
            .setStyle(ButtonStyle.Danger)
        );
        await interaction.message.edit({
          content: `이 티켓은 <@${interaction.user.id}>가 클레임했어요.`,
          components: [row],
        });
        return;
      }

      if (interaction.customId === TICKET_UNCLAIM_BUTTON_ID) {
        this.ticketRepo.setClaim(ticket.id, null);
        const row = new ActionRowBuilder<ButtonBuilder>().addComponents(
          new ButtonBuilder()
            .setCustomId(TICKET_CLAIM_BUTTON_ID)
            .setLabel("클레임")
            .setStyle(ButtonStyle.Secondary),
          new ButtonBuilder()
            .setCustomId(TICKET_CLOSE_BUTTON_ID)
            .setLabel("닫기")
            .setStyle(ButtonStyle.Danger)
        );
        await interaction.message.edit({
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
            flags: MessageFlags.Ephemeral,
          });
        } else {
          await interaction.reply({
            content: "클레임 처리 중 오류가 발생했어요.",
            flags: MessageFlags.Ephemeral,
          });
        }
      } catch {
        // ignore
      }
    }
  }

  purgeOldTickets(retentionMs: number) {
    const cutoff = Date.now() - retentionMs;
    if (!Number.isFinite(cutoff)) return { sessionsDeleted: 0, forwardsDeleted: 0 };
    const sessionsDeleted = this.ticketRepo.purgeClosedBefore(cutoff);
    return { sessionsDeleted, forwardsDeleted: 0 };
  }
}
