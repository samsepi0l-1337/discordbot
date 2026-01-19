describe("event: guildMemberAdd", () => {
  beforeEach(() => {
    jest.useFakeTimers();
    jest.resetModules();
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  test("schedules autoroles immediately, timed roles after delay", async () => {
    const assignRole = jest.fn().mockResolvedValue({ ok: true });

    jest.doMock("../../src/utils/discord", () => ({ assignRole }));
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

    jest.advanceTimersByTime(0);

    // Immediate autorole
    expect(assignRole).toHaveBeenCalledWith(member, "auto1", "autorole");

    // Not yet: timed1
    expect(assignRole).not.toHaveBeenCalledWith(member, "timed1", "timed-role");

    // After 2s: timed
    jest.advanceTimersByTime(2000);
    expect(assignRole).toHaveBeenCalledWith(member, "timed1", "timed-role");
  });
});
