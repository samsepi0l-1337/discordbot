"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const serviceContainer_1 = require("../presentation/discord/serviceContainer");
async function resolveMember(message) {
    if (message.member)
        return message.member;
    try {
        return await message.guild?.members.fetch(message.author.id);
    }
    catch {
        return null;
    }
}
module.exports = {
    name: "messageCreate",
    async execute(message) {
        if (message.author?.bot || message.system)
            return;
        if (message.partial) {
            try {
                await message.fetch();
            }
            catch {
                return;
            }
        }
        if (!message.guild)
            return;
        const member = await resolveMember(message);
        if (!member)
            return;
        await serviceContainer_1.introRoleService.handleIntroMessage({
            guildId: message.guild.id,
            channelId: message.channel.id,
            member,
        });
    },
};
