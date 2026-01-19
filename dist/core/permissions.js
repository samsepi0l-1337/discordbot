"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.canManageCommands = canManageCommands;
function canManageCommands(member, userId, config, manageGuildPerm) {
    if (manageGuildPerm)
        return true;
    const allowedRoles = config.command_role_ids || [];
    if (allowedRoles.length && member?.roles?.cache?.some((role) => allowedRoles.includes(role.id))) {
        return true;
    }
    const allowedUsers = config.command_user_ids || [];
    return allowedUsers.includes(userId);
}
