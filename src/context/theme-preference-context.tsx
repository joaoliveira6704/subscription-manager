import Storage from 'expo-sqlite/kv-store';
import { createContext, use, useState, type PropsWithChildren } from 'react';
import { Appearance } from 'react-native';

import {
  parseThemePreference,
  toColorSchemeOverride,
  type ThemePreference,
} from '@/lib/theme-preference';

const STORAGE_KEY = 'settings.theme';

type ThemePreferenceContextValue = {
  preference: ThemePreference;
  setPreference: (preference: ThemePreference) => void;
};

const ThemePreferenceContext = createContext<ThemePreferenceContextValue | null>(null);

function readStoredPreference(): ThemePreference {
  try {
    return parseThemePreference(Storage.getItemSync(STORAGE_KEY));
  } catch (error) {
    console.error('Failed to read theme preference', error);
    return parseThemePreference(null);
  }
}

/**
 * Applies the saved theme before the first frame (via `Appearance.setColorScheme`), so every
 * `useColorScheme()` in the app — and the native tabs — follow it without extra wiring.
 */
export function ThemePreferenceProvider({ children }: PropsWithChildren) {
  const [preference, setPreferenceState] = useState(() => {
    const stored = readStoredPreference();
    Appearance.setColorScheme(toColorSchemeOverride(stored));
    return stored;
  });

  function setPreference(next: ThemePreference) {
    setPreferenceState(next);
    Appearance.setColorScheme(toColorSchemeOverride(next));
    try {
      Storage.setItemSync(STORAGE_KEY, next);
    } catch (error) {
      console.error('Failed to save theme preference', error);
    }
  }

  return <ThemePreferenceContext value={{ preference, setPreference }}>{children}</ThemePreferenceContext>;
}

export function useThemePreference() {
  const context = use(ThemePreferenceContext);
  if (!context) throw new Error('useThemePreference must be used inside a ThemePreferenceProvider');
  return context;
}
