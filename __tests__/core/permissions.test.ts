import { canManageCommands } from "../../src/core/permissions";

describe("core: permissions", () => {
  const config = {
    command_role_ids: ["role1", "role2"],
    command_user_ids: ["user1", "user2"],
  };

  test("returns true if manageGuildPerm is true", () => {
    expect(canManageCommands(null, "any", {}, true)).toBe(true);
  });

  test("returns true if member has allowed role", () => {
    const member = {
      roles: {
        cache: [{ id: "role1" }, { id: "other" }],
      },
    } as any;
    expect(canManageCommands(member, "otherUser", config, false)).toBe(true);
  });

  test("returns true if user id is in allowed users", () => {
    expect(canManageCommands(null, "user1", config, false)).toBe(true);
  });

  test("returns false if none of the conditions are met", () => {
    const member = {
      roles: {
        cache: [{ id: "otherRole" }],
      },
    } as any;
    expect(canManageCommands(member, "unknownUser", config, false)).toBe(false);
  });

  test("handles empty config", () => {
    expect(canManageCommands(null, "user1", {}, false)).toBe(false);
  });

  test("handles null member", () => {
    expect(canManageCommands(null, "user1", config, false)).toBe(true);
    expect(canManageCommands(null, "unknown", config, false)).toBe(false);
  });
});
