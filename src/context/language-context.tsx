import { useLocales } from 'expo-localization';
import Storage from 'expo-sqlite/kv-store';
import { createContext, use, useState, type PropsWithChildren } from 'react';

import {
  parseLanguagePreference,
  resolveLanguage,
  translate,
  translateMessage,
  type Language,
  type LanguagePreference,
  type TranslateParams,
  type TranslationKey,
} from '@/lib/i18n';

const STORAGE_KEY = 'settings.language';

type LanguageContextValue = {
  preference: LanguagePreference;
  setPreference: (preference: LanguagePreference) => void;
  /** The language in use: the explicit choice, or the device's when following the system. */
  language: Language;
  /** BCP 47 tag for `Intl` formatting (dates, money). */
  locale: string;
  t: (key: TranslationKey, params?: TranslateParams) => string;
  /** Translates an error message returned by src/lib. */
  tm: (message: string) => string;
};

const LanguageContext = createContext<LanguageContextValue | null>(null);

function readStoredPreference(): LanguagePreference {
  try {
    return parseLanguagePreference(Storage.getItemSync(STORAGE_KEY));
  } catch (error) {
    console.error('Failed to read language preference', error);
    return 'system';
  }
}

export function LanguageProvider({ children }: PropsWithChildren) {
  const deviceLocales = useLocales();
  const [preference, setPreferenceState] = useState(readStoredPreference);

  const language = resolveLanguage(
    preference,
    deviceLocales.map((locale) => locale.languageTag)
  );

  function setPreference(next: LanguagePreference) {
    setPreferenceState(next);
    try {
      Storage.setItemSync(STORAGE_KEY, next);
    } catch (error) {
      console.error('Failed to save language preference', error);
    }
  }

  const value: LanguageContextValue = {
    preference,
    setPreference,
    language,
    locale: language,
    t: (key, params) => translate(language, key, params),
    tm: (message) => translateMessage(language, message),
  };

  return <LanguageContext value={value}>{children}</LanguageContext>;
}

export function useTranslation() {
  const context = use(LanguageContext);
  if (!context) throw new Error('useTranslation must be used inside a LanguageProvider');
  return context;
}
