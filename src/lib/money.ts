/** Amounts are stored as integers in the currency's minor unit (cents), never as floats. */

export const SUPPORTED_CURRENCIES = ['EUR', 'USD', 'GBP', 'BRL', 'CHF', 'JPY'] as const;
export type Currency = (typeof SUPPORTED_CURRENCIES)[number];
export const DEFAULT_CURRENCY: Currency = 'EUR';

export function isCurrency(value: unknown): value is Currency {
  return typeof value === 'string' && (SUPPORTED_CURRENCIES as readonly string[]).includes(value);
}

/** Number of minor-unit digits, e.g. 2 for EUR (cents) and 0 for JPY. */
export function minorDigits(currency: Currency): number {
  return (
    new Intl.NumberFormat('en', { style: 'currency', currency }).resolvedOptions()
      .maximumFractionDigits ?? 2
  );
}

// 12 integer digits keeps every amount far inside Number.MAX_SAFE_INTEGER.
const MAX_INTEGER_DIGITS = 12;

/**
 * Parses what the user typed into an amount field. Accepts "12,99" or "12.99" (one decimal
 * separator, no grouping), surrounding spaces and an empty fraction ("12,"). Returns the
 * amount in minor units, or null if the text is not a valid non-negative amount.
 */
export function parseAmount(text: string | null | undefined, currency: Currency): number | null {
  const cleaned = (text ?? '').replace(/[\s  ]/g, '');
  const match = /^(\d+)(?:[.,](\d*))?$/.exec(cleaned);
  if (!match) return null;

  const [, integerPart, fractionPart = ''] = match;
  const digits = minorDigits(currency);
  if (integerPart.replace(/^0+(?=\d)/, '').length > MAX_INTEGER_DIGITS) return null;
  if (fractionPart.length > digits) return null;

  const scale = 10 ** digits;
  return Number(integerPart) * scale + Number(fractionPart.padEnd(digits, '0') || '0');
}

function formatter(currency: Currency, locale?: string) {
  return new Intl.NumberFormat(locale, { style: 'currency', currency });
}

function toMajor(minor: number, currency: Currency) {
  return minor / 10 ** minorDigits(currency);
}

export function formatMoney(minor: number, currency: Currency, locale?: string) {
  return formatter(currency, locale).format(toMajor(minor, currency));
}

export type MoneyPart = { value: string; small: boolean };

// Hermes on iOS has no Intl.NumberFormat#formatToParts, so the pieces of a formatted amount are
// worked out from plain `format()` output instead.

/** The locale's decimal separator, e.g. "," in pt-PT. */
function decimalSeparator(locale?: string) {
  return new Intl.NumberFormat(locale).format(1.5).replace(/\d/g, '') || '.';
}

/**
 * Text before and after the number in this locale's currency format, e.g. "€" and "" in en-US,
 * "" and " €" in pt-PT, found by locating a plain-formatted zero inside the formatted zero.
 */
function affixes(currency: Currency, locale?: string) {
  const digits = minorDigits(currency);
  const zero = formatter(currency, locale).format(0);
  const plainZero = new Intl.NumberFormat(locale, {
    minimumFractionDigits: digits,
    maximumFractionDigits: digits,
  }).format(0);
  const index = zero.indexOf(plainZero);
  if (index === -1) return { prefix: '', suffix: '', fallback: true };
  return {
    prefix: zero.slice(0, index),
    suffix: zero.slice(index + plainZero.length),
    fallback: false,
  };
}

/**
 * The formatted amount split so the UI can draw the currency symbol and decimals smaller
 * than the main figure. Joining the parts gives exactly `formatMoney`.
 */
export function formatMoneyParts(minor: number, currency: Currency, locale?: string): MoneyPart[] {
  const full = formatMoney(minor, currency, locale);
  const { prefix, suffix, fallback } = affixes(currency, locale);
  const digits = minorDigits(currency);
  const scale = 10 ** digits;
  const integer = new Intl.NumberFormat(locale, { maximumFractionDigits: 0 }).format(
    Math.floor(minor / scale)
  );
  const decimal = digits > 0 ? decimalSeparator(locale) : '';
  const fraction = digits > 0 ? String(minor % scale).padStart(digits, '0') : '';

  const parts: MoneyPart[] = [
    { value: prefix, small: true },
    { value: integer, small: false },
    { value: decimal, small: true },
    { value: fraction, small: true },
    { value: suffix, small: true },
  ].filter((part) => part.value !== '');

  // If the pieces don't rebuild the exact text (an unusual locale format), show it whole.
  if (fallback || parts.map((part) => part.value).join('') !== full) {
    return [{ value: full, small: false }];
  }
  return parts;
}

/** The amount as the user would type it, e.g. "12,99" in pt-PT, for pre-filling edit forms. */
export function amountToInput(minor: number, currency: Currency, locale?: string) {
  const digits = minorDigits(currency);
  const integer = Math.floor(minor / 10 ** digits);
  if (digits === 0) return String(integer);
  const fraction = String(minor % 10 ** digits).padStart(digits, '0');
  return `${integer}${decimalSeparator(locale)}${fraction}`;
}

/** The currency's symbol in this locale, e.g. "€" or "US$". */
export function currencySymbol(currency: Currency, locale?: string) {
  const { prefix, suffix } = affixes(currency, locale);
  return (prefix + suffix).replace(/[\s\u00A0\u202F]/g, '') || currency;
}
