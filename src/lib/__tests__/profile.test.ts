import { formatMonthYear, getInitials, parseSqliteDate } from '@/lib/profile';

describe('getInitials', () => {
  it('uses the first letter of a single name', () => {
    expect(getInitials('joão', 'j@mail.com')).toBe('J');
  });

  it('uses the first and last word of a full name', () => {
    expect(getInitials('Ana Maria Costa', 'a@mail.com')).toBe('AC');
  });

  it('ignores extra whitespace between and around words', () => {
    expect(getInitials('  qa    tester  ', 'q@mail.com')).toBe('QT');
  });

  it('falls back to the email for empty or whitespace-only names', () => {
    expect(getInitials('', 'user@mail.com')).toBe('U');
    expect(getInitials('   ', 'user@mail.com')).toBe('U');
  });

  it('handles null and undefined inputs', () => {
    expect(getInitials(null, 'x@mail.com')).toBe('X');
    expect(getInitials(undefined, undefined)).toBe('?');
    expect(getInitials(null, '  ')).toBe('?');
  });

  it('keeps accented letters and emoji intact', () => {
    expect(getInitials('élodie ñúñez', null)).toBe('ÉÑ');
    expect(getInitials('😀 Smile', null)).toBe('😀S');
  });

  it('only returns two initials for very long names', () => {
    expect(getInitials('a '.repeat(500), null)).toBe('AA');
  });
});

describe('parseSqliteDate', () => {
  it('reads SQLite timestamps as UTC', () => {
    expect(parseSqliteDate('2026-03-15 10:30:00')?.toISOString()).toBe('2026-03-15T10:30:00.000Z');
  });

  it('accepts ISO strings', () => {
    expect(parseSqliteDate('2026-03-15T10:30:00Z')?.toISOString()).toBe('2026-03-15T10:30:00.000Z');
  });

  it('accepts leap day', () => {
    expect(parseSqliteDate('2028-02-29 00:00:00')?.toISOString()).toBe('2028-02-29T00:00:00.000Z');
  });

  it('returns null for empty, null and invalid input', () => {
    expect(parseSqliteDate('')).toBeNull();
    expect(parseSqliteDate('   ')).toBeNull();
    expect(parseSqliteDate(null)).toBeNull();
    expect(parseSqliteDate(undefined)).toBeNull();
    expect(parseSqliteDate('not a date')).toBeNull();
  });
});

describe('formatMonthYear', () => {
  it('formats month and year in the given locale', () => {
    expect(formatMonthYear('2026-03-15 10:30:00', 'en-US', 'UTC')).toBe(
      'March 2026'
    );
  });

  it('uses the time zone to decide the month at a month end', () => {
    // 23:30 UTC on 31 January is already 1 February in Tokyo (UTC+9).
    expect(formatMonthYear('2026-01-31 23:30:00', 'en-US', 'Asia/Tokyo')).toBe(
      'February 2026'
    );
    expect(formatMonthYear('2026-01-31 23:30:00', 'en-US', 'UTC')).toBe(
      'January 2026'
    );
  });

  it('rolls over the year on 31 December in zones ahead of UTC', () => {
    expect(formatMonthYear('2025-12-31 20:00:00', 'en-US', 'Asia/Tokyo')).toBe(
      'January 2026'
    );
  });

  it('formats in European Portuguese', () => {
    expect(formatMonthYear('2026-03-15 10:30:00', 'pt-PT', 'UTC')).toBe('março de 2026');
  });

  it('returns null when the date is missing or invalid', () => {
    expect(formatMonthYear(null)).toBeNull();
    expect(formatMonthYear('')).toBeNull();
    expect(formatMonthYear('garbage')).toBeNull();
  });
});
