describe("event: guildMemberAdd", () => {
  beforeEach(() => {
    jest.useFakeTimers();
    jest.resetModules();
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  test("schedules base role after join_delay_ms, autoroles immediately, timed roles after delay", async () => {
    const assignRole = jest.fn().mockResolvedValue({ ok: true });

    jest.doMock("../../src/utils/discord", () => ({ assignRole }));
    jest.doMock("../../src/config/guildConfigRepo", () => ({
      getConfig: jest.fn(() => ({
        join_delay_ms: 5000,
        base_role_id: "baseRole",
      })),
    }));
    jest.doMock("../../src/config/autoroleRepo", () => ({
      listAutoroles: jest.fn(() => [
        { target: "user", role_id: "auto1" },
        { target: "bot", role_id: "autoBot" },
      ]),
    }));
    jest.doMock("../../src/config/timedRoleRepo", () => ({
      listTimedRoles: jest.fn(() => [{ role_id: "timed1", delay_ms: 2000 }]),
    }));

    const handler = require("../../src/events/guildMemberAdd");

    const member = {
      guild: { id: "g1" },
      user: { bot: false },
    };

    await handler.execute(member);

    // Immediate autorole
    expect(assignRole).toHaveBeenCalledWith(member, "auto1", "autorole");

    // Not yet: timed1 and baseRole
    expect(assignRole).not.toHaveBeenCalledWith(member, "timed1", "timed-role");
    expect(assignRole).not.toHaveBeenCalledWith(member, "baseRole", "base-role");

    // After 2s: timed
    jest.advanceTimersByTime(2000);
    expect(assignRole).toHaveBeenCalledWith(member, "timed1", "timed-role");

    // After 5s: base role
    jest.advanceTimersByTime(3000);
    expect(assignRole).toHaveBeenCalledWith(member, "baseRole", "base-role");
  });
});
