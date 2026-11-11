export type ThemePreference = 'system' | 'light' | 'dark';

export const THEME_PREFERENCES: readonly ThemePreference[] = ['system', 'light', 'dark'];

export const DEFAULT_THEME_PREFERENCE: ThemePreference = 'system';

/** Reads a stored value safely: anything unknown falls back to following the system. */
export function parseThemePreference(value: unknown): ThemePreference {
  return THEME_PREFERENCES.includes(value as ThemePreference)
    ? (value as ThemePreference)
    : DEFAULT_THEME_PREFERENCE;
}

/** Maps a preference to the value `Appearance.setColorScheme` expects. */
export function toColorSchemeOverride(preference: ThemePreference): 'auto' | 'light' | 'dark' {
  return preference === 'system' ? 'auto' : preference;
}
