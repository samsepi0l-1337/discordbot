"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ReactionRoleService = void 0;
const mentions_1 = require("../../core/formatters/mentions");
class ReactionRoleService {
    constructor(rrRepo, rrSettings, roleManager) {
        this.rrRepo = rrRepo;
        this.rrSettings = rrSettings;
        this.roleManager = roleManager;
    }
    async handleReactionAdd(input) {
        const rules = this.rrRepo.listRulesByMessageEmoji(input.guildId, input.messageId, input.emojiKey);
        if (!rules.length)
            return;
        const allRules = this.rrRepo.listRulesByMessage(input.guildId, input.messageId);
        const dmEnabled = this.rrSettings.getDmEnabled(input.guildId);
        const dmLines = [];
        for (const rule of rules) {
            if (rule.type === "toggle") {
                const group = rule.toggle_group || "default";
                const groupRules = allRules.filter((item) => item.type === "toggle" && (item.toggle_group || "default") === group);
                for (const other of groupRules) {
                    if (other.role_id !== rule.role_id) {
                        await this.roleManager.removeRole(input.member, other.role_id, "rr-toggle-remove");
                    }
                }
            }
            if (rule.type === "remove") {
                await this.roleManager.removeRole(input.member, rule.role_id, "rr-remove");
                dmLines.push(`역할 제거: ${(0, mentions_1.formatEmojiKey)(rule.emoji_key)} → <@&${rule.role_id}>`);
                continue;
            }
            await this.roleManager.assignRole(input.member, rule.role_id, `rr-${rule.type}`);
            dmLines.push(`역할 부여: ${(0, mentions_1.formatEmojiKey)(rule.emoji_key)} → <@&${rule.role_id}>`);
            if (rule.type === "once") {
                try {
                    await input.removeReaction(input.userId);
                }
                catch {
                    // ignore
                }
            }
        }
        if (dmEnabled && dmLines.length) {
            await input.sendDm(dmLines.join("\n"));
        }
    }
    async handleReactionRemove(input) {
        const rules = this.rrRepo.listRulesByMessageEmoji(input.guildId, input.messageId, input.emojiKey);
        if (!rules.length)
            return;
        const dmEnabled = this.rrSettings.getDmEnabled(input.guildId);
        const dmLines = [];
        for (const rule of rules) {
            if (rule.type !== "normal" && rule.type !== "toggle")
                continue;
            await this.roleManager.removeRole(input.member, rule.role_id, "rr-remove-reaction");
            dmLines.push(`역할 제거: ${(0, mentions_1.formatEmojiKey)(rule.emoji_key)} → <@&${rule.role_id}>`);
        }
        if (dmEnabled && dmLines.length) {
            await input.sendDm(dmLines.join("\n"));
        }
    }
}
exports.ReactionRoleService = ReactionRoleService;
