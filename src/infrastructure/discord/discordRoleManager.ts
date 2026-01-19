import { assignRole, removeRole } from "../../utils/discord";
import type { RoleManagerPort } from "../../application/ports/roleManager";
import type { GuildMember } from "discord.js";

export class DiscordRoleManager implements RoleManagerPort<GuildMember> {
  async assignRole(member: GuildMember, roleId: string, contextLabel: string) {
    await assignRole(member, roleId, contextLabel);
  }

  async removeRole(member: GuildMember, roleId: string, contextLabel: string) {
    await removeRole(member, roleId, contextLabel);
  }
}
