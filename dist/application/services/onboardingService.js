"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.OnboardingService = void 0;
class OnboardingService {
    constructor(configRepo, autoroleRepo, timedRoleRepo, roleManager, schedule) {
        this.configRepo = configRepo;
        this.autoroleRepo = autoroleRepo;
        this.timedRoleRepo = timedRoleRepo;
        this.roleManager = roleManager;
        this.schedule = schedule;
    }
    async handleMemberAdd(input) {
        const config = this.configRepo.getConfig(input.guildId);
        if (!config)
            return;
        const baseRoleId = config.base_role_id;
        const joinDelayMs = config.join_delay_ms || 0;
        if (baseRoleId) {
            this.schedule(() => {
                void this.roleManager.assignRole(input.member, baseRoleId, "base-role");
            }, joinDelayMs);
        }
        const autoroles = this.autoroleRepo.list(input.guildId);
        for (const rule of autoroles) {
            const shouldAssign = rule.target === "all" || (rule.target === "bot" && input.isBot);
            if (!shouldAssign)
                continue;
            this.schedule(() => {
                void this.roleManager.assignRole(input.member, rule.role_id, "autorole");
            }, 0);
        }
        const timedRoles = this.timedRoleRepo.list(input.guildId);
        for (const rule of timedRoles) {
            this.schedule(() => {
                void this.roleManager.assignRole(input.member, rule.role_id, "timed-role");
            }, rule.delay_ms);
        }
    }
}
exports.OnboardingService = OnboardingService;
