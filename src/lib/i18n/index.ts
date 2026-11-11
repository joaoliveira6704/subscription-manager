import { MAX_NAME_LENGTH, MIN_PASSWORD_LENGTH } from '@/lib/validation';

import { en, ptPT, type TranslationKey, type Translations } from './translations';

export type { TranslationKey } from './translations';

export type Language = 'en' | 'pt-PT';
export type LanguagePreference = 'system' | Language;

/** Language names are shown in their own language, so anyone can find theirs. */
export const LANGUAGES: readonly { value: Language; name: string }[] = [
  { value: 'en', name: 'English' },
  { value: 'pt-PT', name: 'Português (Portugal)' },
];

export const DEFAULT_LANGUAGE: Language = 'en';

const DICTIONARIES: Record<Language, Translations> = { en, 'pt-PT': ptPT };

export type TranslateParams = Record<string, string | number>;

export function parseLanguagePreference(value: unknown): LanguagePreference {
  if (value === 'system') return 'system';
  return LANGUAGES.some((language) => language.value === value)
    ? (value as Language)
    : 'system';
}

/**
 * Picks the language for a preference. For "system" it walks the device languages in order
 * and takes the first one we support; any Portuguese variant maps to pt-PT, the only one we
 * have. Falls back to English.
 */
export function resolveLanguage(
  preference: LanguagePreference,
  deviceLanguageTags: readonly (string | null | undefined)[]
): Language {
  if (preference !== 'system') return preference;

  for (const tag of deviceLanguageTags) {
    const code = tag?.trim().toLowerCase().split(/[-_]/)[0];
    if (code === 'pt') return 'pt-PT';
    if (code === 'en') return 'en';
  }
  return DEFAULT_LANGUAGE;
}

export function languageName(language: Language) {
  return LANGUAGES.find((option) => option.value === language)?.name ?? 'English';
}

function interpolate(template: string, params?: TranslateParams) {
  if (!params) return template;
  return template.replace(/\{(\w+)\}/g, (match, name: string) =>
    name in params ? String(params[name]) : match
  );
}

export function translate(language: Language, key: TranslationKey, params?: TranslateParams) {
  const template = DICTIONARIES[language][key] ?? en[key];
  return interpolate(template, params);
}

// Values the lib's error messages are built with, so they can be matched back to a key.
const MESSAGE_PARAMS: TranslateParams = { min: MIN_PASSWORD_LENGTH, max: MAX_NAME_LENGTH };

const ERROR_KEYS_BY_MESSAGE = new Map<string, TranslationKey>(
  (Object.keys(en) as TranslationKey[])
    .filter((key) => key.startsWith('errors.'))
    .map((key) => [interpolate(en[key], MESSAGE_PARAMS), key])
);

/**
 * Translates an English message returned by src/lib (validation and auth errors).
 * Unknown messages are returned unchanged rather than hidden.
 */
export function translateMessage(language: Language, message: string) {
  const key = ERROR_KEYS_BY_MESSAGE.get(message);
  return key ? translate(language, key, MESSAGE_PARAMS) : message;
}
