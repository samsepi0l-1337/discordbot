import { OnboardingService } from "../../src/application/services/onboardingService";

describe("application: OnboardingService", () => {
  let autoroleRepo: any;
  let timedRoleRepo: any;
  let roleManager: any;
  let scheduler: any;
  let service: OnboardingService<any>;

  beforeEach(() => {
    autoroleRepo = { list: jest.fn() };
    timedRoleRepo = { list: jest.fn() };
    roleManager = { assignRole: jest.fn() };
    scheduler = jest.fn((fn) => fn()); // immediate execution for most tests
    service = new OnboardingService(autoroleRepo, timedRoleRepo, roleManager, scheduler);
  });

  test("assigns autoroles based on target (user/bot/all)", async () => {
    autoroleRepo.list.mockReturnValue([
      { target: "user", role_id: "roleUser" },
      { target: "bot", role_id: "roleBot" },
      { target: "all", role_id: "roleAll" },
    ]);
    timedRoleRepo.list.mockReturnValue([]);

    // Test for a user
    await service.handleMemberAdd({ guildId: "g1", member: "mem1", isBot: false });
    expect(roleManager.assignRole).toHaveBeenCalledWith("mem1", "roleUser", "autorole");
    expect(roleManager.assignRole).toHaveBeenCalledWith("mem1", "roleAll", "autorole");
    expect(roleManager.assignRole).not.toHaveBeenCalledWith("mem1", "roleBot", "autorole");

    roleManager.assignRole.mockClear();

    // Test for a bot
    await service.handleMemberAdd({ guildId: "g1", member: "mem2", isBot: true });
    expect(roleManager.assignRole).toHaveBeenCalledWith("mem2", "roleBot", "autorole");
    expect(roleManager.assignRole).toHaveBeenCalledWith("mem2", "roleAll", "autorole");
    expect(roleManager.assignRole).not.toHaveBeenCalledWith("mem2", "roleUser", "autorole");
  });

  test("schedules timed roles with correct delay", async () => {
    autoroleRepo.list.mockReturnValue([]);
    timedRoleRepo.list.mockReturnValue([
      { role_id: "timed1", delay_ms: 5000 },
      { role_id: "timed2", delay_ms: 10000 },
    ]);

    // Use a non-executing scheduler to check parameters
    const mockScheduler = jest.fn();
    service = new OnboardingService(autoroleRepo, timedRoleRepo, roleManager, mockScheduler);

    await service.handleMemberAdd({ guildId: "g1", member: "mem1", isBot: false });
    
    expect(mockScheduler).toHaveBeenCalledTimes(2);
    expect(mockScheduler).toHaveBeenNthCalledWith(1, expect.any(Function), 5000);
    expect(mockScheduler).toHaveBeenNthCalledWith(2, expect.any(Function), 10000);
  });

  test("handles empty rules", async () => {
    autoroleRepo.list.mockReturnValue([]);
    timedRoleRepo.list.mockReturnValue([]);

    await service.handleMemberAdd({ guildId: "g1", member: "mem1", isBot: false });
    expect(roleManager.assignRole).not.toHaveBeenCalled();
    expect(scheduler).not.toHaveBeenCalled();
  });
});
