import { openDatabaseSync } from 'expo-sqlite';

export const db = openDatabaseSync('app.db');

// SQLite leaves foreign keys off per connection; needed for ON DELETE CASCADE.
db.execSync('PRAGMA foreign_keys = ON');

const DATABASE_VERSION = 4;

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

  if (currentVersion < 3) {
    await db.execAsync(`
      CREATE TABLE IF NOT EXISTS subscriptions (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        name TEXT NOT NULL,
        amount_minor INTEGER NOT NULL CHECK (amount_minor >= 0),
        currency TEXT NOT NULL,
        cycle TEXT NOT NULL CHECK (cycle IN ('weekly', 'monthly', 'yearly')),
        next_payment TEXT NOT NULL,
        billing_day INTEGER NOT NULL CHECK (billing_day BETWEEN 1 AND 31),
        category TEXT NOT NULL DEFAULT 'other',
        notes TEXT NOT NULL DEFAULT '',
        created_at TEXT NOT NULL DEFAULT (datetime('now'))
      );
      CREATE INDEX IF NOT EXISTS subscriptions_user ON subscriptions(user_id);
    `);
  }

  if (currentVersion < 4) {
    // Custom intervals ("every 3 months") and a first payment date instead of a next one.
    // SQLite can't change CHECK constraints in place, so the table is rebuilt.
    await db.withTransactionAsync(async () => {
      await db.execAsync(`
        CREATE TABLE subscriptions_v4 (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
          name TEXT NOT NULL,
          amount_minor INTEGER NOT NULL CHECK (amount_minor >= 0),
          currency TEXT NOT NULL,
          first_payment TEXT NOT NULL,
          interval_unit TEXT NOT NULL CHECK (interval_unit IN ('day', 'week', 'month', 'year')),
          interval_count INTEGER NOT NULL DEFAULT 1 CHECK (interval_count BETWEEN 1 AND 99),
          billing_day INTEGER NOT NULL CHECK (billing_day BETWEEN 1 AND 31),
          category TEXT NOT NULL DEFAULT 'other',
          notes TEXT NOT NULL DEFAULT '',
          created_at TEXT NOT NULL DEFAULT (datetime('now'))
        );
        INSERT INTO subscriptions_v4
          (id, user_id, name, amount_minor, currency, first_payment, interval_unit,
           interval_count, billing_day, category, notes, created_at)
          SELECT id, user_id, name, amount_minor, currency, next_payment,
            CASE cycle WHEN 'weekly' THEN 'week' WHEN 'yearly' THEN 'year' ELSE 'month' END,
            1, billing_day, category, notes, created_at
          FROM subscriptions;
        DROP TABLE subscriptions;
        ALTER TABLE subscriptions_v4 RENAME TO subscriptions;
        CREATE INDEX IF NOT EXISTS subscriptions_user ON subscriptions(user_id);
      `);
    });
  }

  await db.execAsync(`PRAGMA user_version = ${DATABASE_VERSION}`);
}
