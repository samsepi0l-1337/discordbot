import { cleanupTestDbPath, setTestDbPath } from "./testDb";

function makeMockThread() {
  return {
    id: "thread-1",
    members: {
      add: jest.fn().mockResolvedValue(null),
    },
    send: jest.fn().mockResolvedValue(null),
    isThread: () => true,
  };
}

describe("ticketService (thread creation)", () => {
  beforeEach(() => {
    setTestDbPath(`ticket-thread-${Date.now()}`);
    jest.resetModules();
  });

  afterEach(() => {
    cleanupTestDbPath();
  });

  test("createTicketChannelTicket creates a private thread via panelChannel.threads.create", async () => {
    const svc = require("../src/tickets/ticketService");

    const thread = makeMockThread();
    const panelChannel = {
      isTextBased: () => true,
      threads: {
        create: jest.fn().mockResolvedValue(thread),
      },
    };

    const roleMembers = new Map([
      ["staffA", { id: "staffA" }],
      ["staffB", { id: "staffB" }],
    ]);
    const staffRole = { id: "role1", members: roleMembers };

    const guild = {
      id: "g1",
      channels: {
        fetch: jest.fn().mockResolvedValue(panelChannel),
      },
      roles: {
        cache: new Map([["role1", staffRole]]),
      },
    };

    const interaction = {
      guild,
      user: { id: "u1", username: "UserName" },
      channel: { id: "any" },
      isButton: () => true,
      reply: jest.fn().mockResolvedValue(null),
    };

    const config = {
      ticket_channel_id: "panel-channel",
      ticket_panel_message_id: "panel-message",
      ticket_support_user_ids: ["supportUser1"],
      ticket_support_role_ids: ["role1"],
      ticket_category_id: "cat-ignored-for-thread",
    };

    await svc.createTicketChannelTicket(interaction, config);

    expect(panelChannel.threads.create).toHaveBeenCalledTimes(1);
    expect(thread.members.add).toHaveBeenCalledWith("u1");
    expect(thread.members.add).toHaveBeenCalledWith("supportUser1");
    expect(thread.members.add).toHaveBeenCalledWith("staffA");
    expect(thread.members.add).toHaveBeenCalledWith("staffB");
    expect(interaction.reply).toHaveBeenCalled();
  });
});
