import fs from "node:fs";
import path from "node:path";
import { closeDb } from "../src/config/db";

function createTempDbPath(testName: string) {
  const dir = path.join(__dirname, "..", ".tmp", "jest-db", testName);
  fs.mkdirSync(dir, { recursive: true });
  return path.join(dir, "bot.db");
}

export function setTestDbPath(testName: string) {
  process.env.BOT_DB_PATH = createTempDbPath(testName);
  closeDb();
  return process.env.BOT_DB_PATH!;
}

export function cleanupTestDbPath() {
  const dbPath = process.env.BOT_DB_PATH;
  closeDb();
  if (!dbPath) return;
  try {
    fs.rmSync(path.dirname(dbPath), { recursive: true, force: true });
  } catch {
    // ignore
  }
  delete process.env.BOT_DB_PATH;
}
