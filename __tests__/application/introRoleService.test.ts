import { IntroRoleService } from "../../src/application/services/introRoleService";

describe("application: IntroRoleService", () => {
  let configRepo: any;
  let roleManager: any;
  let service: IntroRoleService<any>;

  beforeEach(() => {
    configRepo = { getConfig: jest.fn() };
    roleManager = { assignRole: jest.fn() };
    service = new IntroRoleService(configRepo, roleManager);
  });

  test("assigns role if channel matches config", async () => {
    configRepo.getConfig.mockReturnValue({
      intro_channel_id: "intro_chan",
      intro_role_id: "intro_role",
    });

    await service.handleIntroMessage({
      guildId: "g1",
      channelId: "intro_chan",
      member: "mem1",
    });

    expect(roleManager.assignRole).toHaveBeenCalledWith("mem1", "intro_role", "intro-role");
  });

  test("does nothing if channel does not match", async () => {
    configRepo.getConfig.mockReturnValue({
      intro_channel_id: "intro_chan",
      intro_role_id: "intro_role",
    });

    await service.handleIntroMessage({
      guildId: "g1",
      channelId: "other_chan",
      member: "mem1",
    });

    expect(roleManager.assignRole).not.toHaveBeenCalled();
  });

  test("does nothing if config is missing", async () => {
    configRepo.getConfig.mockReturnValue(null);
    await service.handleIntroMessage({
      guildId: "g1",
      channelId: "any",
      member: "mem1",
    });
    expect(roleManager.assignRole).not.toHaveBeenCalled();
  });
});
