import type { RrRepoPort, ReactionRule } from "../ports/rrRepo";
import type { RrSettingsRepoPort } from "../ports/rrSettingsRepo";
import type { RoleManagerPort } from "../ports/roleManager";
import { formatEmojiKey } from "../../core/formatters/mentions";

export type ReactionAddInput<Member> = {
  guildId: string;
  messageId: string;
  emojiKey: string;
  member: Member;
  userId: string;
  removeReaction: (userId: string) => Promise<void>;
  sendDm: (content: string) => Promise<void>;
};

export type ReactionRemoveInput<Member> = {
  guildId: string;
  messageId: string;
  emojiKey: string;
  member: Member;
  sendDm: (content: string) => Promise<void>;
};

export class ReactionRoleService<Member> {
  constructor(
    private readonly rrRepo: RrRepoPort,
    private readonly rrSettings: RrSettingsRepoPort,
    private readonly roleManager: RoleManagerPort<Member>,
  ) {}

  async handleReactionAdd(input: ReactionAddInput<Member>) {
    const rules = this.rrRepo.listRulesByMessageEmoji(
      input.guildId,
      input.messageId,
      input.emojiKey,
    );
    if (!rules.length) return;

    const allRules = this.rrRepo.listRulesByMessage(
      input.guildId,
      input.messageId,
    );
    const dmEnabled = this.rrSettings.getDmEnabled(input.guildId);
    const dmLines: string[] = [];

    for (const rule of rules) {
      if (rule.type === "toggle") {
        const group = rule.toggle_group || "default";
        const groupRules = allRules.filter(
          (item) =>
            item.type === "toggle" &&
            (item.toggle_group || "default") === group,
        );
        for (const other of groupRules) {
          if (other.role_id !== rule.role_id) {
            await this.roleManager.removeRole(
              input.member,
              other.role_id,
              "rr-toggle-remove",
            );
          }
        }
      }

      if (rule.type === "remove") {
        await this.roleManager.removeRole(
          input.member,
          rule.role_id,
          "rr-remove",
        );
        dmLines.push(
          `역할 제거: ${formatEmojiKey(rule.emoji_key)} → <@&${rule.role_id}>`,
        );
        continue;
      }

      await this.roleManager.assignRole(
        input.member,
        rule.role_id,
        `rr-${rule.type}`,
      );
      dmLines.push(
        `역할 부여: ${formatEmojiKey(rule.emoji_key)} → <@&${rule.role_id}>`,
      );

      if (rule.type === "once") {
        try {
          await input.removeReaction(input.userId);
        } catch {
          // ignore
        }
      }
    }

    if (dmEnabled && dmLines.length) {
      await input.sendDm(dmLines.join("\n"));
    }
  }

  async handleReactionRemove(input: ReactionRemoveInput<Member>) {
    const rules = this.rrRepo.listRulesByMessageEmoji(
      input.guildId,
      input.messageId,
      input.emojiKey,
    );
    if (!rules.length) return;

    const dmEnabled = this.rrSettings.getDmEnabled(input.guildId);
    const dmLines: string[] = [];

    for (const rule of rules) {
      if (rule.type !== "normal" && rule.type !== "toggle") continue;
      await this.roleManager.removeRole(
        input.member,
        rule.role_id,
        "rr-remove-reaction",
      );
      dmLines.push(
        `역할 제거: ${formatEmojiKey(rule.emoji_key)} → <@&${rule.role_id}>`,
      );
    }

    if (dmEnabled && dmLines.length) {
      await input.sendDm(dmLines.join("\n"));
    }
  }
}
