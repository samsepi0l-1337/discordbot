"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.DiscordRoleManager = void 0;
const discord_1 = require("../../utils/discord");
class DiscordRoleManager {
    async assignRole(member, roleId, contextLabel) {
        await (0, discord_1.assignRole)(member, roleId, contextLabel);
    }
    async removeRole(member, roleId, contextLabel) {
        await (0, discord_1.removeRole)(member, roleId, contextLabel);
    }
}
exports.DiscordRoleManager = DiscordRoleManager;
