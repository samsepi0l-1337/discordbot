import { ReactionRoleService } from "../../src/application/services/reactionRoleService";

describe("application: ReactionRoleService", () => {
  let rrRepo: any;
  let rrSettings: any;
  let roleManager: any;
  let service: ReactionRoleService<any>;

  beforeEach(() => {
    rrRepo = {
      listRulesByMessageEmoji: jest.fn(),
      listRulesByMessage: jest.fn(),
    };
    rrSettings = { getDmEnabled: jest.fn() };
    roleManager = {
      assignRole: jest.fn(),
      removeRole: jest.fn(),
    };
    service = new ReactionRoleService(rrRepo, rrSettings, roleManager);
  });

  describe("handleReactionAdd", () => {
    const commonInput = {
      guildId: "g1",
      messageId: "m1",
      emojiKey: "u:✅",
      member: "mem1",
      userId: "u1",
      removeReaction: jest.fn(),
      sendDm: jest.fn(),
    };

    test("normal type: assigns role and sends DM if enabled", async () => {
      rrRepo.listRulesByMessageEmoji.mockReturnValue([
        { type: "normal", role_id: "r1", emoji_key: "u:✅" },
      ]);
      rrSettings.getDmEnabled.mockReturnValue(true);

      await service.handleReactionAdd(commonInput);

      expect(roleManager.assignRole).toHaveBeenCalledWith("mem1", "r1", "rr-normal");
      expect(commonInput.sendDm).toHaveBeenCalledWith(expect.stringContaining("역할 부여"));
    });

    test("once type: assigns role and removes reaction", async () => {
      rrRepo.listRulesByMessageEmoji.mockReturnValue([
        { type: "once", role_id: "r1", emoji_key: "u:✅" }
      ]);
      rrSettings.getDmEnabled.mockReturnValue(false);

      await service.handleReactionAdd(commonInput);

      expect(roleManager.assignRole).toHaveBeenCalledWith("mem1", "r1", "rr-once");
      expect(commonInput.removeReaction).toHaveBeenCalledWith("u1");
    });

    test("remove type: removes role", async () => {
      rrRepo.listRulesByMessageEmoji.mockReturnValue([
        { type: "remove", role_id: "r1", emoji_key: "u:❌" }
      ]);
      await service.handleReactionAdd({ ...commonInput, emojiKey: "u:❌" });

      expect(roleManager.removeRole).toHaveBeenCalledWith("mem1", "r1", "rr-remove");
    });

    test("toggle type: removes other group roles and assigns new one", async () => {
      const toggleA = { type: "toggle", role_id: "rA", emoji_key: "u:A", toggle_group: "color" };
      const toggleB = { type: "toggle", role_id: "rB", emoji_key: "u:B", toggle_group: "color" };
      
      rrRepo.listRulesByMessageEmoji.mockReturnValue([toggleB]);
      rrRepo.listRulesByMessage.mockReturnValue([toggleA, toggleB]);

      await service.handleReactionAdd({ ...commonInput, emojiKey: "u:B" });

      expect(roleManager.removeRole).toHaveBeenCalledWith("mem1", "rA", "rr-toggle-remove");
      expect(roleManager.assignRole).toHaveBeenCalledWith("mem1", "rB", "rr-toggle");
    });

    test("does nothing if no rules found", async () => {
      rrRepo.listRulesByMessageEmoji.mockReturnValue([]);
      await service.handleReactionAdd(commonInput);
      expect(roleManager.assignRole).not.toHaveBeenCalled();
    });
  });

  describe("handleReactionRemove", () => {
    const commonInput = {
      guildId: "g1",
      messageId: "m1",
      emojiKey: "u:✅",
      member: "mem1",
      sendDm: jest.fn(),
    };

    test("removes role for normal and toggle types", async () => {
      rrRepo.listRulesByMessageEmoji.mockReturnValue([
        { type: "normal", role_id: "r1", emoji_key: "u:✅" },
        { type: "toggle", role_id: "r2", emoji_key: "u:✅" },
        { type: "once", role_id: "r3", emoji_key: "u:✅" }, // should ignore
      ]);
      rrSettings.getDmEnabled.mockReturnValue(true);

      await service.handleReactionRemove(commonInput);

      expect(roleManager.removeRole).toHaveBeenCalledTimes(2);
      expect(roleManager.removeRole).toHaveBeenCalledWith("mem1", "r1", "rr-remove-reaction");
      expect(roleManager.removeRole).toHaveBeenCalledWith("mem1", "r2", "rr-remove-reaction");
      expect(commonInput.sendDm).toHaveBeenCalled();
    });
  });
});
