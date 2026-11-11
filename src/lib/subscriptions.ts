import { isIntervalCount, isIntervalUnit, parseISODate, type Interval } from '@/lib/billing';
import { isCategory, type Category } from '@/lib/categories';
import { db } from '@/lib/db';
import { isCurrency, type Currency } from '@/lib/money';
import {
  isCardBrand,
  isCardLast4,
  isPaymentMethod,
  type CardBrand,
  type PaymentMethod,
} from '@/lib/payment-methods';
import {
  validateSubscription,
  type SubscriptionErrors,
  type SubscriptionInput,
} from '@/lib/subscription-validation';

export {
  validateSubscription,
  type SubscriptionErrors,
  type SubscriptionInput,
} from '@/lib/subscription-validation';
const NOT_FOUND = 'Subscription not found';

export type Subscription = {
  id: number;
  userId: number;
  name: string;
  amountMinor: number;
  currency: Currency;
  interval: Interval;
  /** When the user first paid ("YYYY-MM-DD"); see `nextPaymentFrom` for the next one. */
  firstPayment: string;
  /** Day of the month of the first payment, so monthly renewals stay on e.g. the 31st. */
  billingDay: number;
  category: Category;
  notes: string;
  paymentMethod: PaymentMethod | null;
  /** Only set when paying by card. */
  cardBrand: CardBrand | null;
  /** Last 4 digits of the card; a full card number is never stored. */
  cardLast4: string | null;
  createdAt: string;
};

export type Result<T = undefined> = { data: T; error: null } | { data: null; error: string };

type SubscriptionRow = {
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
  payment_method: string | null;
  card_brand: string | null;
  card_last4: string | null;
  created_at: string;
};

function toSubscription(row: SubscriptionRow): Subscription {
  return {
    id: row.id,
    userId: row.user_id,
    name: row.name,
    amountMinor: row.amount_minor,
    // Unknown values from older or corrupted rows fall back rather than crash the list.
    currency: isCurrency(row.currency) ? row.currency : 'EUR',
    interval: {
      unit: isIntervalUnit(row.interval_unit) ? row.interval_unit : 'month',
      count: isIntervalCount(row.interval_count) ? row.interval_count : 1,
    },
    firstPayment: row.first_payment,
    billingDay: row.billing_day,
    category: isCategory(row.category) ? row.category : 'other',
    notes: row.notes,
    paymentMethod: isPaymentMethod(row.payment_method) ? row.payment_method : null,
    cardBrand: isCardBrand(row.card_brand) ? row.card_brand : null,
    cardLast4: isCardLast4(row.card_last4) ? row.card_last4 : null,
    createdAt: row.created_at,
  };
}

function firstError(errors: SubscriptionErrors) {
  return Object.values(errors)[0] ?? null;
}

function normalize(input: SubscriptionInput) {
  const paymentMethod = input.paymentMethod ?? null;
  // Card details only make sense for a card, so switching method clears them.
  const isCard = paymentMethod === 'card';
  return {
    ...input,
    paymentMethod,
    cardBrand: isCard ? (input.cardBrand ?? null) : null,
    cardLast4: isCard && input.cardLast4 ? input.cardLast4 : null,
    name: input.name.trim(),
    notes: input.notes.trim(),
    // The first payment's day drives future renewals (e.g. 31st → 28 Feb → 31 Mar).
    billingDay: parseISODate(input.firstPayment)!.day,
  };
}

export async function listSubscriptions(userId: number): Promise<Subscription[]> {
  const rows = await db.getAllAsync<SubscriptionRow>(
    'SELECT * FROM subscriptions WHERE user_id = ? ORDER BY name COLLATE NOCASE',
    userId
  );
  return rows.map(toSubscription);
}

async function getOwned(userId: number, id: number) {
  const row = await db.getFirstAsync<SubscriptionRow>(
    'SELECT * FROM subscriptions WHERE id = ? AND user_id = ?',
    id,
    userId
  );
  return row ? toSubscription(row) : null;
}

export async function createSubscription(
  userId: number,
  input: SubscriptionInput
): Promise<Result<Subscription>> {
  const error = firstError(validateSubscription(input));
  if (error) return { data: null, error };

  const value = normalize(input);
  const result = await db.runAsync(
    `INSERT INTO subscriptions
      (user_id, name, amount_minor, currency, first_payment, interval_unit, interval_count,
       billing_day, category, notes, payment_method, card_brand, card_last4)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    userId,
    value.name,
    value.amountMinor,
    value.currency,
    value.firstPayment,
    value.intervalUnit,
    value.intervalCount,
    value.billingDay,
    value.category,
    value.notes,
    value.paymentMethod,
    value.cardBrand,
    value.cardLast4
  );

  const created = await getOwned(userId, result.lastInsertRowId);
  if (!created) return { data: null, error: 'Could not save subscription' };
  return { data: created, error: null };
}

export async function updateSubscription(
  userId: number,
  id: number,
  input: SubscriptionInput
): Promise<Result<Subscription>> {
  const error = firstError(validateSubscription(input));
  if (error) return { data: null, error };

  const value = normalize(input);
  const result = await db.runAsync(
    `UPDATE subscriptions
      SET name = ?, amount_minor = ?, currency = ?, first_payment = ?, interval_unit = ?,
          interval_count = ?, billing_day = ?, category = ?, notes = ?, payment_method = ?,
          card_brand = ?, card_last4 = ?
      WHERE id = ? AND user_id = ?`,
    value.name,
    value.amountMinor,
    value.currency,
    value.firstPayment,
    value.intervalUnit,
    value.intervalCount,
    value.billingDay,
    value.category,
    value.notes,
    value.paymentMethod,
    value.cardBrand,
    value.cardLast4,
    id,
    userId
  );
  if (result.changes === 0) return { data: null, error: NOT_FOUND };

  const updated = await getOwned(userId, id);
  if (!updated) return { data: null, error: NOT_FOUND };
  return { data: updated, error: null };
}

export async function deleteSubscription(userId: number, id: number): Promise<Result> {
  const result = await db.runAsync(
    'DELETE FROM subscriptions WHERE id = ? AND user_id = ?',
    id,
    userId
  );
  if (result.changes === 0) return { data: null, error: NOT_FOUND };
  return { data: undefined, error: null };
}
