import { TicketService } from "../../src/application/services/ticketService";
import { ButtonStyle, ChannelType } from "discord.js";

describe("application: TicketService", () => {
  let ticketRepo: any;
  let configRepo: any;
  let service: TicketService;

  beforeEach(() => {
    ticketRepo = {
      getLatestOpenByUser: jest.fn(),
      getOpenByChannel: jest.fn(),
      createSession: jest.fn(),
      close: jest.fn(),
      touch: jest.fn(),
      setClaim: jest.fn(),
      purgeClosedBefore: jest.fn(),
    };
    configRepo = { getConfig: jest.fn() };
    service = new TicketService(ticketRepo, configRepo);
  });

  test("buildTicketPanelPayload: returns correct structure", () => {
    const payload = service.buildTicketPanelPayload();
    expect(payload.content).toContain("문의");
    const buttonData = (payload.components[0].components[0] as any).data;
    expect(buttonData.style).toBe(ButtonStyle.Primary);
    expect(buttonData.label).toBe("티켓 생성");
  });

  describe("createTicketChannelTicket", () => {
    let interaction: any;
    let config: any;

    beforeEach(() => {
      interaction = {
        isButton: () => true,
        guild: {
          id: "g1",
          channels: { fetch: jest.fn() },
          roles: { cache: { get: jest.fn() } },
        },
        user: { id: "u1", username: "tester" },
        reply: jest.fn().mockResolvedValue(null),
      };
      config = {
        ticket_channel_id: "panel_chan",
        ticket_support_user_ids: ["staff1"],
        ticket_support_role_ids: [],
      };
    });

    test("fails if ticket_channel_id is missing", async () => {
      await service.createTicketChannelTicket(interaction, {});
      expect(interaction.reply).toHaveBeenCalledWith(expect.objectContaining({ content: expect.stringContaining("설정되지 않았어요") }));
    });

    test("fails if existing open ticket exists", async () => {
      ticketRepo.getLatestOpenByUser.mockReturnValue({ channel_id: "existing_chan" });
      await service.createTicketChannelTicket(interaction, config);
      expect(interaction.reply).toHaveBeenCalledWith(expect.objectContaining({ content: expect.stringContaining("이미 열린 티켓") }));
    });

    test("creates thread and session on success", async () => {
      ticketRepo.getLatestOpenByUser.mockReturnValue(null);
      const mockThread = {
        id: "t1",
        members: { add: jest.fn().mockResolvedValue(null) },
        send: jest.fn().mockResolvedValue(null),
      };
      interaction.guild.channels.fetch.mockResolvedValue({
        isTextBased: () => true,
        threads: { create: jest.fn().mockResolvedValue(mockThread) },
      });
      ticketRepo.createSession.mockReturnValue(123);

      await service.createTicketChannelTicket(interaction, config);

      expect(ticketRepo.createSession).toHaveBeenCalledWith("g1", "u1", "t1");
      expect(mockThread.send).toHaveBeenCalledWith(expect.objectContaining({ content: expect.stringContaining("티켓 #123") }));
      expect(interaction.reply).toHaveBeenCalledWith(expect.objectContaining({ content: expect.stringContaining("<#t1>") }));
    });
  });

  describe("handleTicketCloseButton", () => {
    let interaction: any;

    beforeEach(() => {
      interaction = {
        isButton: () => true,
        guild: { id: "g1", channels: { fetch: jest.fn() } },
        channel: { id: "t1", isThread: () => true, archived: false, setLocked: jest.fn(), setArchived: jest.fn(), messages: { fetch: jest.fn() } },
        user: { id: "u1" },
        member: { id: "u1", roles: { cache: [] } },
        deferReply: jest.fn().mockResolvedValue(null),
        reply: jest.fn().mockResolvedValue(null),
        editReply: jest.fn().mockResolvedValue(null),
      };
    });

    test("fails if ticket not found", async () => {
      ticketRepo.getOpenByChannel.mockReturnValue(null);
      await service.handleTicketCloseButton(interaction);
      expect(interaction.reply).toHaveBeenCalledWith(expect.objectContaining({ content: "티켓을 찾을 수 없어요." }));
    });

    test("closes ticket if user is opener", async () => {
      ticketRepo.getOpenByChannel.mockReturnValue({ id: 123, opener_id: "u1" });
      configRepo.getConfig.mockReturnValue({});
      interaction.channel.messages.fetch.mockResolvedValue({ values: () => [] });

      await service.handleTicketCloseButton(interaction);

      expect(ticketRepo.close).toHaveBeenCalledWith(123, "u1", "closed-by-button");
      expect(interaction.channel.setLocked).toHaveBeenCalledWith(true);
      expect(interaction.channel.setArchived).toHaveBeenCalledWith(true);
    });

    test("fails if user is not opener and not support", async () => {
      ticketRepo.getOpenByChannel.mockReturnValue({ id: 123, opener_id: "other" });
      configRepo.getConfig.mockReturnValue({ ticket_support_user_ids: ["staff"] });
      
      await service.handleTicketCloseButton(interaction);

      expect(interaction.reply).toHaveBeenCalledWith(expect.objectContaining({ content: expect.stringContaining("권한이 없어요") }));
    });
  });

  test("purgeOldTickets: calls repo", () => {
    ticketRepo.purgeClosedBefore.mockReturnValue(5);
    const now = Date.now();
    const result = service.purgeOldTickets(1000);
    expect(ticketRepo.purgeClosedBefore).toHaveBeenCalledWith(expect.any(Number));
    expect(result.sessionsDeleted).toBe(5);
  });
});
