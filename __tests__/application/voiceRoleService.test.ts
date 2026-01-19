import { VoiceRoleService } from "../../src/application/services/voiceRoleService";

describe("application: VoiceRoleService", () => {
  let voiceRepo: any;
  let roleManager: any;
  let service: VoiceRoleService<any>;

  beforeEach(() => {
    voiceRepo = { listByChannel: jest.fn() };
    roleManager = { assignRole: jest.fn(), removeRole: jest.fn() };
    service = new VoiceRoleService(voiceRepo, roleManager);
  });

  test("handles channel change: removes old roles and adds new ones", async () => {
    voiceRepo.listByChannel.mockImplementation((guildId: string, channelId: string) => {
      if (channelId === "old") return [{ role_id: "rOld" }];
      if (channelId === "new") return [{ role_id: "rNew" }];
      return [];
    });

    await service.handleVoiceStateUpdate({
      guildId: "g1",
      beforeChannelId: "old",
      afterChannelId: "new",
      member: "mem1",
    });

    expect(roleManager.removeRole).toHaveBeenCalledWith("mem1", "rOld", "voice-leave");
    expect(roleManager.assignRole).toHaveBeenCalledWith("mem1", "rNew", "voice-join");
  });

  test("handles joining from nothing", async () => {
    voiceRepo.listByChannel.mockReturnValue([{ role_id: "rNew" }]);

    await service.handleVoiceStateUpdate({
      guildId: "g1",
      beforeChannelId: null,
      afterChannelId: "new",
      member: "mem1",
    });

    expect(roleManager.removeRole).not.toHaveBeenCalled();
    expect(roleManager.assignRole).toHaveBeenCalledWith("mem1", "rNew", "voice-join");
  });

  test("handles leaving to nothing", async () => {
    voiceRepo.listByChannel.mockReturnValue([{ role_id: "rOld" }]);

    await service.handleVoiceStateUpdate({
      guildId: "g1",
      beforeChannelId: "old",
      afterChannelId: null,
      member: "mem1",
    });

    expect(roleManager.removeRole).toHaveBeenCalledWith("mem1", "rOld", "voice-leave");
    expect(roleManager.assignRole).not.toHaveBeenCalled();
  });

  test("does nothing if channel is same", async () => {
    await service.handleVoiceStateUpdate({
      guildId: "g1",
      beforeChannelId: "same",
      afterChannelId: "same",
      member: "mem1",
    });

    expect(voiceRepo.listByChannel).not.toHaveBeenCalled();
    expect(roleManager.assignRole).not.toHaveBeenCalled();
  });
});
