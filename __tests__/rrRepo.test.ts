import { cleanupTestDbPath, setTestDbPath } from "./testDb";

describe("rrRepo", () => {
  beforeEach(() => {
    setTestDbPath(`rr-${Date.now()}`);
    jest.resetModules();
  });

  afterEach(() => {
    cleanupTestDbPath();
  });

  test("active message can be set/get/cleared", () => {
    const rr = require("../src/config/rrRepo");
    rr.setActiveMessage("g1", "c1", "m1");
    expect(rr.getActiveMessage("g1")).toEqual({
      guild_id: "g1",
      channel_id: "c1",
      message_id: "m1",
    });
    rr.clearActiveMessage("g1");
    expect(rr.getActiveMessage("g1")).toBeUndefined();
  });

  test("addRule is idempotent (insert ignore)", () => {
    const rr = require("../src/config/rrRepo");
    rr.addRule({
      guildId: "g1",
      messageId: "m1",
      emojiKey: "u:✅",
      roleId: "r1",
      type: "normal",
    });
    rr.addRule({
      guildId: "g1",
      messageId: "m1",
      emojiKey: "u:✅",
      roleId: "r1",
      type: "normal",
    });
    const rules = rr.listRulesByMessage("g1", "m1");
    expect(rules).toHaveLength(1);
  });

  test("listRulesByMessageEmoji returns only matching rules", () => {
    const rr = require("../src/config/rrRepo");
    rr.addRule({ guildId: "g1", messageId: "m1", emojiKey: "u:✅", roleId: "r1", type: "normal" });
    rr.addRule({ guildId: "g1", messageId: "m1", emojiKey: "u:❌", roleId: "r2", type: "normal" });
    
    const rules = rr.listRulesByMessageEmoji("g1", "m1", "u:✅");
    expect(rules).toHaveLength(1);
    expect(rules[0].role_id).toBe("r1");
  });

  test("toggle rules are unique by group", () => {
    const rr = require("../src/config/rrRepo");
    rr.addRule({ guildId: "g1", messageId: "m1", emojiKey: "u:1", roleId: "r1", type: "toggle", toggleGroup: "color" });
    rr.addRule({ guildId: "g1", messageId: "m1", emojiKey: "u:1", roleId: "r1", type: "toggle", toggleGroup: "color" });
    
    const rules = rr.listRulesByMessage("g1", "m1");
    expect(rules).toHaveLength(1);
  });

  test("deleteRulesByMessage removes all rules for that message", () => {
    const rr = require("../src/config/rrRepo");
    rr.addRule({ guildId: "g1", messageId: "m1", emojiKey: "u:1", roleId: "r1", type: "normal" });
    rr.addRule({ guildId: "g1", messageId: "m1", emojiKey: "u:2", roleId: "r2", type: "normal" });
    
    expect(rr.deleteRulesByMessage("g1", "m1")).toBe(2);
    expect(rr.listRulesByMessage("g1", "m1")).toHaveLength(0);
  });

  test("delete rules by message/emoji/role", () => {
    const rr = require("../src/config/rrRepo");
    rr.addRule({
      guildId: "g1",
      messageId: "m1",
      emojiKey: "u:✅",
      roleId: "r1",
      type: "normal",
    });
    rr.addRule({
      guildId: "g1",
      messageId: "m1",
      emojiKey: "u:😀",
      roleId: "r2",
      type: "normal",
    });
    expect(rr.deleteRulesByEmoji("g1", "m1", "u:✅")).toBe(1);
    expect(rr.listRulesByMessage("g1", "m1")).toHaveLength(1);
    expect(rr.deleteRulesByRole("g1", "m1", "r2")).toBe(1);
    expect(rr.listRulesByMessage("g1", "m1")).toHaveLength(0);
  });
});
