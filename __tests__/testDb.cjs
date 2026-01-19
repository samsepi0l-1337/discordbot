const fs = require("node:fs");
const path = require("node:path");

const { closeDb } = require("../src/config/db");

function createTempDbPath(testName) {
  const dir = path.join(__dirname, "..", ".tmp", "jest-db", testName);
  fs.mkdirSync(dir, { recursive: true });
  return path.join(dir, "bot.db");
}

function setTestDbPath(testName) {
  process.env.BOT_DB_PATH = createTempDbPath(testName);
  closeDb();
  return process.env.BOT_DB_PATH;
}

function cleanupTestDbPath() {
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

module.exports = { setTestDbPath, cleanupTestDbPath };

