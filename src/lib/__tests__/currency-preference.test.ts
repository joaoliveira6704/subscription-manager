import {
  effectiveAmount,
  effectiveCurrency,
  parseCurrency,
  parseCurrencyMode,
} from '@/lib/currency-preference';

describe('parseCurrencyMode', () => {
  it('accepts both modes', () => {
    expect(parseCurrencyMode('single')).toBe('single');
    expect(parseCurrencyMode('perSubscription')).toBe('perSubscription');
  });

  it('falls back to single for missing, unknown or differently cased values', () => {
    expect(parseCurrencyMode(null)).toBe('single');
    expect(parseCurrencyMode(undefined)).toBe('single');
    expect(parseCurrencyMode('')).toBe('single');
    expect(parseCurrencyMode('PerSubscription')).toBe('single');
    expect(parseCurrencyMode(1)).toBe('single');
  });
});

describe('parseCurrency', () => {
  it('accepts supported currencies and falls back to EUR', () => {
    expect(parseCurrency('USD')).toBe('USD');
    expect(parseCurrency('usd')).toBe('EUR');
    expect(parseCurrency('AUD')).toBe('EUR');
    expect(parseCurrency(null)).toBe('EUR');
    expect(parseCurrency('   ')).toBe('EUR');
  });
});

describe('effectiveCurrency', () => {
  it('shows every subscription in the app currency in single mode', () => {
    expect(effectiveCurrency('EUR', { mode: 'single', currency: 'USD' })).toBe('USD');
    expect(effectiveCurrency('GBP', { mode: 'single', currency: 'USD' })).toBe('USD');
  });

  it('restores each stored currency in per-subscription mode', () => {
    expect(effectiveCurrency('GBP', { mode: 'perSubscription', currency: 'USD' })).toBe('GBP');
  });
});

describe('effectiveAmount', () => {
  const single = (currency: 'EUR' | 'USD' | 'JPY') => ({ mode: 'single' as const, currency });

  it('keeps the same major amount when the minor units differ (no exchange rate)', () => {
    // ¥1,000 shown in euros is €1,000.00, not €10.00.
    expect(effectiveAmount(1000, 'JPY', single('EUR'))).toEqual({
      amountMinor: 100000,
      currency: 'EUR',
    });
    // €12.99 shown in yen rounds to ¥13 (yen has no decimals).
    expect(effectiveAmount(1299, 'EUR', single('JPY'))).toEqual({
      amountMinor: 13,
      currency: 'JPY',
    });
  });

  it('rounds half up when dropping decimals', () => {
    expect(effectiveAmount(1250, 'EUR', single('JPY')).amountMinor).toBe(13);
    expect(effectiveAmount(1249, 'EUR', single('JPY')).amountMinor).toBe(12);
  });

  it('leaves amounts unchanged between currencies with the same minor units', () => {
    expect(effectiveAmount(1299, 'EUR', single('USD'))).toEqual({
      amountMinor: 1299,
      currency: 'USD',
    });
  });

  it('keeps zero and free plans at zero', () => {
    expect(effectiveAmount(0, 'JPY', single('EUR')).amountMinor).toBe(0);
    expect(effectiveAmount(0, 'EUR', single('JPY')).amountMinor).toBe(0);
  });

  it('returns the stored amount and currency in per-subscription mode', () => {
    expect(effectiveAmount(1000, 'JPY', { mode: 'perSubscription', currency: 'EUR' })).toEqual({
      amountMinor: 1000,
      currency: 'JPY',
    });
  });
});
