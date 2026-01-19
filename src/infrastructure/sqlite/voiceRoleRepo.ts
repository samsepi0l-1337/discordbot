import type { VoiceRoleRepoPort } from "../../application/ports/voiceRoleRepo";
import * as voiceRepo from "../../config/voiceRoleRepo";

export class SqliteVoiceRoleRepo implements VoiceRoleRepoPort {
  listByChannel(guildId: string, voiceChannelId: string) {
    return voiceRepo.listVoiceRolesByChannel(guildId, voiceChannelId);
  }

  listAll(guildId: string) {
    return voiceRepo.listVoiceRoles(guildId);
  }

  add(guildId: string, voiceChannelId: string, roleId: string) {
    voiceRepo.addVoiceRole(guildId, voiceChannelId, roleId);
  }

  remove(guildId: string, voiceChannelId: string, roleId: string) {
    return voiceRepo.removeVoiceRole(guildId, voiceChannelId, roleId);
  }
}
