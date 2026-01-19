"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const serviceContainer_1 = require("../presentation/discord/serviceContainer");
module.exports = {
    name: "voiceStateUpdate",
    async execute(oldState, newState) {
        if (oldState.member?.user?.bot || newState.member?.user?.bot)
            return;
        if (!newState.member)
            return;
        await serviceContainer_1.voiceRoleService.handleVoiceStateUpdate({
            guildId: newState.guild.id,
            beforeChannelId: oldState.channelId,
            afterChannelId: newState.channelId,
            member: newState.member,
        });
    },
};
