describe("event: messageReactionAdd", () => {
  beforeEach(() => {
    jest.resetModules();
  });

  test("normal assigns role and sends DM when enabled", async () => {
    const assignRole = jest.fn().mockResolvedValue({ ok: true });
    const removeRole = jest.fn().mockResolvedValue({ ok: true });

    jest.doMock("../../src/utils/discord", () => ({ assignRole, removeRole }));
    jest.doMock("../../src/config/rrRepo", () => ({
      listRulesByMessage: jest.fn(() => [
        {
          type: "normal",
          role_id: "r1",
          emoji_key: "u:✅",
          toggle_group: "",
        },
      ]),
      listRulesByMessageEmoji: jest.fn(() => [
        {
          type: "normal",
          role_id: "r1",
          emoji_key: "u:✅",
          toggle_group: "",
        },
      ]),
    }));
    jest.doMock("../../src/config/rrSettingsRepo", () => ({
      getDmEnabled: jest.fn(() => true),
    }));

    const handler = require("../../src/events/messageReactionAdd");

    const member = { id: "u1" };
    const guild = {
      id: "g1",
      members: { fetch: jest.fn(async () => member) },
    };
    const message = { id: "m1", guild, member: null };
    const reaction = {
      partial: false,
      message,
      emoji: { name: "✅" },
      users: { remove: jest.fn() },
    };
    const user = { id: "u1", bot: false, send: jest.fn().mockResolvedValue(null) };

    await handler.execute(reaction, user);

    expect(assignRole).toHaveBeenCalledWith(member, "r1", "rr-normal");
    expect(removeRole).not.toHaveBeenCalled();
    expect(user.send).toHaveBeenCalledTimes(1);
  });

  test("once assigns role and removes reaction", async () => {
    const assignRole = jest.fn().mockResolvedValue({ ok: true });
    const removeRole = jest.fn().mockResolvedValue({ ok: true });

    jest.doMock("../../src/utils/discord", () => ({ assignRole, removeRole }));
    jest.doMock("../../src/config/rrRepo", () => ({
      listRulesByMessage: jest.fn(() => []),
      listRulesByMessageEmoji: jest.fn(() => [
        { type: "once", role_id: "r1", emoji_key: "u:✅", toggle_group: "" },
      ]),
    }));
    jest.doMock("../../src/config/rrSettingsRepo", () => ({
      getDmEnabled: jest.fn(() => false),
    }));

    const handler = require("../../src/events/messageReactionAdd");

    const member = { id: "u1" };
    const guild = { id: "g1", members: { fetch: jest.fn(async () => member) } };
    const message = { id: "m1", guild, member: null };
    const reaction = {
      partial: false,
      message,
      emoji: { name: "✅" },
      users: { remove: jest.fn().mockResolvedValue(null) },
    };
    const user = { id: "u1", bot: false, send: jest.fn() };

    await handler.execute(reaction, user);

    expect(assignRole).toHaveBeenCalledWith(member, "r1", "rr-once");
    expect(reaction.users.remove).toHaveBeenCalledWith("u1");
  });

  test("toggle removes other group roles then assigns selected role", async () => {
    const assignRole = jest.fn().mockResolvedValue({ ok: true });
    const removeRole = jest.fn().mockResolvedValue({ ok: true });

    jest.doMock("../../src/utils/discord", () => ({ assignRole, removeRole }));
    jest.doMock("../../src/config/rrRepo", () => ({
      listRulesByMessage: jest.fn(() => [
        { type: "toggle", role_id: "rA", emoji_key: "u:🔴", toggle_group: "color" },
        { type: "toggle", role_id: "rB", emoji_key: "u:🔵", toggle_group: "color" },
      ]),
      listRulesByMessageEmoji: jest.fn(() => [
        { type: "toggle", role_id: "rB", emoji_key: "u:🔵", toggle_group: "color" },
      ]),
    }));
    jest.doMock("../../src/config/rrSettingsRepo", () => ({
      getDmEnabled: jest.fn(() => false),
    }));

    const handler = require("../../src/events/messageReactionAdd");

    const member = { id: "u1" };
    const guild = { id: "g1", members: { fetch: jest.fn(async () => member) } };
    const message = { id: "m1", guild, member: null };
    const reaction = {
      partial: false,
      message,
      emoji: { name: "🔵" },
      users: { remove: jest.fn() },
    };
    const user = { id: "u1", bot: false, send: jest.fn() };

    await handler.execute(reaction, user);

    expect(removeRole).toHaveBeenCalledWith(member, "rA", "rr-toggle-remove");
    expect(assignRole).toHaveBeenCalledWith(member, "rB", "rr-toggle");
  });

  test("remove type removes role", async () => {
    const assignRole = jest.fn().mockResolvedValue({ ok: true });
    const removeRole = jest.fn().mockResolvedValue({ ok: true });

    jest.doMock("../../src/utils/discord", () => ({ assignRole, removeRole }));
    jest.doMock("../../src/config/rrRepo", () => ({
      listRulesByMessage: jest.fn(() => []),
      listRulesByMessageEmoji: jest.fn(() => [
        { type: "remove", role_id: "r1", emoji_key: "u:✅", toggle_group: "" },
      ]),
    }));
    jest.doMock("../../src/config/rrSettingsRepo", () => ({
      getDmEnabled: jest.fn(() => false),
    }));

    const handler = require("../../src/events/messageReactionAdd");

    const member = { id: "u1" };
    const guild = { id: "g1", members: { fetch: jest.fn(async () => member) } };
    const message = { id: "m1", guild, member: null };
    const reaction = {
      partial: false,
      message,
      emoji: { name: "✅" },
      users: { remove: jest.fn() },
    };
    const user = { id: "u1", bot: false, send: jest.fn() };

    await handler.execute(reaction, user);

    expect(removeRole).toHaveBeenCalledWith(member, "r1", "rr-remove");
    expect(assignRole).not.toHaveBeenCalled();
  });
});

