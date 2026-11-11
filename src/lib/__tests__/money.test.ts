import {
  amountToInput,
  currencySymbol,
  formatMoney,
  formatMoneyParts,
  isCurrency,
  minorDigits,
  parseAmount,
} from '@/lib/money';

// Intl inserts non-breaking spaces; normalise them so expectations stay readable.
const plain = (text: string) => text.replace(/[  ]/g, ' ');

describe('isCurrency', () => {
  it('accepts supported ISO codes', () => {
    expect(isCurrency('EUR')).toBe(true);
    expect(isCurrency('JPY')).toBe(true);
  });

  it('rejects unsupported, lowercase and non-string values', () => {
    expect(isCurrency('eur')).toBe(false);
    expect(isCurrency('AUD')).toBe(false);
    expect(isCurrency('')).toBe(false);
    expect(isCurrency(null)).toBe(false);
    expect(isCurrency(978)).toBe(false);
  });
});

describe('minorDigits', () => {
  it('is 2 for cent currencies and 0 for JPY', () => {
    expect(minorDigits('EUR')).toBe(2);
    expect(minorDigits('USD')).toBe(2);
    expect(minorDigits('JPY')).toBe(0);
  });
});

describe('parseAmount', () => {
  it('accepts a dot or a comma as the decimal separator', () => {
    expect(parseAmount('12.99', 'EUR')).toBe(1299);
    expect(parseAmount('12,99', 'EUR')).toBe(1299);
  });

  it('pads a single decimal and accepts an empty fraction', () => {
    expect(parseAmount('12,5', 'EUR')).toBe(1250);
    expect(parseAmount('12,', 'EUR')).toBe(1200);
    expect(parseAmount('12', 'EUR')).toBe(1200);
  });

  it('accepts zero for free plans', () => {
    expect(parseAmount('0', 'EUR')).toBe(0);
    expect(parseAmount('0,00', 'EUR')).toBe(0);
  });

  it('ignores surrounding and non-breaking spaces', () => {
    expect(parseAmount('  9,99 ', 'EUR')).toBe(999);
    expect(parseAmount('1 299,00', 'EUR')).toBe(129900);
  });

  it('does not lose precision to floating point', () => {
    expect(parseAmount('0.29', 'EUR')).toBe(29);
    expect(parseAmount('1.15', 'EUR')).toBe(115);
  });

  it('rejects more decimals than the currency has', () => {
    expect(parseAmount('12.999', 'EUR')).toBeNull();
    expect(parseAmount('500,5', 'JPY')).toBeNull();
    expect(parseAmount('500', 'JPY')).toBe(500);
  });

  it('rejects empty, whitespace-only, null and undefined input', () => {
    expect(parseAmount('', 'EUR')).toBeNull();
    expect(parseAmount('   ', 'EUR')).toBeNull();
    expect(parseAmount(null, 'EUR')).toBeNull();
    expect(parseAmount(undefined, 'EUR')).toBeNull();
  });

  it('rejects negatives, letters, symbols and grouped numbers', () => {
    expect(parseAmount('-5', 'EUR')).toBeNull();
    expect(parseAmount('12a', 'EUR')).toBeNull();
    expect(parseAmount('€12', 'EUR')).toBeNull();
    expect(parseAmount('1.299,99', 'EUR')).toBeNull();
    expect(parseAmount('.5', 'EUR')).toBeNull();
    expect(parseAmount('1e3', 'EUR')).toBeNull();
  });

  it('rejects absurdly long numbers but allows leading zeros', () => {
    expect(parseAmount('9'.repeat(13), 'EUR')).toBeNull();
    expect(parseAmount('9'.repeat(12), 'EUR')).toBe(999_999_999_999 * 100);
    expect(parseAmount('0000000000000005', 'EUR')).toBe(500);
  });
});

describe('formatMoney', () => {
  it('formats with the locale conventions', () => {
    expect(plain(formatMoney(1299, 'EUR', 'pt-PT'))).toBe('12,99 €');
    expect(formatMoney(1299, 'USD', 'en-US')).toBe('$12.99');
  });

  it('formats zero, large amounts and zero-decimal currencies', () => {
    expect(formatMoney(0, 'EUR', 'en-US')).toBe('€0.00');
    expect(formatMoney(123456789, 'USD', 'en-US')).toBe('$1,234,567.89');
    expect(formatMoney(1500, 'JPY', 'en-US')).toBe('¥1,500');
  });
});

describe('formatMoneyParts', () => {
  it('joins back to formatMoney', () => {
    for (const [minor, currency, locale] of [
      [1299, 'EUR', 'pt-PT'],
      [1299, 'USD', 'en-US'],
      [1500, 'JPY', 'en-US'],
    ] as const) {
      const joined = formatMoneyParts(minor, currency, locale)
        .map((part) => part.value)
        .join('');
      expect(joined).toBe(formatMoney(minor, currency, locale));
    }
  });

  it('marks the symbol and decimals as small, the main figure as large', () => {
    const parts = formatMoneyParts(1299, 'USD', 'en-US');
    expect(parts).toEqual([
      { value: '$', small: true },
      { value: '12', small: false },
      { value: '.', small: true },
      { value: '99', small: true },
    ]);
  });
});

describe('amountToInput', () => {
  it('uses the locale decimal separator and keeps trailing zeros', () => {
    expect(amountToInput(1299, 'EUR', 'pt-PT')).toBe('12,99');
    expect(amountToInput(1200, 'EUR', 'en-US')).toBe('12.00');
    expect(amountToInput(5, 'EUR', 'en-US')).toBe('0.05');
  });

  it('round-trips through parseAmount', () => {
    for (const minor of [0, 1, 99, 1299, 100000]) {
      expect(parseAmount(amountToInput(minor, 'EUR', 'pt-PT'), 'EUR')).toBe(minor);
    }
    expect(parseAmount(amountToInput(1500, 'JPY', 'pt-PT'), 'JPY')).toBe(1500);
  });
});

describe('currencySymbol', () => {
  it('returns the symbol for the locale', () => {
    expect(currencySymbol('EUR', 'pt-PT')).toBe('€');
    expect(currencySymbol('USD', 'en-US')).toBe('$');
    expect(currencySymbol('JPY', 'en-US')).toBe('¥');
  });
});

// Hermes on iOS has no Intl.NumberFormat.prototype.formatToParts; the helpers must not need it.
describe('without Intl formatToParts (Hermes on iOS)', () => {
  const original = Intl.NumberFormat.prototype.formatToParts;
  beforeAll(() => {
    // @ts-expect-error simulating an engine without formatToParts
    delete Intl.NumberFormat.prototype.formatToParts;
  });
  afterAll(() => {
    Intl.NumberFormat.prototype.formatToParts = original;
  });

  it('still finds currency symbols', () => {
    expect(currencySymbol('EUR', 'pt-PT')).toBe('€');
    expect(currencySymbol('USD', 'en-US')).toBe('$');
    expect(currencySymbol('CHF', 'en-US')).toBe('CHF');
  });

  it('still splits amounts into parts that join back to formatMoney', () => {
    expect(formatMoneyParts(1299, 'USD', 'en-US')).toEqual([
      { value: '$', small: true },
      { value: '12', small: false },
      { value: '.', small: true },
      { value: '99', small: true },
    ]);
    for (const [minor, currency, locale] of [
      [1299, 'EUR', 'pt-PT'],
      [123456789, 'EUR', 'pt-PT'],
      [0, 'GBP', 'en-GB'],
      [1500, 'JPY', 'en-US'],
      [99, 'CHF', 'en-US'],
      [100000, 'BRL', 'pt-PT'],
    ] as const) {
      const joined = formatMoneyParts(minor, currency, locale)
        .map((part) => part.value)
        .join('');
      expect(joined).toBe(formatMoney(minor, currency, locale));
    }
  });

  it('still uses the locale decimal separator for edit forms', () => {
    expect(amountToInput(1299, 'EUR', 'pt-PT')).toBe('12,99');
    expect(amountToInput(1299, 'EUR', 'en-US')).toBe('12.99');
  });
});
