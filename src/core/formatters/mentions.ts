export function formatRole(id?: string | null) {
  return id ? `<@&${id}>` : "미설정";
}

export function formatUser(id?: string | null) {
  return id ? `<@${id}>` : "미설정";
}

export function formatChannel(id?: string | null) {
  return id ? `<#${id}>` : "미설정";
}

export function formatEmojiKey(key?: string | null) {
  if (!key) return "알 수 없음";
  if (key.startsWith("c:")) return `<:emoji:${key.slice(2)}>`;
  if (key.startsWith("u:")) return key.slice(2);
  return key;
}
