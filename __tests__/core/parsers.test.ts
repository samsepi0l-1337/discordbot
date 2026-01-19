import { parseTimeToMs } from "../../src/core/parsers/time";
import { parseEmojiToken, emojiKeyFromReaction } from "../../src/core/parsers/emoji";

describe("core: parsers/time", () => {
  test("parses minutes correctly", () => {
    expect(parseTimeToMs("10m")).toBe(10 * 60 * 1000);
    expect(parseTimeToMs("5 minute")).toBe(5 * 60 * 1000);
    expect(parseTimeToMs("1 minutes")).toBe(1 * 60 * 1000);
  });

  test("parses hours correctly", () => {
    expect(parseTimeToMs("2h")).toBe(2 * 60 * 60 * 1000);
    expect(parseTimeToMs("1 hour")).toBe(1 * 60 * 60 * 1000);
    expect(parseTimeToMs("3 hours")).toBe(3 * 60 * 60 * 1000);
  });

  test("parses days correctly", () => {
    expect(parseTimeToMs("1d")).toBe(24 * 60 * 60 * 1000);
    expect(parseTimeToMs("2 day")).toBe(2 * 24 * 60 * 60 * 1000);
    expect(parseTimeToMs("7 days")).toBe(7 * 24 * 60 * 60 * 1000);
  });

  test("handles case insensitivity and whitespace", () => {
    expect(parseTimeToMs(" 10 M ")).toBe(10 * 60 * 1000);
    expect(parseTimeToMs("5H")).toBe(5 * 60 * 60 * 1000);
  });

  test("returns null for invalid inputs", () => {
    expect(parseTimeToMs("abc")).toBeNull();
    expect(parseTimeToMs("10")).toBeNull();
    expect(parseTimeToMs("m")).toBeNull();
    expect(parseTimeToMs("-5m")).toBeNull();
    expect(parseTimeToMs("0m")).toBeNull();
  });
});

describe("core: parsers/emoji", () => {
  test("parseEmojiToken: unicode emoji", () => {
    expect(parseEmojiToken("✅")).toEqual({ key: "u:✅", raw: "✅" });
    expect(parseEmojiToken("😀")).toEqual({ key: "u:😀", raw: "😀" });
  });

  test("parseEmojiToken: custom emoji", () => {
    expect(parseEmojiToken("<:name:123456789>")).toEqual({ key: "c:123456789", raw: "<:name:123456789>" });
    expect(parseEmojiToken("<a:animated:987654321>")).toEqual({ key: "c:987654321", raw: "<a:animated:987654321>" });
  });

  test("parseEmojiToken: invalid inputs", () => {
    expect(parseEmojiToken("")).toBeNull();
    expect(parseEmojiToken("   ")).toBeNull();
  });

  test("emojiKeyFromReaction: from id", () => {
    expect(emojiKeyFromReaction("123", "name")).toBe("c:123");
  });

  test("emojiKeyFromReaction: from name only", () => {
    expect(emojiKeyFromReaction(null, "✅")).toBe("u:✅");
    expect(emojiKeyFromReaction(undefined, "😀")).toBe("u:😀");
  });

  test("emojiKeyFromReaction: null/undefined", () => {
    expect(emojiKeyFromReaction(null, null)).toBeNull();
    expect(emojiKeyFromReaction()).toBeNull();
  });
});
