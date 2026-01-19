const { getConfig } = require("../config/guildConfigRepo");
const { listAutoroles } = require("../config/autoroleRepo");
const { listTimedRoles } = require("../config/timedRoleRepo");
const { assignRole } = require("../utils/discord");

module.exports = {
  name: "guildMemberAdd",
  async execute(member) {
    const config = getConfig(member.guild.id);
    const joinDelayMs = Math.max(0, Number(config?.join_delay_ms || 0));

    const scheduleRole = (roleId, delayMs, label) => {
      if (!roleId) return;
      if (delayMs <= 0) {
        void assignRole(member, roleId, label);
        return;
      }
      setTimeout(() => {
        void assignRole(member, roleId, label);
      }, delayMs);
    };

    if (config?.base_role_id) {
      scheduleRole(config.base_role_id, joinDelayMs, "join-base-role");
    }

    const autoroles = listAutoroles(member.guild.id);
    const target = member.user.bot ? "bot" : "user";
    for (const auto of autoroles) {
      if (auto.target !== target) continue;
      scheduleRole(auto.role_id, 0, "autorole");
    }

    const timedRoles = listTimedRoles(member.guild.id);
    for (const timed of timedRoles) {
      scheduleRole(timed.role_id, timed.delay_ms, "timed-role");
    }
  },
};
