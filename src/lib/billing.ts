/**
 * Billing date and money math. Dates are calendar days stored as "YYYY-MM-DD" strings (no time
 * zone), so a renewal on the 14th is the 14th wherever the user is.
 */
import type { Currency } from '@/lib/money';

export const INTERVAL_UNITS = ['day', 'week', 'month', 'year'] as const;
export type IntervalUnit = (typeof INTERVAL_UNITS)[number];
export const MAX_INTERVAL_COUNT = 99;

/** How often a subscription renews: every `count` `unit`s, e.g. every 3 months. */
export type Interval = { unit: IntervalUnit; count: number };

export function isIntervalUnit(value: unknown): value is IntervalUnit {
  return typeof value === 'string' && (INTERVAL_UNITS as readonly string[]).includes(value);
}

export function isIntervalCount(value: unknown): value is number {
  return (
    typeof value === 'number' &&
    Number.isInteger(value) &&
    value >= 1 &&
    value <= MAX_INTERVAL_COUNT
  );
}

/** The quick presets in the form; anything else is "custom". */
export type IntervalPreset = 'weekly' | 'monthly' | 'yearly' | 'custom';
export const PRESET_INTERVALS: Record<Exclude<IntervalPreset, 'custom'>, Interval> = {
  weekly: { unit: 'week', count: 1 },
  monthly: { unit: 'month', count: 1 },
  yearly: { unit: 'year', count: 1 },
};

export function presetFor({ unit, count }: Interval): IntervalPreset {
  if (count !== 1) return 'custom';
  if (unit === 'week') return 'weekly';
  if (unit === 'month') return 'monthly';
  if (unit === 'year') return 'yearly';
  return 'custom';
}

type CalendarDate = { year: number; month: number; day: number };

export function daysInMonth(year: number, month: number) {
  // Day 0 of the next month is the last day of this one. Months are 1-based here.
  return new Date(Date.UTC(year, month, 0)).getUTCDate();
}

export function parseISODate(value: string | null | undefined): CalendarDate | null {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value?.trim() ?? '');
  if (!match) return null;
  const [year, month, day] = match.slice(1).map(Number);
  if (month < 1 || month > 12 || day < 1 || day > daysInMonth(year, month)) return null;
  return { year, month, day };
}

export function isISODate(value: unknown): value is string {
  return typeof value === 'string' && parseISODate(value) !== null;
}

export function toISODate({ year, month, day }: CalendarDate) {
  return `${String(year).padStart(4, '0')}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
}

/** Today's calendar date in the device's time zone. */
export function todayISO(now: Date = new Date()) {
  return toISODate({ year: now.getFullYear(), month: now.getMonth() + 1, day: now.getDate() });
}

/** A local `Date` at midnight for a stored day, for date pickers and `Intl` formatting. */
export function isoToLocalDate(value: string) {
  const date = parseISODate(value);
  if (!date) return null;
  return new Date(date.year, date.month - 1, date.day);
}

export function localDateToISO(date: Date) {
  return todayISO(date);
}

function toUTC({ year, month, day }: CalendarDate) {
  return Date.UTC(year, month - 1, day);
}

/** Whole days from `from` to `to` (negative if `to` is earlier). */
export function daysBetween(from: string, to: string) {
  const a = parseISODate(from);
  const b = parseISODate(to);
  if (!a || !b) return NaN;
  return Math.round((toUTC(b) - toUTC(a)) / 86_400_000);
}

function addDays(date: CalendarDate, days: number): string {
  const next = new Date(toUTC(date) + days * 86_400_000);
  return toISODate({
    year: next.getUTCFullYear(),
    month: next.getUTCMonth() + 1,
    day: next.getUTCDate(),
  });
}

/** Adds whole months, landing on `billingDay` clamped to the month's length. */
function addMonths(date: CalendarDate, months: number, billingDay: number): string {
  const index = date.year * 12 + (date.month - 1) + months;
  const year = Math.floor(index / 12);
  const month = (index % 12) + 1;
  return toISODate({ year, month, day: Math.min(billingDay, daysInMonth(year, month)) });
}

function stepDays({ unit, count }: Interval) {
  return unit === 'day' ? count : count * 7;
}

function stepMonths({ unit, count }: Interval) {
  return unit === 'month' ? count : count * 12;
}

/**
 * The payment after `date`. Months and years keep the day the user first paid on
 * (`billingDay`), clamped to short months: billed on the 31st → 28/29 Feb → 31 Mar.
 */
export function advance(date: string, interval: Interval, billingDay: number): string {
  const current = parseISODate(date);
  if (!current) throw new Error(`Invalid date: ${date}`);
  if (interval.unit === 'day' || interval.unit === 'week') {
    return addDays(current, stepDays(interval));
  }
  return addMonths(current, stepMonths(interval), billingDay);
}

/**
 * The next payment still to come, counted from the first payment. A payment that falls on
 * `today` counts as paid, so a first payment made today gives the one a period later; only a
 * first payment in the future is returned as is. Computed directly (no looping), so a daily
 * subscription started years ago is just as cheap.
 */
export function nextPaymentFrom(
  firstPayment: string,
  interval: Interval,
  billingDay: number,
  today: string
): string {
  const first = parseISODate(firstPayment);
  const now = parseISODate(today);
  if (!first || !now) throw new Error(`Invalid date: ${firstPayment} / ${today}`);
  if (firstPayment > today) return firstPayment;

  if (interval.unit === 'day' || interval.unit === 'week') {
    const step = stepDays(interval);
    const periods = Math.floor(daysBetween(firstPayment, today) / step) + 1;
    return addDays(first, periods * step);
  }

  const step = stepMonths(interval);
  const monthsApart = (now.year - first.year) * 12 + (now.month - first.month);
  let periods = Math.max(0, Math.ceil(monthsApart / step));
  let candidate = addMonths(first, periods * step, billingDay);
  // Same month but an earlier day (or today): this period's payment is already made.
  if (candidate <= today) {
    periods += 1;
    candidate = addMonths(first, periods * step, billingDay);
  }
  return candidate;
}

/** Average monthly cost in minor units, rounded to the nearest unit. */
export function toMonthly(minor: number, { unit, count }: Interval) {
  if (unit === 'day') return Math.round((minor * 365) / (12 * count));
  if (unit === 'week') return Math.round((minor * 52) / (12 * count));
  if (unit === 'month') return Math.round(minor / count);
  return Math.round(minor / (12 * count));
}

/** Average yearly cost in minor units, rounded to the nearest unit. */
export function toYearly(minor: number, { unit, count }: Interval) {
  if (unit === 'day') return Math.round((minor * 365) / count);
  if (unit === 'week') return Math.round((minor * 52) / count);
  if (unit === 'month') return Math.round((minor * 12) / count);
  return Math.round(minor / count);
}

type Billable = { amountMinor: number; currency: Currency; interval: Interval };
export type CurrencyTotal = { currency: Currency; monthly: number; yearly: number };

/** Monthly and yearly totals per currency, largest monthly total first. No exchange rates. */
export function totalsByCurrency(items: readonly Billable[]): CurrencyTotal[] {
  const totals = new Map<Currency, CurrencyTotal>();
  for (const item of items) {
    const total = totals.get(item.currency) ?? { currency: item.currency, monthly: 0, yearly: 0 };
    total.monthly += toMonthly(item.amountMinor, item.interval);
    total.yearly += toYearly(item.amountMinor, item.interval);
    totals.set(item.currency, total);
  }
  return [...totals.values()].sort(
    (a, b) => b.monthly - a.monthly || a.currency.localeCompare(b.currency)
  );
}

export type DueGroup = 'today' | 'next7Days' | 'thisMonth' | 'later';
const GROUP_ORDER: DueGroup[] = ['today', 'next7Days', 'thisMonth', 'later'];

export function dueGroup(nextPayment: string, today: string): DueGroup {
  const days = daysBetween(today, nextPayment);
  if (days <= 0) return 'today';
  if (days <= 7) return 'next7Days';
  if (nextPayment.slice(0, 7) === today.slice(0, 7)) return 'thisMonth';
  return 'later';
}

/** Items grouped by when they're due, soonest first; empty groups are left out. */
export function groupByDue<T extends { nextPayment: string; name: string }>(
  items: readonly T[],
  today: string
): { group: DueGroup; items: T[] }[] {
  const sorted = [...items].sort(
    (a, b) => a.nextPayment.localeCompare(b.nextPayment) || a.name.localeCompare(b.name)
  );
  return GROUP_ORDER.map((group) => ({
    group,
    items: sorted.filter((item) => dueGroup(item.nextPayment, today) === group),
  })).filter((entry) => entry.items.length > 0);
}
