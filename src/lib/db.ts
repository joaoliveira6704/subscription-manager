import { openDatabaseSync } from 'expo-sqlite';

export const db = openDatabaseSync('app.db');

const DATABASE_VERSION = 2;

/**
 * Runs pending schema migrations, tracked with `PRAGMA user_version`.
 * Add new steps as `if (currentVersion < N)` blocks and bump DATABASE_VERSION.
 */
export async function migrate() {
  const result = await db.getFirstAsync<{ user_version: number }>('PRAGMA user_version');
  const currentVersion = result?.user_version ?? 0;

  if (currentVersion >= DATABASE_VERSION) return;

  if (currentVersion < 1) {
    await db.execAsync(`
      PRAGMA journal_mode = WAL;
      CREATE TABLE IF NOT EXISTS users (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        email TEXT NOT NULL UNIQUE COLLATE NOCASE,
        password_hash TEXT NOT NULL,
        salt TEXT NOT NULL,
        created_at TEXT NOT NULL DEFAULT (datetime('now'))
      );
    `);
  }

  if (currentVersion < 2) {
    await db.execAsync(`ALTER TABLE users ADD COLUMN name TEXT NOT NULL DEFAULT ''`);
  }

  await db.execAsync(`PRAGMA user_version = ${DATABASE_VERSION}`);
}
