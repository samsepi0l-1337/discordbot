import type { VoiceRoleRepoPort } from "../ports/voiceRoleRepo";
import type { RoleManagerPort } from "../ports/roleManager";

export type VoiceUpdateInput<Member> = {
  guildId: string;
  beforeChannelId?: string | null;
  afterChannelId?: string | null;
  member: Member;
};

export class VoiceRoleService<Member> {
  constructor(
    private readonly voiceRepo: VoiceRoleRepoPort,
    private readonly roleManager: RoleManagerPort<Member>,
  ) {}

  async handleVoiceStateUpdate(input: VoiceUpdateInput<Member>) {
    const { beforeChannelId, afterChannelId } = input;
    if (beforeChannelId === afterChannelId) return;

    if (beforeChannelId) {
      const roleMappings = this.voiceRepo.listByChannel(
        input.guildId,
        beforeChannelId,
      );
      for (const mapping of roleMappings) {
        await this.roleManager.removeRole(
          input.member,
          mapping.role_id,
          "voice-leave",
        );
      }
    }

    if (afterChannelId) {
      const roleMappings = this.voiceRepo.listByChannel(
        input.guildId,
        afterChannelId,
      );
      for (const mapping of roleMappings) {
        await this.roleManager.assignRole(
          input.member,
          mapping.role_id,
          "voice-join",
        );
      }
    }
  }
}
