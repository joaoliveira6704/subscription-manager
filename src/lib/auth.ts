import * as Crypto from 'expo-crypto';

import { db } from '@/lib/db';

export type User = {
  id: number;
  name: string;
  email: string;
  createdAt: string;
};

type UserRow = {
  id: number;
  name: string;
  email: string;
  password_hash: string;
  salt: string;
  created_at: string;
};

export type AuthResult<T = undefined> = { data: T; error: null } | { data: null; error: string };

// Each iteration is an async native call, so keep this modest to avoid slow sign-ins.
const HASH_ITERATIONS = 2_000;
const INVALID_CREDENTIALS = 'Invalid email or password';

function toHex(bytes: Uint8Array) {
  return Array.from(bytes, (b) => b.toString(16).padStart(2, '0')).join('');
}

function normalizeEmail(email: string) {
  return email.trim().toLowerCase();
}

function toUser(row: UserRow): User {
  return { id: row.id, name: row.name, email: row.email, createdAt: row.created_at };
}

export async function hashPassword(password: string, salt: string) {
  let hash = `${salt}:${password}`;
  for (let i = 0; i < HASH_ITERATIONS; i++) {
    hash = await Crypto.digestStringAsync(Crypto.CryptoDigestAlgorithm.SHA256, `${salt}${hash}`);
  }
  return hash;
}

async function findUserRowByEmail(email: string) {
  return db.getFirstAsync<UserRow>('SELECT * FROM users WHERE email = ?', normalizeEmail(email));
}

export async function getUserById(id: number): Promise<User | null> {
  const row = await db.getFirstAsync<UserRow>('SELECT * FROM users WHERE id = ?', id);
  return row ? toUser(row) : null;
}

export async function createUser(
  name: string,
  email: string,
  password: string
): Promise<AuthResult<User>> {
  if (await findUserRowByEmail(email)) {
    return { data: null, error: 'Email already in use' };
  }

  const salt = toHex(Crypto.getRandomBytes(16));
  const passwordHash = await hashPassword(password, salt);

  const result = await db.runAsync(
    'INSERT INTO users (name, email, password_hash, salt) VALUES (?, ?, ?, ?)',
    name.trim(),
    normalizeEmail(email),
    passwordHash,
    salt
  );

  const user = await getUserById(result.lastInsertRowId);
  if (!user) return { data: null, error: 'Could not create account' };
  return { data: user, error: null };
}

export async function verifyUser(email: string, password: string): Promise<AuthResult<User>> {
  const row = await findUserRowByEmail(email);
  if (!row) return { data: null, error: INVALID_CREDENTIALS };

  const passwordHash = await hashPassword(password, row.salt);
  if (passwordHash !== row.password_hash) return { data: null, error: INVALID_CREDENTIALS };

  return { data: toUser(row), error: null };
}

export async function updatePassword(email: string, newPassword: string): Promise<AuthResult> {
  const row = await findUserRowByEmail(email);
  if (!row) return { data: null, error: 'No account found with that email' };

  const salt = toHex(Crypto.getRandomBytes(16));
  const passwordHash = await hashPassword(newPassword, salt);

  await db.runAsync(
    'UPDATE users SET password_hash = ?, salt = ? WHERE id = ?',
    passwordHash,
    salt,
    row.id
  );

  return { data: undefined, error: null };
}
