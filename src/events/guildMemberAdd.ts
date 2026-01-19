import { onboardingService } from "../presentation/discord/serviceContainer";
import type { GuildMember } from "discord.js";

module.exports = {
  name: "guildMemberAdd",
  async execute(member: GuildMember) {
    await onboardingService.handleMemberAdd({
      guildId: member.guild.id,
      member,
      isBot: member.user.bot,
    });
  },
};
