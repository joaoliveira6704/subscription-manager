import {
  CARD_BRANDS,
  PAYMENT_METHODS,
  cardDigitsInput,
  formatCardLabel,
  isCardBrand,
  isCardLast4,
  isPaymentMethod,
  paymentDetailLabel,
  paymentLabel,
} from '@/lib/payment-methods';

describe('isPaymentMethod', () => {
  it('accepts every known method', () => {
    for (const method of PAYMENT_METHODS) expect(isPaymentMethod(method)).toBe(true);
  });

  it('rejects unknown values, wrong case and non-strings', () => {
    for (const value of ['', 'cash', 'Card', 'CARD', null, undefined, 1, {}]) {
      expect(isPaymentMethod(value)).toBe(false);
    }
  });
});

describe('isCardBrand', () => {
  it('accepts every known brand and rejects others', () => {
    for (const brand of CARD_BRANDS) expect(isCardBrand(brand)).toBe(true);
    for (const value of ['', 'Visa', 'diners', null, undefined, 4]) {
      expect(isCardBrand(value)).toBe(false);
    }
  });
});

describe('isCardLast4', () => {
  it('accepts exactly four digits, including leading zeros', () => {
    expect(isCardLast4('4242')).toBe(true);
    expect(isCardLast4('0007')).toBe(true);
  });

  it('rejects fewer or more digits, so a full card number is never stored', () => {
    for (const value of ['', '1', '123', '12345', '4242424242424242', '4242 4242 4242 4242']) {
      expect(isCardLast4(value)).toBe(false);
    }
  });

  it('rejects letters, spaces, signs, other digit scripts and non-strings', () => {
    for (const value of ['12a4', ' 4242', '4242 ', '-424', '١٢٣٤', null, undefined, 4242]) {
      expect(isCardLast4(value)).toBe(false);
    }
  });
});

describe('cardDigitsInput', () => {
  it('keeps only digits and at most four of them', () => {
    expect(cardDigitsInput('42')).toBe('42');
    expect(cardDigitsInput('4 2-4a2')).toBe('4242');
    expect(cardDigitsInput('123456')).toBe('3456');
  });

  it('keeps the last four digits when a full number is pasted', () => {
    expect(cardDigitsInput('4111 1111 1111 1234')).toBe('1234');
  });

  it('handles empty and whitespace-only input', () => {
    expect(cardDigitsInput('')).toBe('');
    expect(cardDigitsInput('   ')).toBe('');
  });
});

describe('formatCardLabel', () => {
  it('combines the brand and masked last digits', () => {
    expect(formatCardLabel('Visa', '4242')).toBe('Visa •••• 4242');
  });

  it('shows whichever part is known', () => {
    expect(formatCardLabel(null, '4242')).toBe('•••• 4242');
    expect(formatCardLabel('Mastercard', null)).toBe('Mastercard');
    expect(formatCardLabel('Mastercard', '')).toBe('Mastercard');
  });

  it('returns null when nothing is known or the digits are invalid', () => {
    expect(formatCardLabel(null, null)).toBeNull();
    expect(formatCardLabel('', '')).toBeNull();
    expect(formatCardLabel(null, '12345')).toBeNull();
  });
});

describe('paymentLabel', () => {
  const labels = {
    method: (method: string) => `M:${method}`,
    brand: (brand: string) => `B:${brand}`,
  };

  it('shows the masked last digits for a card when known', () => {
    expect(paymentLabel('card', 'visa', '4242', labels)).toBe('•••• 4242');
    expect(paymentLabel('card', null, '0007', labels)).toBe('•••• 0007');
  });

  it('falls back to the card type, then to "card"', () => {
    expect(paymentLabel('card', 'amex', null, labels)).toBe('B:amex');
    expect(paymentLabel('card', null, null, labels)).toBe('M:card');
  });

  it('shows the method name for other methods, ignoring card details', () => {
    expect(paymentLabel('paypal', 'visa', '4242', labels)).toBe('M:paypal');
  });

  it('returns null when no payment method is set', () => {
    expect(paymentLabel(null, null, null, labels)).toBeNull();
  });
});

describe('paymentDetailLabel', () => {
  const labels = {
    method: (method: string) => `M:${method}`,
    brand: (brand: string) => `B:${brand}`,
  };

  it('shows the card type with the masked last digits', () => {
    expect(paymentDetailLabel('card', 'visa', '4242', labels)).toBe('B:visa •••• 4242');
  });

  it('shows whichever card detail is known, else "card"', () => {
    expect(paymentDetailLabel('card', null, '4242', labels)).toBe('•••• 4242');
    expect(paymentDetailLabel('card', 'amex', null, labels)).toBe('B:amex');
    expect(paymentDetailLabel('card', null, null, labels)).toBe('M:card');
  });

  it('shows the method name for other methods and null when none is set', () => {
    expect(paymentDetailLabel('directDebit', 'visa', '4242', labels)).toBe('M:directDebit');
    expect(paymentDetailLabel(null, null, null, labels)).toBeNull();
  });
});
