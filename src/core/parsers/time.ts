export function parseTimeToMs(input: string): number | null {
  const trimmed = input.trim();
  const match = trimmed.match(
    /^(\d+)\s*(d|day|days|h|hour|hours|m|minute|minutes|s|sec|secs|second|seconds)$/i,
  );
  if (!match) return null;
  const value = Number(match[1]);
  const unit = match[2].toLowerCase();
  if (!Number.isFinite(value) || value <= 0) return null;
  if (unit.startsWith("d")) return value * 24 * 60 * 60 * 1000;
  if (unit.startsWith("h")) return value * 60 * 60 * 1000;
  if (unit.startsWith("m")) return value * 60 * 1000;
  if (unit.startsWith("s")) return value * 1000;
  return null;
}
