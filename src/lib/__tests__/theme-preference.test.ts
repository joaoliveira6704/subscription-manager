import {
  DEFAULT_THEME_PREFERENCE,
  parseThemePreference,
  toColorSchemeOverride,
} from '@/lib/theme-preference';

describe('parseThemePreference', () => {
  it.each(['system', 'light', 'dark'] as const)('accepts the stored value %s', (value) => {
    expect(parseThemePreference(value)).toBe(value);
  });

  it('defaults to system when nothing is stored', () => {
    expect(parseThemePreference(null)).toBe('system');
    expect(parseThemePreference(undefined)).toBe('system');
    expect(DEFAULT_THEME_PREFERENCE).toBe('system');
  });

  it('falls back to system for empty and whitespace-only strings', () => {
    expect(parseThemePreference('')).toBe('system');
    expect(parseThemePreference('   ')).toBe('system');
  });

  it('is case sensitive and rejects padded values', () => {
    expect(parseThemePreference('Dark')).toBe('system');
    expect(parseThemePreference('LIGHT')).toBe('system');
    expect(parseThemePreference(' dark ')).toBe('system');
  });

  it('falls back to system for unknown values and unexpected types', () => {
    expect(parseThemePreference('sepia')).toBe('system');
    expect(parseThemePreference('auto')).toBe('system');
    expect(parseThemePreference(1)).toBe('system');
    expect(parseThemePreference(true)).toBe('system');
    expect(parseThemePreference({ value: 'dark' })).toBe('system');
    expect(parseThemePreference('d'.repeat(10_000))).toBe('system');
  });
});

describe('toColorSchemeOverride', () => {
  it('maps system to auto so the app follows the device again', () => {
    expect(toColorSchemeOverride('system')).toBe('auto');
  });

  it('passes light and dark through', () => {
    expect(toColorSchemeOverride('light')).toBe('light');
    expect(toColorSchemeOverride('dark')).toBe('dark');
  });
});
