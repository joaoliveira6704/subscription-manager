/**
 * Up to two initials for the avatar: first and last word of the name,
 * or the first letter of the email when there is no name.
 */
export function getInitials(name: string | null | undefined, email: string | null | undefined) {
  const words = (name ?? '').trim().split(/\s+/).filter(Boolean);
  if (words.length > 0) {
    const first = Array.from(words[0])[0] ?? '';
    const last = words.length > 1 ? (Array.from(words[words.length - 1])[0] ?? '') : '';
    return (first + last).toLocaleUpperCase();
  }
  const fromEmail = Array.from((email ?? '').trim())[0];
  return fromEmail ? fromEmail.toLocaleUpperCase() : '?';
}

/**
 * SQLite's `datetime('now')` stores UTC as "YYYY-MM-DD HH:MM:SS" with no zone marker.
 * Returns null for anything that isn't a valid date.
 */
export function parseSqliteDate(value: string | null | undefined): Date | null {
  if (!value) return null;
  const trimmed = value.trim();
  const match = /^(\d{4})-(\d{2})-(\d{2})[ T](\d{2}):(\d{2}):(\d{2})$/.exec(trimmed);
  const date = match ? new Date(`${trimmed.replace(' ', 'T')}Z`) : new Date(trimmed);
  return Number.isNaN(date.getTime()) ? null : date;
}

/** Month and year an account was created, e.g. "March 2026" / "março de 2026". Null when unusable. */
export function formatMonthYear(
  createdAt: string | null | undefined,
  locale?: string,
  timeZone?: string
): string | null {
  const date = parseSqliteDate(createdAt);
  if (!date) return null;
  return new Intl.DateTimeFormat(locale, { month: 'long', year: 'numeric', timeZone }).format(date);
}
