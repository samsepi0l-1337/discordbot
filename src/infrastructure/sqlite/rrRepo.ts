import type { RrRepoPort } from "../../application/ports/rrRepo";
import * as rrRepo from "../../config/rrRepo";

export class SqliteRrRepo implements RrRepoPort {
  setActiveMessage(guildId: string, channelId: string, messageId: string) {
    rrRepo.setActiveMessage(guildId, channelId, messageId);
  }

  getActiveMessage(guildId: string) {
    return rrRepo.getActiveMessage(guildId);
  }

  clearActiveMessage(guildId: string) {
    rrRepo.clearActiveMessage(guildId);
  }

  addRule(rule: {
    guildId: string;
    messageId: string;
    emojiKey: string;
    roleId: string;
    type: "normal" | "once" | "remove" | "toggle";
    toggleGroup?: string | null;
  }) {
    rrRepo.addRule(rule);
  }

  listRulesByMessage(guildId: string, messageId: string) {
    return rrRepo.listRulesByMessage(guildId, messageId);
  }

  listRulesByGuild(guildId: string) {
    return rrRepo.listRulesByGuild(guildId);
  }

  listRulesByMessageEmoji(guildId: string, messageId: string, emojiKey: string) {
    return rrRepo.listRulesByMessageEmoji(guildId, messageId, emojiKey);
  }

  deleteRulesByMessage(guildId: string, messageId: string) {
    return rrRepo.deleteRulesByMessage(guildId, messageId);
  }

  deleteRulesByEmoji(guildId: string, messageId: string, emojiKey: string) {
    return rrRepo.deleteRulesByEmoji(guildId, messageId, emojiKey);
  }

  deleteRulesByRole(guildId: string, messageId: string, roleId: string) {
    return rrRepo.deleteRulesByRole(guildId, messageId, roleId);
  }

  deleteRulesMissingRoles(guildId: string, messageId: string, roleIds: string[]) {
    return rrRepo.deleteRulesMissingRoles(guildId, messageId, roleIds);
  }
}
