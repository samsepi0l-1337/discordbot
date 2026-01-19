const { PermissionsBitField } = require("discord.js");

async function assignRole(member, roleId, contextLabel) {
  if (!roleId) return { ok: false, reason: "no-role-id" };

  let role = member.guild.roles.cache.get(roleId);
  if (!role) {
    try {
      role = await member.guild.roles.fetch(roleId);
    } catch {
      role = null;
    }
  }
  if (!role) {
    console.warn(`[${contextLabel}] Role not found: ${roleId}`);
    return { ok: false, reason: "role-not-found" };
  }

  if (member.roles.cache.has(role.id)) {
    return { ok: true, reason: "already-has-role" };
  }

  const botMember = member.guild.members.me
    ? member.guild.members.me
    : await member.guild.members.fetchMe();

  if (!botMember.permissions.has(PermissionsBitField.Flags.ManageRoles)) {
    console.warn(`[${contextLabel}] Missing ManageRoles permission.`);
    return { ok: false, reason: "missing-permission" };
  }

  if (role.position >= botMember.roles.highest.position) {
    console.warn(`[${contextLabel}] Role hierarchy prevents assignment.`);
    return { ok: false, reason: "role-hierarchy" };
  }

  try {
    await member.roles.add(role);
    return { ok: true, reason: "assigned" };
  } catch (error) {
    console.warn(`[${contextLabel}] Role assign failed:`, error);
    return { ok: false, reason: "assign-failed" };
  }
}

module.exports = { assignRole };
