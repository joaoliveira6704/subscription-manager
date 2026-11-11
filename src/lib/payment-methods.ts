import type { AndroidSymbol, SFSymbol } from 'expo-symbols';

/**
 * How a subscription is paid, and optionally which card. Only the card type and its last 4
 * digits are ever stored, never a full card number.
 */

export const PAYMENT_METHODS = [
  'card',
  'paypal',
  'applePay',
  'googlePay',
  'bankTransfer',
  'directDebit',
  'other',
] as const;
export type PaymentMethod = (typeof PAYMENT_METHODS)[number];

export const CARD_BRANDS = ['visa', 'mastercard', 'amex', 'maestro', 'other'] as const;
export type CardBrand = (typeof CARD_BRANDS)[number];

export const CARD_LAST4_LENGTH = 4;

export function isPaymentMethod(value: unknown): value is PaymentMethod {
  return typeof value === 'string' && (PAYMENT_METHODS as readonly string[]).includes(value);
}

export function isCardBrand(value: unknown): value is CardBrand {
  return typeof value === 'string' && (CARD_BRANDS as readonly string[]).includes(value);
}

/** Exactly four ASCII digits. */
export function isCardLast4(value: unknown): value is string {
  return typeof value === 'string' && /^[0-9]{4}$/.test(value);
}

/**
 * Cleans what the user types into the "last 4 digits" field: digits only, at most four. If a
 * whole card number is pasted, only its last four digits are kept.
 */
export function cardDigitsInput(text: string): string {
  return text.replace(/[^0-9]/g, '').slice(-CARD_LAST4_LENGTH);
}

/** "Visa •••• 4242", "•••• 4242" or "Visa"; null when there's nothing to show. */
export function formatCardLabel(
  brandLabel: string | null | undefined,
  last4: string | null | undefined
): string | null {
  const digits = isCardLast4(last4) ? `•••• ${last4}` : '';
  return [brandLabel ?? '', digits].filter(Boolean).join(' ') || null;
}

/**
 * Short text shown next to the payment icon on a subscription: the card's masked last digits
 * ("•••• 4242"), else its type, else the method's name. Null when no method is set.
 */
export function paymentLabel(
  method: PaymentMethod | null,
  brand: CardBrand | null,
  last4: string | null,
  labels: { method: (method: PaymentMethod) => string; brand: (brand: CardBrand) => string }
): string | null {
  if (!method) return null;
  if (method !== 'card') return labels.method(method);
  if (isCardLast4(last4)) return `•••• ${last4}`;
  return brand ? labels.brand(brand) : labels.method('card');
}

/** The full payment description for the details screen, e.g. "Visa •••• 4242" or "PayPal". */
export function paymentDetailLabel(
  method: PaymentMethod | null,
  brand: CardBrand | null,
  last4: string | null,
  labels: { method: (method: PaymentMethod) => string; brand: (brand: CardBrand) => string }
): string | null {
  if (!method) return null;
  if (method !== 'card') return labels.method(method);
  return formatCardLabel(brand ? labels.brand(brand) : null, last4) ?? labels.method('card');
}

export const PAYMENT_METHOD_ICONS: Record<
  PaymentMethod,
  { ios: SFSymbol; android: AndroidSymbol }
> = {
  card: { ios: 'creditcard', android: 'credit_card' },
  paypal: { ios: 'dollarsign.circle', android: 'account_balance_wallet' },
  applePay: { ios: 'iphone', android: 'phone_iphone' },
  googlePay: { ios: 'wave.3.right', android: 'contactless' },
  bankTransfer: { ios: 'building.columns', android: 'account_balance' },
  directDebit: { ios: 'arrow.triangle.2.circlepath', android: 'autorenew' },
  other: { ios: 'ellipsis.circle', android: 'more_horiz' },
};
