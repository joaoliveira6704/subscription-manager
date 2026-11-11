import {
  createSubscription,
  deleteSubscription,
  listSubscriptions,
  updateSubscription,
  validateSubscription,
  type SubscriptionInput,
} from '@/lib/subscriptions';

type Row = {
  id: number;
  user_id: number;
  name: string;
  amount_minor: number;
  currency: string;
  first_payment: string;
  interval_unit: string;
  interval_count: number;
  billing_day: number;
  category: string;
  notes: string;
  created_at: string;
};

const oneLine = (sql: string) => sql.replace(/\s+/g, ' ').trim();

/**
 * In-memory stand-in for expo-sqlite that only understands the exact queries in
 * src/lib/subscriptions.ts (whitespace-insensitive) and throws on anything else.
 */
const mockDb = {
  rows: [] as Row[],
  nextId: 1,
  reset() {
    this.rows = [];
    this.nextId = 1;
  },
  async getAllAsync<T>(sql: string, ...params: unknown[]): Promise<T[]> {
    if (oneLine(sql) === 'SELECT * FROM subscriptions WHERE user_id = ? ORDER BY name COLLATE NOCASE') {
      return this.rows
        .filter((r) => r.user_id === params[0])
        .sort((a, b) => a.name.toLowerCase().localeCompare(b.name.toLowerCase()))
        .map((r) => ({ ...r })) as T[];
    }
    throw new Error(`Unexpected query: ${sql}`);
  },
  async getFirstAsync<T>(sql: string, ...params: unknown[]): Promise<T | null> {
    if (oneLine(sql) === 'SELECT * FROM subscriptions WHERE id = ? AND user_id = ?') {
      const row = this.rows.find((r) => r.id === params[0] && r.user_id === params[1]);
      return row ? ({ ...row } as T) : null;
    }
    throw new Error(`Unexpected query: ${sql}`);
  },
  async runAsync(sql: string, ...params: unknown[]) {
    const q = oneLine(sql);
    if (
      q ===
      'INSERT INTO subscriptions (user_id, name, amount_minor, currency, first_payment, interval_unit, interval_count, billing_day, category, notes) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)'
    ) {
      const [
        user_id,
        name,
        amount_minor,
        currency,
        first_payment,
        interval_unit,
        interval_count,
        billing_day,
        category,
        notes,
      ] = params as [number, string, number, string, string, string, number, number, string, string];
      const id = this.nextId++;
      this.rows.push({
        id,
        user_id,
        name,
        amount_minor,
        currency,
        first_payment,
        interval_unit,
        interval_count,
        billing_day,
        category,
        notes,
        created_at: '2026-11-11 10:00:00',
      });
      return { lastInsertRowId: id, changes: 1 };
    }
    if (
      q ===
      'UPDATE subscriptions SET name = ?, amount_minor = ?, currency = ?, first_payment = ?, interval_unit = ?, interval_count = ?, billing_day = ?, category = ?, notes = ? WHERE id = ? AND user_id = ?'
    ) {
      const [
        name,
        amount_minor,
        currency,
        first_payment,
        interval_unit,
        interval_count,
        billing_day,
        category,
        notes,
        id,
        userId,
      ] = params as [string, number, string, string, string, number, number, string, string, number, number];
      const row = this.rows.find((r) => r.id === id && r.user_id === userId);
      if (!row) return { lastInsertRowId: 0, changes: 0 };
      Object.assign(row, {
        name,
        amount_minor,
        currency,
        first_payment,
        interval_unit,
        interval_count,
        billing_day,
        category,
        notes,
      });
      return { lastInsertRowId: 0, changes: 1 };
    }
    if (q === 'DELETE FROM subscriptions WHERE id = ? AND user_id = ?') {
      const before = this.rows.length;
      this.rows = this.rows.filter((r) => !(r.id === params[0] && r.user_id === params[1]));
      return { lastInsertRowId: 0, changes: before - this.rows.length };
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

const ALICE = 1;
const BOB = 2;

function input(overrides: Partial<SubscriptionInput> = {}): SubscriptionInput {
  return {
    name: 'Netflix',
    amountMinor: 1299,
    currency: 'EUR',
    intervalUnit: 'month',
    intervalCount: 1,
    firstPayment: '2026-11-30',
    category: 'streaming',
    notes: '',
    ...overrides,
  };
}

describe('validateSubscription', () => {
  it('accepts a valid subscription, including a free one', () => {
    expect(validateSubscription(input())).toEqual({});
    expect(validateSubscription(input({ amountMinor: 0 }))).toEqual({});
  });

  it('requires a name and rejects whitespace-only and very long names', () => {
    expect(validateSubscription(input({ name: '' })).name).toBe('Name is required');
    expect(validateSubscription(input({ name: '   ' })).name).toBe('Name is required');
    expect(validateSubscription(input({ name: 'a'.repeat(61) })).name).toBe(
      'Name must be 60 characters or fewer'
    );
    expect(validateSubscription(input({ name: 'a'.repeat(60) })).name).toBeUndefined();
  });

  it('rejects negative, fractional, huge and missing amounts', () => {
    for (const amountMinor of [-1, 12.5, Number.MAX_SAFE_INTEGER + 1, NaN]) {
      expect(validateSubscription(input({ amountMinor })).amountMinor).toBe('Enter a valid amount');
    }
    expect(validateSubscription({ ...input(), amountMinor: undefined }).amountMinor).toBe(
      'Enter a valid amount'
    );
  });

  it('rejects unknown currencies, units, categories and invalid dates', () => {
    const errors = validateSubscription({
      ...input(),
      currency: 'eur' as never,
      intervalUnit: 'fortnight' as never,
      category: 'food' as never,
      firstPayment: '2026-02-30',
    });
    expect(Object.keys(errors).sort()).toEqual([
      'category',
      'currency',
      'firstPayment',
      'intervalUnit',
    ]);
  });

  it('accepts interval counts from 1 to 99 only', () => {
    expect(validateSubscription(input({ intervalCount: 1 })).intervalCount).toBeUndefined();
    expect(validateSubscription(input({ intervalCount: 99 })).intervalCount).toBeUndefined();
    for (const intervalCount of [0, 100, -3, 2.5, NaN]) {
      expect(validateSubscription(input({ intervalCount })).intervalCount).toBe(
        'Enter a number from 1 to 99'
      );
    }
  });

  it('limits notes to 500 characters', () => {
    expect(validateSubscription(input({ notes: 'n'.repeat(500) })).notes).toBeUndefined();
    expect(validateSubscription(input({ notes: 'n'.repeat(501) })).notes).toBe(
      'Notes must be 500 characters or fewer'
    );
  });

  it('handles null and undefined fields without throwing', () => {
    expect(() => validateSubscription({})).not.toThrow();
    expect(Object.keys(validateSubscription({}))).toEqual(
      expect.arrayContaining([
        'name',
        'amountMinor',
        'currency',
        'intervalUnit',
        'intervalCount',
        'firstPayment',
        'category',
      ])
    );
  });
});

describe('createSubscription', () => {
  it('saves a trimmed subscription and remembers the billing day', async () => {
    const result = await createSubscription(
      ALICE,
      input({ name: '  Netflix  ', notes: ' family plan ', firstPayment: '2026-01-31' })
    );
    expect(result.error).toBeNull();
    expect(result.data).toMatchObject({
      userId: ALICE,
      name: 'Netflix',
      notes: 'family plan',
      firstPayment: '2026-01-31',
      interval: { unit: 'month', count: 1 },
      billingDay: 31,
      amountMinor: 1299,
      currency: 'EUR',
    });
  });

  it('returns the first validation error and saves nothing', async () => {
    const result = await createSubscription(ALICE, input({ name: '' }));
    expect(result).toEqual({ data: null, error: 'Name is required' });
    expect(mockDb.rows).toHaveLength(0);
  });

  it('allows duplicate names (e.g. two Netflix accounts)', async () => {
    await createSubscription(ALICE, input());
    const second = await createSubscription(ALICE, input());
    expect(second.error).toBeNull();
    expect(mockDb.rows).toHaveLength(2);
  });

  it('rejects when the database fails', async () => {
    const spy = jest.spyOn(mockDb, 'runAsync').mockRejectedValueOnce(new Error('disk full'));
    await expect(createSubscription(ALICE, input())).rejects.toThrow('disk full');
    spy.mockRestore();
  });
});

describe('listSubscriptions', () => {
  it("returns only the user's subscriptions, by name", async () => {
    await createSubscription(ALICE, input({ name: 'spotify' }));
    await createSubscription(ALICE, input({ name: 'Netflix' }));
    await createSubscription(BOB, input({ name: 'Bob only' }));

    const list = await listSubscriptions(ALICE);
    expect(list.map((s) => s.name)).toEqual(['Netflix', 'spotify']);
  });

  it('returns an empty list for a user with none', async () => {
    await expect(listSubscriptions(BOB)).resolves.toEqual([]);
  });

  it('falls back safely for corrupted rows', async () => {
    await createSubscription(ALICE, input());
    Object.assign(mockDb.rows[0], {
      currency: 'XXX',
      interval_unit: 'fortnight',
      interval_count: 0,
      category: '???',
    });
    const [sub] = await listSubscriptions(ALICE);
    expect(sub).toMatchObject({
      currency: 'EUR',
      interval: { unit: 'month', count: 1 },
      category: 'other',
    });
  });
});

describe('updateSubscription', () => {
  it('updates every field and the billing day', async () => {
    const { data } = await createSubscription(ALICE, input());
    const result = await updateSubscription(
      ALICE,
      data!.id,
      input({
        name: 'Netflix Premium',
        amountMinor: 1999,
        intervalUnit: 'month',
        intervalCount: 3,
        firstPayment: '2025-03-29',
      })
    );
    expect(result.data).toMatchObject({
      name: 'Netflix Premium',
      amountMinor: 1999,
      interval: { unit: 'month', count: 3 },
      firstPayment: '2025-03-29',
      billingDay: 29,
    });
  });

  it("cannot update another user's subscription", async () => {
    const { data } = await createSubscription(ALICE, input());
    const result = await updateSubscription(BOB, data!.id, input({ name: 'Hacked' }));
    expect(result).toEqual({ data: null, error: 'Subscription not found' });
    expect(mockDb.rows[0].name).toBe('Netflix');
  });

  it('returns not found for a missing id and validates first', async () => {
    await expect(updateSubscription(ALICE, 999, input())).resolves.toEqual({
      data: null,
      error: 'Subscription not found',
    });
    await expect(updateSubscription(ALICE, 999, input({ amountMinor: -1 }))).resolves.toEqual({
      data: null,
      error: 'Enter a valid amount',
    });
  });
});

describe('deleteSubscription', () => {
  it('deletes the subscription', async () => {
    const { data } = await createSubscription(ALICE, input());
    await expect(deleteSubscription(ALICE, data!.id)).resolves.toEqual({
      data: undefined,
      error: null,
    });
    expect(mockDb.rows).toHaveLength(0);
  });

  it("cannot delete another user's subscription or a missing one", async () => {
    const { data } = await createSubscription(ALICE, input());
    await expect(deleteSubscription(BOB, data!.id)).resolves.toEqual({
      data: null,
      error: 'Subscription not found',
    });
    await expect(deleteSubscription(ALICE, 999)).resolves.toEqual({
      data: null,
      error: 'Subscription not found',
    });
    expect(mockDb.rows).toHaveLength(1);
  });
});
