import { introRoleService } from "../presentation/discord/serviceContainer";
import type { Message } from "discord.js";

async function resolveMember(message: Message) {
  if (message.member) return message.member;
  try {
    return await message.guild?.members.fetch(message.author.id);
  } catch {
    return null;
  }
}

module.exports = {
  name: "messageCreate",
  async execute(message: Message) {
    if (message.author?.bot || message.system) return;
    if (message.partial) {
      try {
        await message.fetch();
      } catch {
        return;
      }
    }

    if (!message.guild) return;

    const member = await resolveMember(message);
    if (!member) return;

    await introRoleService.handleIntroMessage({
      guildId: message.guild.id,
      channelId: message.channel.id,
      member,
      react: async (emoji: string) => {
        await message.react(emoji);
      },
    });
  },
};
