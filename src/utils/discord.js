const { PermissionsBitField } = require("discord.js");

const ISSUE_COOLDOWN_MS = 30 * 60 * 1000;
const lastIssueAt = new Map();

function shouldNotifyIssue(key) {
  const now = Date.now();
  const last = lastIssueAt.get(key);
  if (last && now - last < ISSUE_COOLDOWN_MS) return false;
  lastIssueAt.set(key, now);
  return true;
}

async function notifyGuildIssue(guild, content, notifyKey) {
  if (!shouldNotifyIssue(notifyKey)) return;
  let me = guild.members.me || null;
  if (!me) {
    try {
      me = await guild.members.fetchMe();
    } catch {
      me = null;
    }
  }
  const systemChannel = guild.systemChannel;
  if (systemChannel && me) {
    const perms = systemChannel.permissionsFor(me);
    if (
      perms?.has(PermissionsBitField.Flags.ViewChannel) &&
      perms?.has(PermissionsBitField.Flags.SendMessages)
    ) {
      try {
        await systemChannel.send({ content });
        return;
      } catch {
        // Fall through to DM.
      }
    }
  }

  try {
    const owner = await guild.fetchOwner();
    await owner.send({ content });
  } catch {
    // Ignore: DM may be disabled or blocked.
  }
}

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
    await notifyGuildIssue(
      member.guild,
      `설정된 역할을 찾을 수 없어요. 역할 ID: ${roleId} (상황: ${contextLabel})`,
      `${member.guild.id}:role-not-found:${roleId}:${contextLabel}`
    );
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
    await notifyGuildIssue(
      member.guild,
      "봇에 역할 관리 권한(Manage Roles)이 필요해요. 역할 부여에 실패했어요.",
      `${member.guild.id}:missing-permission:${roleId}:${contextLabel}`
    );
    return { ok: false, reason: "missing-permission" };
  }

  if (role.position >= botMember.roles.highest.position) {
    console.warn(`[${contextLabel}] Role hierarchy prevents assignment.`);
    await notifyGuildIssue(
      member.guild,
      "봇 역할이 부여하려는 역할보다 높아야 해요. 역할 부여에 실패했어요.",
      `${member.guild.id}:role-hierarchy:${roleId}:${contextLabel}`
    );
    return { ok: false, reason: "role-hierarchy" };
  }

  try {
    await member.roles.add(role);
    return { ok: true, reason: "assigned" };
  } catch (error) {
    console.warn(`[${contextLabel}] Role assign failed:`, error);
    await notifyGuildIssue(
      member.guild,
      "역할 부여 중 오류가 발생했어요. 권한과 역할 설정을 확인해주세요.",
      `${member.guild.id}:assign-failed:${roleId}:${contextLabel}`
    );
    return { ok: false, reason: "assign-failed" };
  }
}

async function removeRole(member, roleId, contextLabel) {
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
    await notifyGuildIssue(
      member.guild,
      `설정된 역할을 찾을 수 없어요. 역할 ID: ${roleId} (상황: ${contextLabel})`,
      `${member.guild.id}:role-not-found:${roleId}:${contextLabel}`
    );
    return { ok: false, reason: "role-not-found" };
  }

  if (!member.roles.cache.has(role.id)) {
    return { ok: true, reason: "not-has-role" };
  }

  const botMember = member.guild.members.me
    ? member.guild.members.me
    : await member.guild.members.fetchMe();

  if (!botMember.permissions.has(PermissionsBitField.Flags.ManageRoles)) {
    console.warn(`[${contextLabel}] Missing ManageRoles permission.`);
    await notifyGuildIssue(
      member.guild,
      "봇에 역할 관리 권한(Manage Roles)이 필요해요. 역할 제거에 실패했어요.",
      `${member.guild.id}:missing-permission:${roleId}:${contextLabel}`
    );
    return { ok: false, reason: "missing-permission" };
  }

  if (role.position >= botMember.roles.highest.position) {
    console.warn(`[${contextLabel}] Role hierarchy prevents removal.`);
    await notifyGuildIssue(
      member.guild,
      "봇 역할이 제거하려는 역할보다 높아야 해요. 역할 제거에 실패했어요.",
      `${member.guild.id}:role-hierarchy:${roleId}:${contextLabel}`
    );
    return { ok: false, reason: "role-hierarchy" };
  }

  try {
    await member.roles.remove(role);
    return { ok: true, reason: "removed" };
  } catch (error) {
    console.warn(`[${contextLabel}] Role remove failed:`, error);
    await notifyGuildIssue(
      member.guild,
      "역할 제거 중 오류가 발생했어요. 권한과 역할 설정을 확인해주세요.",
      `${member.guild.id}:remove-failed:${roleId}:${contextLabel}`
    );
    return { ok: false, reason: "remove-failed" };
  }
}

module.exports = { assignRole, removeRole };
