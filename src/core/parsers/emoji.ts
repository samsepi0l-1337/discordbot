export type ParsedEmoji = {
  key: string;
  raw: string;
};

export function parseEmojiToken(token: string): ParsedEmoji | null {
  const trimmed = token.trim();
  if (!trimmed) return null;
  const customMatch = trimmed.match(/^<a?:\w+:(\d+)>$/);
  if (customMatch) {
    return { key: `c:${customMatch[1]}`, raw: trimmed };
  }
  return { key: `u:${trimmed}`, raw: trimmed };
}

export function emojiKeyFromReaction(
  emojiId?: string | null,
  emojiName?: string | null,
) {
  if (emojiId) return `c:${emojiId}`;
  if (emojiName) return `u:${emojiName}`;
  return null;
}
