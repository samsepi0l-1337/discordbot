describe("event: messageReactionRemove", () => {
  beforeEach(() => {
    jest.resetModules();
  });

  test("normal removes role and sends DM when enabled", async () => {
    const removeRole = jest.fn().mockResolvedValue({ ok: true });
    jest.doMock("../../src/utils/discord", () => ({ removeRole }));
    jest.doMock("../../src/config/rrRepo", () => ({
      listRulesByMessageEmoji: jest.fn(() => [
        { type: "normal", role_id: "r1", emoji_key: "u:✅", toggle_group: "" },
      ]),
    }));
    jest.doMock("../../src/config/rrSettingsRepo", () => ({
      getDmEnabled: jest.fn(() => true),
    }));

    const handler = require("../../src/events/messageReactionRemove");

    const member = { id: "u1" };
    const guild = { id: "g1", members: { fetch: jest.fn(async () => member) } };
    const message = { id: "m1", guild, member: null };
    const reaction = { partial: false, message, emoji: { name: "✅" } };
    const user = { id: "u1", bot: false, send: jest.fn().mockResolvedValue(null) };

    await handler.execute(reaction, user);

    expect(removeRole).toHaveBeenCalledWith(member, "r1", "rr-remove-reaction");
    expect(user.send).toHaveBeenCalledTimes(1);
  });

  test("once/remove do nothing on reaction remove", async () => {
    const removeRole = jest.fn().mockResolvedValue({ ok: true });
    jest.doMock("../../src/utils/discord", () => ({ removeRole }));
    jest.doMock("../../src/config/rrRepo", () => ({
      listRulesByMessageEmoji: jest.fn(() => [
        { type: "once", role_id: "r1", emoji_key: "u:✅", toggle_group: "" },
        { type: "remove", role_id: "r2", emoji_key: "u:✅", toggle_group: "" },
      ]),
    }));
    jest.doMock("../../src/config/rrSettingsRepo", () => ({
      getDmEnabled: jest.fn(() => true),
    }));

    const handler = require("../../src/events/messageReactionRemove");

    const member = { id: "u1" };
    const guild = { id: "g1", members: { fetch: jest.fn(async () => member) } };
    const message = { id: "m1", guild, member: null };
    const reaction = { partial: false, message, emoji: { name: "✅" } };
    const user = { id: "u1", bot: false, send: jest.fn().mockResolvedValue(null) };

    await handler.execute(reaction, user);

    expect(removeRole).not.toHaveBeenCalled();
    expect(user.send).not.toHaveBeenCalled();
  });
});

