export type ReactionRule = {
  id?: number;
  guild_id: string;
  message_id: string;
  emoji_key: string;
  role_id: string;
  type: "normal" | "once" | "remove" | "toggle";
  toggle_group?: string | null;
  created_at?: number;
};

export type ActiveMessage = {
  guild_id: string;
  channel_id: string;
  message_id: string;
};

export interface RrRepoPort {
  setActiveMessage(guildId: string, channelId: string, messageId: string): void;
  getActiveMessage(guildId: string): ActiveMessage | undefined;
  clearActiveMessage(guildId: string): void;
  addRule(rule: {
    guildId: string;
    messageId: string;
    emojiKey: string;
    roleId: string;
    type: ReactionRule["type"];
    toggleGroup?: string | null;
  }): void;
  listRulesByMessage(guildId: string, messageId: string): ReactionRule[];
  listRulesByGuild(guildId: string): ReactionRule[];
  listRulesByMessageEmoji(guildId: string, messageId: string, emojiKey: string): ReactionRule[];
  deleteRulesByMessage(guildId: string, messageId: string): number;
  deleteRulesByEmoji(guildId: string, messageId: string, emojiKey: string): number;
  deleteRulesByRole(guildId: string, messageId: string, roleId: string): number;
  deleteRulesMissingRoles(guildId: string, messageId: string, roleIds: string[]): number;
}
