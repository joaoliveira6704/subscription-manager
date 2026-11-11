import {
  advance,
  daysBetween,
  daysInMonth,
  dueGroup,
  groupByDue,
  isIntervalCount,
  isISODate,
  nextPaymentFrom,
  parseISODate,
  presetFor,
  todayISO,
  toMonthly,
  toYearly,
  totalsByCurrency,
  type Interval,
} from '@/lib/billing';

const monthly: Interval = { unit: 'month', count: 1 };
const yearly: Interval = { unit: 'year', count: 1 };
const weekly: Interval = { unit: 'week', count: 1 };

describe('parseISODate', () => {
  it('accepts real calendar days, including 29 February in leap years', () => {
    expect(parseISODate('2026-03-15')).toEqual({ year: 2026, month: 3, day: 15 });
    expect(parseISODate('2028-02-29')).toEqual({ year: 2028, month: 2, day: 29 });
  });

  it('rejects impossible dates and bad formats', () => {
    expect(parseISODate('2026-02-29')).toBeNull();
    expect(parseISODate('2026-04-31')).toBeNull();
    expect(parseISODate('2026-13-01')).toBeNull();
    expect(parseISODate('2026-00-10')).toBeNull();
    expect(parseISODate('2026-3-5')).toBeNull();
    expect(parseISODate('15/03/2026')).toBeNull();
    expect(parseISODate('')).toBeNull();
    expect(parseISODate(null)).toBeNull();
    expect(isISODate(20260315)).toBe(false);
  });
});

describe('daysInMonth', () => {
  it('handles February in leap and common years, including century rules', () => {
    expect(daysInMonth(2028, 2)).toBe(29);
    expect(daysInMonth(2026, 2)).toBe(28);
    expect(daysInMonth(2100, 2)).toBe(28);
    expect(daysInMonth(2000, 2)).toBe(29);
    expect(daysInMonth(2026, 4)).toBe(30);
    expect(daysInMonth(2026, 12)).toBe(31);
  });
});

describe('advance', () => {
  it('keeps a renewal on the 31st, clamping short months', () => {
    let date = '2026-01-31';
    const seen: string[] = [];
    for (let i = 0; i < 4; i++) {
      date = advance(date, monthly, 31);
      seen.push(date);
    }
    expect(seen).toEqual(['2026-02-28', '2026-03-31', '2026-04-30', '2026-05-31']);
  });

  it('keeps renewals on the 29th and 30th through February', () => {
    expect(advance('2026-01-29', monthly, 29)).toBe('2026-02-28');
    expect(advance('2026-02-28', monthly, 29)).toBe('2026-03-29');
    expect(advance('2028-01-30', monthly, 30)).toBe('2028-02-29');
  });

  it('rolls over the year end and handles multi-month and multi-year steps', () => {
    expect(advance('2026-12-15', monthly, 15)).toBe('2027-01-15');
    expect(advance('2026-11-30', { unit: 'month', count: 3 }, 30)).toBe('2027-02-28');
    expect(advance('2026-06-01', { unit: 'year', count: 2 }, 1)).toBe('2028-06-01');
  });

  it('moves yearly renewals from 29 February to 28 February', () => {
    expect(advance('2028-02-29', yearly, 29)).toBe('2029-02-28');
    expect(advance('2031-02-28', yearly, 29)).toBe('2032-02-29');
  });

  it('adds days and weeks across month and year ends', () => {
    expect(advance('2026-01-28', weekly, 28)).toBe('2026-02-04');
    expect(advance('2026-12-29', { unit: 'week', count: 2 }, 29)).toBe('2027-01-12');
    expect(advance('2028-02-25', { unit: 'day', count: 10 }, 25)).toBe('2028-03-06');
  });

  it('throws on an invalid date', () => {
    expect(() => advance('nope', monthly, 1)).toThrow('Invalid date');
  });
});

describe('nextPaymentFrom', () => {
  const today = '2026-11-11';

  it('returns the first payment when it is still in the future', () => {
    expect(nextPaymentFrom('2027-01-05', monthly, 5, today)).toBe('2027-01-05');
    expect(nextPaymentFrom('2026-11-12', weekly, 12, today)).toBe('2026-11-12');
  });

  it('treats a first payment made today as paid, so the next one is a period later', () => {
    expect(nextPaymentFrom('2026-11-11', monthly, 11, today)).toBe('2026-12-11');
    expect(nextPaymentFrom('2026-11-11', weekly, 11, today)).toBe('2026-11-18');
    expect(nextPaymentFrom('2026-11-11', yearly, 11, today)).toBe('2027-11-11');
    expect(nextPaymentFrom('2026-11-11', { unit: 'day', count: 10 }, 11, today)).toBe('2026-11-21');
  });

  it('treats a renewal that falls today as paid', () => {
    expect(nextPaymentFrom('2026-09-11', monthly, 11, today)).toBe('2026-12-11');
    expect(nextPaymentFrom('2026-11-04', weekly, 4, today)).toBe('2026-11-18');
    expect(nextPaymentFrom('2026-01-31', monthly, 31, '2026-02-28')).toBe('2026-03-31');
  });

  it('finds the next monthly payment from a past first payment', () => {
    expect(nextPaymentFrom('2024-03-14', monthly, 14, today)).toBe('2026-11-14');
    expect(nextPaymentFrom('2024-03-05', monthly, 5, today)).toBe('2026-12-05');
  });

  it('keeps the 31st, clamped to the month the payment falls in', () => {
    expect(nextPaymentFrom('2026-01-31', monthly, 31, today)).toBe('2026-11-30');
    expect(nextPaymentFrom('2026-01-31', monthly, 31, '2027-02-01')).toBe('2027-02-28');
  });

  it('counts every N months from the first payment', () => {
    // 30 Nov 2025 + 3-month steps: 28 Feb, 30 May, 30 Aug, 30 Nov 2026.
    expect(nextPaymentFrom('2025-11-30', { unit: 'month', count: 3 }, 30, today)).toBe('2026-11-30');
    expect(nextPaymentFrom('2026-02-10', { unit: 'month', count: 6 }, 10, today)).toBe('2027-02-10');
  });

  it('handles yearly from 29 February', () => {
    expect(nextPaymentFrom('2024-02-29', yearly, 29, today)).toBe('2027-02-28');
    expect(nextPaymentFrom('2024-02-29', yearly, 29, '2028-02-15')).toBe('2028-02-29');
    expect(nextPaymentFrom('2020-06-01', { unit: 'year', count: 2 }, 1, today)).toBe('2028-06-01');
  });

  it('counts days and weeks, including across a year end', () => {
    expect(nextPaymentFrom('2026-11-01', weekly, 1, today)).toBe('2026-11-15');
    expect(nextPaymentFrom('2026-12-20', { unit: 'week', count: 2 }, 20, '2027-01-02')).toBe('2027-01-03');
  });

  it('handles every 10 days from years ago without looping', () => {
    const next = nextPaymentFrom('2000-01-01', { unit: 'day', count: 10 }, 1, today);
    expect(next > today).toBe(true);
    expect(daysBetween('2000-01-01', next) % 10).toBe(0);
    expect(daysBetween(today, next)).toBeLessThanOrEqual(10);
  });

  it('throws on invalid dates', () => {
    expect(() => nextPaymentFrom('bad', monthly, 1, today)).toThrow('Invalid date');
  });
});

describe('intervals', () => {
  it('accepts counts from 1 to 99 only', () => {
    expect(isIntervalCount(1)).toBe(true);
    expect(isIntervalCount(99)).toBe(true);
    expect(isIntervalCount(0)).toBe(false);
    expect(isIntervalCount(100)).toBe(false);
    expect(isIntervalCount(-1)).toBe(false);
    expect(isIntervalCount(1.5)).toBe(false);
    expect(isIntervalCount('3')).toBe(false);
    expect(isIntervalCount(null)).toBe(false);
  });

  it('maps intervals to form presets', () => {
    expect(presetFor(weekly)).toBe('weekly');
    expect(presetFor(monthly)).toBe('monthly');
    expect(presetFor(yearly)).toBe('yearly');
    expect(presetFor({ unit: 'month', count: 3 })).toBe('custom');
    expect(presetFor({ unit: 'day', count: 1 })).toBe('custom');
  });
});

describe('toMonthly / toYearly', () => {
  it('normalises each interval to a monthly average, rounded to the nearest cent', () => {
    expect(toMonthly(999, monthly)).toBe(999);
    expect(toMonthly(11988, yearly)).toBe(999);
    expect(toMonthly(1000, yearly)).toBe(83); // 83.33
    expect(toMonthly(500, weekly)).toBe(2167); // 2166.67
    expect(toMonthly(3000, { unit: 'month', count: 3 })).toBe(1000);
    expect(toMonthly(2400, { unit: 'year', count: 2 })).toBe(100);
    expect(toMonthly(100, { unit: 'day', count: 1 })).toBe(3042); // 3041.67
    expect(toMonthly(1000, { unit: 'week', count: 2 })).toBe(2167);
  });

  it('gives yearly totals', () => {
    expect(toYearly(999, monthly)).toBe(11988);
    expect(toYearly(500, weekly)).toBe(26000);
    expect(toYearly(4999, yearly)).toBe(4999);
    expect(toYearly(3000, { unit: 'month', count: 3 })).toBe(12000);
    expect(toYearly(999, { unit: 'year', count: 2 })).toBe(500); // 499.5 rounds up
  });

  it('keeps free plans at zero', () => {
    expect(toMonthly(0, weekly)).toBe(0);
    expect(toYearly(0, { unit: 'day', count: 7 })).toBe(0);
  });
});

describe('totalsByCurrency', () => {
  it('sums per currency without converting, largest first', () => {
    expect(
      totalsByCurrency([
        { amountMinor: 999, currency: 'EUR', interval: monthly },
        { amountMinor: 1299, currency: 'EUR', interval: monthly },
        { amountMinor: 11988, currency: 'USD', interval: yearly },
      ])
    ).toEqual([
      { currency: 'EUR', monthly: 2298, yearly: 27576 },
      { currency: 'USD', monthly: 999, yearly: 11988 },
    ]);
  });

  it('returns an empty list for no subscriptions and zero totals for free ones', () => {
    expect(totalsByCurrency([])).toEqual([]);
    expect(totalsByCurrency([{ amountMinor: 0, currency: 'EUR', interval: monthly }])).toEqual([
      { currency: 'EUR', monthly: 0, yearly: 0 },
    ]);
  });
});

describe('due groups', () => {
  const today = '2026-11-11';

  it('classifies by days until payment', () => {
    expect(dueGroup('2026-11-11', today)).toBe('today');
    expect(dueGroup('2026-11-12', today)).toBe('next7Days');
    expect(dueGroup('2026-11-18', today)).toBe('next7Days');
    expect(dueGroup('2026-11-19', today)).toBe('thisMonth');
    expect(dueGroup('2026-11-30', today)).toBe('thisMonth');
    expect(dueGroup('2026-12-01', today)).toBe('later');
  });

  it('puts next week in "next 7 days" even across a month end', () => {
    expect(dueGroup('2026-12-03', '2026-11-28')).toBe('next7Days');
  });

  it('groups and sorts by date then name, leaving out empty groups', () => {
    const groups = groupByDue(
      [
        { name: 'Spotify', nextPayment: '2026-12-02' },
        { name: 'Netflix', nextPayment: '2026-11-14' },
        { name: 'Apple', nextPayment: '2026-11-14' },
      ],
      today
    );
    expect(groups.map((g) => [g.group, g.items.map((i) => i.name)])).toEqual([
      ['next7Days', ['Apple', 'Netflix']],
      ['later', ['Spotify']],
    ]);
    expect(groupByDue([], today)).toEqual([]);
  });
});

describe('date helpers', () => {
  it('counts days across a leap day', () => {
    expect(daysBetween('2028-02-28', '2028-03-01')).toBe(2);
    expect(daysBetween('2026-11-11', '2026-11-01')).toBe(-10);
    expect(daysBetween('bad', '2026-11-01')).toBeNaN();
  });

  it('formats today from the local calendar date', () => {
    expect(todayISO(new Date(2026, 0, 5, 23, 59))).toBe('2026-01-05');
  });
});
