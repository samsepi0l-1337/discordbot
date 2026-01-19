import type { GuildMember } from "discord.js";

export type CommandAccessConfig = {
  command_role_ids?: string[] | null;
  command_user_ids?: string[] | null;
};

export function canManageCommands(
  member: GuildMember | null | undefined,
  userId: string,
  config: CommandAccessConfig,
  manageGuildPerm: boolean
): boolean {
  if (manageGuildPerm) return true;
  const allowedRoles = config.command_role_ids || [];
  if (allowedRoles.length && member?.roles?.cache?.some((role) => allowedRoles.includes(role.id))) {
    return true;
  }
  const allowedUsers = config.command_user_ids || [];
  return allowedUsers.includes(userId);
}
