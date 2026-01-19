import { voiceRoleService } from "../presentation/discord/serviceContainer";
import type { VoiceState } from "discord.js";

module.exports = {
  name: "voiceStateUpdate",
  async execute(oldState: VoiceState, newState: VoiceState) {
    if (oldState.member?.user?.bot || newState.member?.user?.bot) return;
    if (!newState.member) return;

    await voiceRoleService.handleVoiceStateUpdate({
      guildId: newState.guild.id,
      beforeChannelId: oldState.channelId,
      afterChannelId: newState.channelId,
      member: newState.member,
    });
  },
};
