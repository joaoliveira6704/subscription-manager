import { DEFAULT_CURRENCY, isCurrency, type Currency } from '@/lib/money';

/**
 * - single: every subscription is shown in one app currency (amounts are not converted).
 * - perSubscription: each subscription keeps its own currency; totals are per currency.
 */
export type CurrencyMode = 'single' | 'perSubscription';
export const CURRENCY_MODES: readonly CurrencyMode[] = ['single', 'perSubscription'];
export const DEFAULT_CURRENCY_MODE: CurrencyMode = 'single';

export type CurrencyPreferences = { mode: CurrencyMode; currency: Currency };

export function parseCurrencyMode(value: unknown): CurrencyMode {
  return CURRENCY_MODES.includes(value as CurrencyMode)
    ? (value as CurrencyMode)
    : DEFAULT_CURRENCY_MODE;
}

export function parseCurrency(value: unknown): Currency {
  return isCurrency(value) ? value : DEFAULT_CURRENCY;
}

/**
 * The currency to show a subscription in. Subscriptions always keep their stored currency,
 * so switching back to per-subscription mode restores it.
 */
export function effectiveCurrency(stored: Currency, prefs: CurrencyPreferences): Currency {
  return prefs.mode === 'single' ? prefs.currency : stored;
}
