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
const INCORRECT_PASSWORD = 'Current password is incorrect';
const ACCOUNT_NOT_FOUND = 'Account not found';

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
  const row = await findUserRowById(id);
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

  if (!(await passwordMatches(row, password))) return { data: null, error: INVALID_CREDENTIALS };

  return { data: toUser(row), error: null };
}

async function setPassword(userId: number, newPassword: string) {
  const salt = toHex(Crypto.getRandomBytes(16));
  const passwordHash = await hashPassword(newPassword, salt);

  await db.runAsync(
    'UPDATE users SET password_hash = ?, salt = ? WHERE id = ?',
    passwordHash,
    salt,
    userId
  );
}

async function passwordMatches(row: UserRow, password: string) {
  return (await hashPassword(password, row.salt)) === row.password_hash;
}

export async function updatePassword(email: string, newPassword: string): Promise<AuthResult> {
  const row = await findUserRowByEmail(email);
  if (!row) return { data: null, error: 'No account found with that email' };

  await setPassword(row.id, newPassword);
  return { data: undefined, error: null };
}

async function findUserRowById(id: number) {
  return db.getFirstAsync<UserRow>('SELECT * FROM users WHERE id = ?', id);
}

export async function updateName(userId: number, name: string): Promise<AuthResult<User>> {
  const row = await findUserRowById(userId);
  if (!row) return { data: null, error: ACCOUNT_NOT_FOUND };

  await db.runAsync('UPDATE users SET name = ? WHERE id = ?', name.trim(), userId);
  return { data: { ...toUser(row), name: name.trim() }, error: null };
}

/** Changing the sign-in email needs the current password, like any credential change. */
export async function updateEmail(
  userId: number,
  newEmail: string,
  currentPassword: string
): Promise<AuthResult<User>> {
  const row = await findUserRowById(userId);
  if (!row) return { data: null, error: ACCOUNT_NOT_FOUND };
  if (!(await passwordMatches(row, currentPassword))) {
    return { data: null, error: INCORRECT_PASSWORD };
  }

  const email = normalizeEmail(newEmail);
  if (email === row.email) return { data: toUser(row), error: null };

  const existing = await findUserRowByEmail(email);
  if (existing && existing.id !== userId) return { data: null, error: 'Email already in use' };

  await db.runAsync('UPDATE users SET email = ? WHERE id = ?', email, userId);
  return { data: { ...toUser(row), email }, error: null };
}

export async function changePassword(
  userId: number,
  currentPassword: string,
  newPassword: string
): Promise<AuthResult> {
  const row = await findUserRowById(userId);
  if (!row) return { data: null, error: ACCOUNT_NOT_FOUND };
  if (!(await passwordMatches(row, currentPassword))) {
    return { data: null, error: INCORRECT_PASSWORD };
  }
  if (newPassword === currentPassword) {
    return { data: null, error: 'New password must be different from the current one' };
  }

  await setPassword(userId, newPassword);
  return { data: undefined, error: null };
}
