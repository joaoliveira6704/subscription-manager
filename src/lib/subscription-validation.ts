import {
  isIntervalCount,
  isIntervalUnit,
  MAX_INTERVAL_COUNT,
  parseISODate,
  type IntervalUnit,
} from '@/lib/billing';
import { isCategory, type Category } from '@/lib/categories';
import { isCurrency, type Currency } from '@/lib/money';
import { MAX_NAME_LENGTH, MAX_NOTES_LENGTH } from '@/lib/validation';

export type SubscriptionInput = {
  name: string;
  amountMinor: number;
  currency: Currency;
  intervalUnit: IntervalUnit;
  intervalCount: number;
  /** When the user first paid ("YYYY-MM-DD"); the next payment is calculated from it. */
  firstPayment: string;
  category: Category;
  notes: string;
};

export type SubscriptionErrors = Partial<Record<keyof SubscriptionInput, string>>;

/** Field errors for a subscription form; empty when valid. Messages are translated in the UI. */
export function validateSubscription(input: Partial<SubscriptionInput>): SubscriptionErrors {
  const errors: SubscriptionErrors = {};
  const name = input.name?.trim() ?? '';

  if (!name) errors.name = 'Name is required';
  else if (name.length > MAX_NAME_LENGTH) {
    errors.name = `Name must be ${MAX_NAME_LENGTH} characters or fewer`;
  }

  const amount = input.amountMinor;
  if (typeof amount !== 'number' || !Number.isSafeInteger(amount) || amount < 0) {
    errors.amountMinor = 'Enter a valid amount';
  }

  if (!isCurrency(input.currency)) errors.currency = 'Choose a currency';
  if (!isIntervalUnit(input.intervalUnit)) errors.intervalUnit = 'Choose how often you pay';
  if (!isIntervalCount(input.intervalCount)) {
    errors.intervalCount = `Enter a number from 1 to ${MAX_INTERVAL_COUNT}`;
  }
  if (!parseISODate(input.firstPayment)) errors.firstPayment = 'Choose a valid date';
  if (!isCategory(input.category)) errors.category = 'Choose a category';
  if ((input.notes ?? '').length > MAX_NOTES_LENGTH) {
    errors.notes = `Notes must be ${MAX_NOTES_LENGTH} characters or fewer`;
  }

  return errors;
}
