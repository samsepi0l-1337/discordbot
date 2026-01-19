"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.VoiceRoleService = void 0;
class VoiceRoleService {
    constructor(voiceRepo, roleManager) {
        this.voiceRepo = voiceRepo;
        this.roleManager = roleManager;
    }
    async handleVoiceStateUpdate(input) {
        const { beforeChannelId, afterChannelId } = input;
        if (beforeChannelId === afterChannelId)
            return;
        if (beforeChannelId) {
            const roleMappings = this.voiceRepo.listByChannel(input.guildId, beforeChannelId);
            for (const mapping of roleMappings) {
                await this.roleManager.removeRole(input.member, mapping.role_id, "voice-leave");
            }
        }
        if (afterChannelId) {
            const roleMappings = this.voiceRepo.listByChannel(input.guildId, afterChannelId);
            for (const mapping of roleMappings) {
                await this.roleManager.assignRole(input.member, mapping.role_id, "voice-join");
            }
        }
    }
}
exports.VoiceRoleService = VoiceRoleService;
