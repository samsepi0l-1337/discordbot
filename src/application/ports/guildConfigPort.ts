export type GuildConfig = {
  guild_id: string;
  join_delay_ms?: number | null;
  base_role_id?: string | null;
  intro_channel_id?: string | null;
  intro_role_id?: string | null;
  command_role_ids?: string[];
  command_user_ids?: string[];
  ticket_channel_id?: string | null;
  ticket_panel_message_id?: string | null;
  ticket_category_id?: string | null;
  ticket_transcript_channel_id?: string | null;
  ticket_support_role_ids?: string[];
  ticket_support_user_ids?: string[];
};

export interface GuildConfigRepoPort {
  getConfig(guildId: string): GuildConfig | null;
  setJoinDelayMs(guildId: string, joinDelayMs: number): void;
  setBaseRole(guildId: string, roleId: string): void;
  setIntro(guildId: string, channelId: string, roleId: string): void;
  setTicketChannel(guildId: string, channelId: string): void;
  setTicketPanelMessage(guildId: string, messageId: string): void;
  setTicketCategory(guildId: string, categoryId: string): void;
  setTicketTranscriptChannel(guildId: string, channelId: string): void;
  addTicketSupportRole(guildId: string, roleId: string): void;
  removeTicketSupportRole(guildId: string, roleId: string): void;
  addTicketSupportUser(guildId: string, userId: string): void;
  removeTicketSupportUser(guildId: string, userId: string): void;
  addCommandRole(guildId: string, roleId: string): void;
  removeCommandRole(guildId: string, roleId: string): void;
  addCommandUser(guildId: string, userId: string): void;
  removeCommandUser(guildId: string, userId: string): void;
  clearField(guildId: string, fieldKey: string): boolean;
  resetConfig(guildId: string): void;
}
