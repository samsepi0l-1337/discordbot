import type { GuildConfigRepoPort } from "../ports/guildConfigPort";
import type { AutoroleRepoPort } from "../ports/autoroleRepo";
import type { TimedRoleRepoPort } from "../ports/timedRoleRepo";
import type { RoleManagerPort } from "../ports/roleManager";

export type Scheduler = (fn: () => void, delayMs: number) => void;

export type MemberInput<Member> = {
  guildId: string;
  member: Member;
  isBot: boolean;
};

export class OnboardingService<Member> {
  constructor(
    private readonly autoroleRepo: AutoroleRepoPort,
    private readonly timedRoleRepo: TimedRoleRepoPort,
    private readonly roleManager: RoleManagerPort<Member>,
    private readonly schedule: Scheduler
  ) { }

  async handleMemberAdd(input: MemberInput<Member>) {
    const autoroles = this.autoroleRepo.list(input.guildId);
    for (const rule of autoroles) {
      const shouldAssign =
        rule.target === "all" ||
        (rule.target === "bot" && input.isBot) ||
        (rule.target === "user" && !input.isBot);
      if (!shouldAssign) continue;
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
