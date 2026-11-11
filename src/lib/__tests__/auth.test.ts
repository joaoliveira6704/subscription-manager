import { createUser, getUserById, hashPassword, updatePassword, verifyUser } from '@/lib/auth';

// --- Native module mocks -------------------------------------------------------------------

jest.mock('expo-crypto', () => {
  // Node's crypto, typed minimally so the app's tsconfig doesn't need @types/node.
  const nodeCrypto = jest.requireActual('crypto') as {
    createHash: (algorithm: string) => {
      update: (data: string) => { digest: (encoding: 'hex') => string };
    };
    randomBytes: (size: number) => Uint8Array;
  };
  return {
    CryptoDigestAlgorithm: { SHA256: 'SHA-256' },
    digestStringAsync: jest.fn(async (_algorithm: string, data: string) =>
      nodeCrypto.createHash('sha256').update(data).digest('hex')
    ),
    getRandomBytes: jest.fn((count: number) => new Uint8Array(nodeCrypto.randomBytes(count))),
  };
});

type Row = {
  id: number;
  name: string;
  email: string;
  password_hash: string;
  salt: string;
  created_at: string;
};

/**
 * Minimal in-memory stand-in for the expo-sqlite database. It only understands the exact
 * queries used by src/lib/auth.ts and throws on anything else, so query changes are caught.
 */
const mockDb = {
  rows: [] as Row[],
  nextId: 1,
  reset() {
    this.rows = [];
    this.nextId = 1;
  },
  async getFirstAsync<T>(sql: string, ...params: unknown[]): Promise<T | null> {
    if (sql === 'SELECT * FROM users WHERE email = ?') {
      const email = String(params[0]).toLowerCase(); // COLLATE NOCASE
      return (this.rows.find((r) => r.email.toLowerCase() === email) as T) ?? null;
    }
    if (sql === 'SELECT * FROM users WHERE id = ?') {
      return (this.rows.find((r) => r.id === params[0]) as T) ?? null;
    }
    throw new Error(`Unexpected query: ${sql}`);
  },
  async runAsync(sql: string, ...params: unknown[]) {
    if (sql === 'INSERT INTO users (name, email, password_hash, salt) VALUES (?, ?, ?, ?)') {
      const [name, email, password_hash, salt] = params as string[];
      if (this.rows.some((r) => r.email.toLowerCase() === email.toLowerCase())) {
        throw new Error('UNIQUE constraint failed: users.email');
      }
      const id = this.nextId++;
      this.rows.push({ id, name, email, password_hash, salt, created_at: '2026-01-01 00:00:00' });
      return { lastInsertRowId: id, changes: 1 };
    }
    if (sql === 'UPDATE users SET password_hash = ?, salt = ? WHERE id = ?') {
      const [password_hash, salt, id] = params as [string, string, number];
      const row = this.rows.find((r) => r.id === id);
      if (!row) return { lastInsertRowId: 0, changes: 0 };
      row.password_hash = password_hash;
      row.salt = salt;
      return { lastInsertRowId: 0, changes: 1 };
    }
    throw new Error(`Unexpected statement: ${sql}`);
  },
};

// Lazy getter: jest.mock is hoisted above `mockDb`, so read it at call time instead.
jest.mock('@/lib/db', () => ({
  get db() {
    return mockDb;
  },
}));

beforeEach(() => mockDb.reset());

// --- hashPassword --------------------------------------------------------------------------

describe('hashPassword', () => {
  it('is deterministic for the same password and salt', async () => {
    await expect(hashPassword('secret1', 'abcd')).resolves.toBe(
      await hashPassword('secret1', 'abcd')
    );
  });

  it('returns a 64-character hex SHA-256 digest', async () => {
    await expect(hashPassword('secret1', 'abcd')).resolves.toMatch(/^[0-9a-f]{64}$/);
  });

  it('changes when the salt changes', async () => {
    expect(await hashPassword('secret1', 'salt-a')).not.toBe(await hashPassword('secret1', 'salt-b'));
  });

  it('changes when the password changes, including case', async () => {
    expect(await hashPassword('secret1', 'abcd')).not.toBe(await hashPassword('Secret1', 'abcd'));
  });

  it('handles an empty password without throwing', async () => {
    await expect(hashPassword('', 'abcd')).resolves.toMatch(/^[0-9a-f]{64}$/);
  });
});

// --- createUser ----------------------------------------------------------------------------

describe('createUser', () => {
  it('creates a user and returns it without secrets', async () => {
    const result = await createUser('Ada', 'ada@example.com', 'secret1');

    expect(result.error).toBeNull();
    expect(result.data).toEqual({
      id: 1,
      name: 'Ada',
      email: 'ada@example.com',
      createdAt: expect.any(String),
    });
    expect(result.data).not.toHaveProperty('password_hash');
    expect(result.data).not.toHaveProperty('salt');
  });

  it('never stores the plaintext password', async () => {
    await createUser('Ada', 'ada@example.com', 'secret1');
    const row = mockDb.rows[0];

    expect(row.password_hash).not.toContain('secret1');
    expect(row.password_hash).toMatch(/^[0-9a-f]{64}$/);
    expect(row.salt).toMatch(/^[0-9a-f]{32}$/);
  });

  it('trims the name and normalises the email', async () => {
    const { data } = await createUser('  Ada Lovelace  ', '  Ada@Example.COM ', 'secret1');

    expect(data?.name).toBe('Ada Lovelace');
    expect(data?.email).toBe('ada@example.com');
  });

  it('uses a fresh salt per user, so equal passwords get different hashes', async () => {
    await createUser('A', 'a@example.com', 'same-password');
    await createUser('B', 'b@example.com', 'same-password');

    expect(mockDb.rows[0].salt).not.toBe(mockDb.rows[1].salt);
    expect(mockDb.rows[0].password_hash).not.toBe(mockDb.rows[1].password_hash);
  });

  it.each(['ada@example.com', 'ADA@example.com', '  ada@example.com  '])(
    'rejects a duplicate email (%p)',
    async (duplicate) => {
      await createUser('Ada', 'ada@example.com', 'secret1');
      const result = await createUser('Other', duplicate, 'secret2');

      expect(result).toEqual({ data: null, error: 'Email already in use' });
      expect(mockDb.rows).toHaveLength(1);
    }
  );
});

// --- verifyUser ----------------------------------------------------------------------------

describe('verifyUser', () => {
  beforeEach(async () => {
    await createUser('Ada', 'ada@example.com', 'secret1');
  });

  it('returns the user for correct credentials', async () => {
    const result = await verifyUser('ada@example.com', 'secret1');

    expect(result.error).toBeNull();
    expect(result.data).toMatchObject({ id: 1, name: 'Ada', email: 'ada@example.com' });
  });

  it('matches the email case-insensitively and ignores surrounding whitespace', async () => {
    const result = await verifyUser('  ADA@Example.com ', 'secret1');
    expect(result.error).toBeNull();
  });

  it('rejects a wrong password', async () => {
    await expect(verifyUser('ada@example.com', 'wrong')).resolves.toEqual({
      data: null,
      error: 'Invalid email or password',
    });
  });

  it('treats the password as case sensitive', async () => {
    const result = await verifyUser('ada@example.com', 'SECRET1');
    expect(result.error).toBe('Invalid email or password');
  });

  it('does not trim the password', async () => {
    const result = await verifyUser('ada@example.com', 'secret1 ');
    expect(result.error).toBe('Invalid email or password');
  });

  it('rejects an empty password', async () => {
    const result = await verifyUser('ada@example.com', '');
    expect(result.error).toBe('Invalid email or password');
  });

  it('uses the same generic error for unknown emails (no account enumeration)', async () => {
    const unknown = await verifyUser('nobody@example.com', 'secret1');
    const wrongPassword = await verifyUser('ada@example.com', 'nope');

    expect(unknown.error).toBe(wrongPassword.error);
  });
});

// --- updatePassword ------------------------------------------------------------------------

describe('updatePassword', () => {
  beforeEach(async () => {
    await createUser('Ada', 'ada@example.com', 'old-password');
  });

  it('lets the user sign in with the new password and rejects the old one', async () => {
    await expect(updatePassword('ada@example.com', 'new-password')).resolves.toEqual({
      data: undefined,
      error: null,
    });

    expect((await verifyUser('ada@example.com', 'new-password')).error).toBeNull();
    expect((await verifyUser('ada@example.com', 'old-password')).error).toBe(
      'Invalid email or password'
    );
  });

  it('rotates the salt', async () => {
    const before = mockDb.rows[0].salt;
    await updatePassword('ada@example.com', 'new-password');
    expect(mockDb.rows[0].salt).not.toBe(before);
  });

  it('finds the account case-insensitively', async () => {
    const result = await updatePassword('ADA@EXAMPLE.COM', 'new-password');
    expect(result.error).toBeNull();
  });

  it('returns an error for an unknown email and changes nothing', async () => {
    const before = { ...mockDb.rows[0] };
    const result = await updatePassword('nobody@example.com', 'new-password');

    expect(result).toEqual({ data: null, error: 'No account found with that email' });
    expect(mockDb.rows[0]).toEqual(before);
  });
});

// --- getUserById ---------------------------------------------------------------------------

describe('getUserById', () => {
  it('returns the user when it exists', async () => {
    await createUser('Ada', 'ada@example.com', 'secret1');
    await expect(getUserById(1)).resolves.toMatchObject({ id: 1, email: 'ada@example.com' });
  });

  it('returns null for a missing id', async () => {
    await expect(getUserById(999)).resolves.toBeNull();
  });

  it('returns null for NaN (e.g. a corrupted stored session id)', async () => {
    await expect(getUserById(Number('not-a-number'))).resolves.toBeNull();
  });
});
