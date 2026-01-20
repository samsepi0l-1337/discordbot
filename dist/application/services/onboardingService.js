"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.OnboardingService = void 0;
class OnboardingService {
    constructor(autoroleRepo, timedRoleRepo, roleManager, schedule) {
        this.autoroleRepo = autoroleRepo;
        this.timedRoleRepo = timedRoleRepo;
        this.roleManager = roleManager;
        this.schedule = schedule;
    }
    async handleMemberAdd(input) {
        const autoroles = this.autoroleRepo.list(input.guildId);
        for (const rule of autoroles) {
            const shouldAssign = rule.target === "all" ||
                (rule.target === "bot" && input.isBot) ||
                (rule.target === "user" && !input.isBot);
            if (!shouldAssign)
                continue;
            this.schedule(() => {
                void this.roleManager.assignRole(input.member, rule.role_id, "autorole");
            }, 0);
        }
        const timedRoles = this.timedRoleRepo.list(input.guildId);
        for (const rule of timedRoles) {
            // Safety/compat:
            // - We store delays in ms, but older data may have been stored in seconds (e.g. 5 instead of 5000).
            const raw = Number(rule.delay_ms);
            const baseDelayMs = Number.isFinite(raw) ? Math.max(0, raw) : 0;
            const delayMs = baseDelayMs > 0 && baseDelayMs < 1000 ? baseDelayMs * 1000 : baseDelayMs;
            this.schedule(() => {
                void this.roleManager.assignRole(input.member, rule.role_id, "timed-role");
            }, delayMs);
        }
    }
}
exports.OnboardingService = OnboardingService;
