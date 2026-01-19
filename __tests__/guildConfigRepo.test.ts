import { cleanupTestDbPath, setTestDbPath } from "./testDb";

describe("guildConfigRepo", () => {
  beforeEach(() => {
    setTestDbPath(`guild-${Date.now()}`);
    jest.resetModules();
  });

  afterEach(() => {
    cleanupTestDbPath();
  });

  test("command allow lists are parsed into arrays", () => {
    const repo = require("../src/config/guildConfigRepo");
    repo.addCommandRole("g1", "roleA");
    repo.addCommandRole("g1", "roleB");
    repo.addCommandUser("g1", "userA");
    const cfg = repo.getConfig("g1");
    expect(cfg.command_role_ids).toEqual(["roleA", "roleB"]);
    expect(cfg.command_user_ids).toEqual(["userA"]);
  });

  test("ticket support users stored in ticket_recipient_id and exposed as ticket_support_user_ids", () => {
    const repo = require("../src/config/guildConfigRepo");
    repo.addTicketRecipient("g1", "u1");
    repo.addTicketRecipient("g1", "u2");
    const cfg = repo.getConfig("g1");
    expect(cfg.ticket_support_user_ids).toEqual(["u1", "u2"]);
  });

  test("ticket support roles stored and exposed", () => {
    const repo = require("../src/config/guildConfigRepo");
    repo.addTicketSupportRole("g1", "r1");
    repo.addTicketSupportRole("g1", "r2");
    const cfg = repo.getConfig("g1");
    expect(cfg.ticket_support_role_ids).toEqual(["r1", "r2"]);
  });

  test("ticket category and transcripts can be set", () => {
    const repo = require("../src/config/guildConfigRepo");
    repo.setTicketCategory("g1", "cat1");
    repo.setTicketTranscriptChannel("g1", "log1");
    const cfg = repo.getConfig("g1");
    expect(cfg.ticket_category_id).toBe("cat1");
    expect(cfg.ticket_transcript_channel_id).toBe("log1");
  });

  test("clearField resets a specific field", () => {
    const repo = require("../src/config/guildConfigRepo");
    repo.setIntro("g1", "c1", "r1");
    expect(repo.getConfig("g1").intro_channel_id).toBe("c1");
    
    repo.clearField("g1", "intro_channel");
    expect(repo.getConfig("g1").intro_channel_id).toBeNull();
    expect(repo.getConfig("g1").intro_role_id).toBe("r1");
  });

  test("resetConfig deletes the entire row", () => {
    const repo = require("../src/config/guildConfigRepo");
    repo.setIntro("g1", "c1", "r1");
    repo.resetConfig("g1");
    expect(repo.getConfig("g1")).toBeNull();
  });

  test("add/remove command roles and users are idempotent and work correctly", () => {
    const repo = require("../src/config/guildConfigRepo");
    repo.addCommandRole("g1", "r1");
    repo.addCommandRole("g1", "r1"); // Duplicate
    repo.addCommandRole("g1", "r2");
    
    expect(repo.getConfig("g1").command_role_ids).toEqual(["r1", "r2"]);
    
    repo.removeCommandRole("g1", "r1");
    expect(repo.getConfig("g1").command_role_ids).toEqual(["r2"]);
    
    repo.addCommandUser("g1", "u1");
    repo.addCommandUser("g1", "u1");
    expect(repo.getConfig("g1").command_user_ids).toEqual(["u1"]);
    
    repo.removeCommandUser("g1", "u1");
    expect(repo.getConfig("g1").command_user_ids).toEqual([]);
  });
});
