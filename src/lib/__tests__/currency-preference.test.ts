import {
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
