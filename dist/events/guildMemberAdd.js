"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const serviceContainer_1 = require("../presentation/discord/serviceContainer");
module.exports = {
    name: "guildMemberAdd",
    async execute(member) {
        await serviceContainer_1.onboardingService.handleMemberAdd({
            guildId: member.guild.id,
            member,
            isBot: member.user.bot,
        });
    },
};
