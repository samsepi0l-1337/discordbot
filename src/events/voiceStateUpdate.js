const { assignRole, removeRole } = require("../utils/discord");
const { listVoiceRolesByChannel } = require("../config/voiceRoleRepo");

module.exports = {
  name: "voiceStateUpdate",
  async execute(oldState, newState) {
    if (oldState.member?.user?.bot || newState.member?.user?.bot) return;
    const guildId = newState.guild.id;

    const oldChannelId = oldState.channelId;
    const newChannelId = newState.channelId;

    if (oldChannelId && oldChannelId !== newChannelId) {
      const roles = listVoiceRolesByChannel(guildId, oldChannelId);
      for (const rule of roles) {
        await removeRole(newState.member, rule.role_id, "voice-role-remove");
      }
    }

    if (newChannelId && oldChannelId !== newChannelId) {
      const roles = listVoiceRolesByChannel(guildId, newChannelId);
      for (const rule of roles) {
        await assignRole(newState.member, rule.role_id, "voice-role-add");
      }
    }
  },
};
