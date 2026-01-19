describe("event: voiceStateUpdate", () => {
  beforeEach(() => {
    jest.resetModules();
  });

  test("leaving old channel removes roles, joining new channel adds roles", async () => {
    const assignRole = jest.fn().mockResolvedValue({ ok: true });
    const removeRole = jest.fn().mockResolvedValue({ ok: true });
    jest.doMock("../../src/utils/discord", () => ({ assignRole, removeRole }));
    jest.doMock("../../src/config/voiceRoleRepo", () => ({
      listVoiceRolesByChannel: jest.fn((guildId, channelId) => {
        if (channelId === "old") return [{ role_id: "rOld" }];
        if (channelId === "new") return [{ role_id: "rNewA" }, { role_id: "rNewB" }];
        return [];
      }),
    }));

    const handler = require("../../src/events/voiceStateUpdate");

    const member = { id: "u1", user: { bot: false } };
    const oldState = { channelId: "old", member };
    const newState = { channelId: "new", member, guild: { id: "g1" } };

    await handler.execute(oldState, newState);

    expect(removeRole).toHaveBeenCalledWith(member, "rOld", "voice-role-remove");
    expect(assignRole).toHaveBeenCalledWith(member, "rNewA", "voice-role-add");
    expect(assignRole).toHaveBeenCalledWith(member, "rNewB", "voice-role-add");
  });
});

