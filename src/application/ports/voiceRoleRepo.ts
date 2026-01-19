export interface VoiceRoleRepoPort {
  listByChannel(guildId: string, voiceChannelId: string): { role_id: string }[];
  listAll(guildId: string): { voice_channel_id: string; role_id: string }[];
  add(guildId: string, voiceChannelId: string, roleId: string): void;
  remove(guildId: string, voiceChannelId: string, roleId: string): number;
}
