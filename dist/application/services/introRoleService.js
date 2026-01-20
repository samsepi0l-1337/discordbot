"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.IntroRoleService = void 0;
class IntroRoleService {
    constructor(configRepo, roleManager) {
        this.configRepo = configRepo;
        this.roleManager = roleManager;
    }
    async handleIntroMessage(input) {
        const config = this.configRepo.getConfig(input.guildId);
        if (!config?.intro_channel_id)
            return;
        if (config.intro_channel_id !== input.channelId)
            return;
        const hasAnyRole = Boolean(config.intro_add_role_id || config.intro_remove_role_id);
        if (!hasAnyRole)
            return;
        // UX: react to intro message with a check mark.
        if (input.react) {
            try {
                await input.react("✅");
            }
            catch {
                // ignore react failure (missing perms, unknown emoji, etc.)
            }
        }
        // Apply both, so you can "add" one role and "remove" another in the same intro channel.
        // Typical flow: remove temporary role(s) first, then add the final role.
        if (config.intro_remove_role_id) {
            await this.roleManager.removeRole(input.member, config.intro_remove_role_id, "intro-role-remove");
        }
        if (config.intro_add_role_id) {
            await this.roleManager.assignRole(input.member, config.intro_add_role_id, "intro-role-add");
        }
    }
}
exports.IntroRoleService = IntroRoleService;
