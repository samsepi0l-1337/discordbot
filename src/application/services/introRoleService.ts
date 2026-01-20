import type { GuildConfigRepoPort } from "../ports/guildConfigPort";
import type { RoleManagerPort } from "../ports/roleManager";

export type IntroMessageInput<Member> = {
  guildId: string;
  channelId: string;
  member: Member;
  react?: (emoji: string) => Promise<void>;
};

export class IntroRoleService<Member> {
  constructor(
    private readonly configRepo: GuildConfigRepoPort,
    private readonly roleManager: RoleManagerPort<Member>
  ) { }

  async handleIntroMessage(input: IntroMessageInput<Member>) {
    const config = this.configRepo.getConfig(input.guildId);
    if (!config?.intro_channel_id || !config?.intro_role_id) return;
    if (config.intro_channel_id !== input.channelId) return;

    // UX: react to intro message with a check mark.
    if (input.react) {
      try {
        await input.react("✅");
      } catch {
        // ignore react failure (missing perms, unknown emoji, etc.)
      }
    }

    const mode = config.intro_role_mode === "delete" ? "delete" : "add";
    if (mode === "delete") {
      await this.roleManager.removeRole(input.member, config.intro_role_id, "intro-role-delete");
      return;
    }
    await this.roleManager.assignRole(input.member, config.intro_role_id, "intro-role-add");
  }
}
