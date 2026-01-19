const { getConfig } = require("../config/guildConfigRepo");
const { assignRole } = require("../utils/discord");

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

module.exports = {
  name: "guildMemberAdd",
  async execute(member) {
    const config = getConfig(member.guild.id);
    if (!config?.base_role_id) return;

    const delayMs = Math.max(0, Number(config.join_delay_ms || 0));
    if (delayMs > 0) {
      await sleep(delayMs);
    }

    await assignRole(member, config.base_role_id, "join-base-role");
  },
};
