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
        if (!config?.intro_channel_id || !config?.intro_role_id)
            return;
        if (config.intro_channel_id !== input.channelId)
            return;
        await this.roleManager.assignRole(input.member, config.intro_role_id, "intro-role");
    }
}
exports.IntroRoleService = IntroRoleService;
