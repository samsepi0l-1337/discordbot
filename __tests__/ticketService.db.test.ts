import { cleanupTestDbPath, setTestDbPath } from "./testDb";

describe("ticketService (db-level)", () => {
  beforeEach(() => {
    setTestDbPath(`ticket-db-${Date.now()}`);
    jest.resetModules();
  });

  afterEach(() => {
    cleanupTestDbPath();
  });

  test("createTicketSession / getLatestOpenTicketForUser / getOpenTicketByChannel", () => {
    const svc = require("../src/tickets/ticketService");
    const id = svc.createTicketSession("g1", "u1", "thread1");
    expect(typeof id).toBe("number");
    const latest = svc.getLatestOpenTicketForUser("g1", "u1");
    expect(latest.id).toBe(id);
    expect(latest.channel_id).toBe("thread1");
    const byChannel = svc.getOpenTicketByChannel("g1", "thread1");
    expect(byChannel.id).toBe(id);
  });

  test("claim + close update ticket fields", () => {
    const svc = require("../src/tickets/ticketService");
    const id = svc.createTicketSession("g1", "u1", "thread1");
    svc.setTicketClaim(id, "staff1");
    let row = svc.getTicketById(id);
    expect(row.claimed_by_id).toBe("staff1");

    svc.closeTicketSession(id, "staff1", "done");
    row = svc.getTicketById(id);
    expect(row.status).toBe("closed");
    expect(row.closed_by_id).toBe("staff1");
    expect(row.closed_reason).toBe("done");
    expect(typeof row.closed_at).toBe("number");
  });
});
