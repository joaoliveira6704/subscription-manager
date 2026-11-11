import {
  formatInterval,
  languageName,
  parseLanguagePreference,
  resolveLanguage,
  translate,
  translateMessage,
} from '@/lib/i18n';
import { en, ptPT, type TranslationKey } from '@/lib/i18n/translations';
import { validateSubscription } from '@/lib/subscription-validation';
import {
  MAX_NAME_LENGTH,
  MAX_NOTES_LENGTH,
  MIN_PASSWORD_LENGTH,
  validateEmail,
  validateName,
  validateNewPassword,
  validatePasswordConfirmation,
} from '@/lib/validation';

describe('parseLanguagePreference', () => {
  it.each(['system', 'en', 'pt-PT'] as const)('accepts the stored value %s', (value) => {
    expect(parseLanguagePreference(value)).toBe(value);
  });

  it('falls back to system for missing, empty and unknown values', () => {
    expect(parseLanguagePreference(null)).toBe('system');
    expect(parseLanguagePreference(undefined)).toBe('system');
    expect(parseLanguagePreference('')).toBe('system');
    expect(parseLanguagePreference('   ')).toBe('system');
    expect(parseLanguagePreference('fr')).toBe('system');
    expect(parseLanguagePreference('pt-BR')).toBe('system');
    expect(parseLanguagePreference(42)).toBe('system');
    expect(parseLanguagePreference({})).toBe('system');
  });

  it('is case sensitive', () => {
    expect(parseLanguagePreference('EN')).toBe('system');
    expect(parseLanguagePreference('pt-pt')).toBe('system');
  });
});

describe('resolveLanguage', () => {
  it('uses an explicit choice regardless of the device', () => {
    expect(resolveLanguage('pt-PT', ['en-US'])).toBe('pt-PT');
    expect(resolveLanguage('en', ['pt-PT'])).toBe('en');
  });

  it('follows the device for system', () => {
    expect(resolveLanguage('system', ['pt-PT'])).toBe('pt-PT');
    expect(resolveLanguage('system', ['en-GB'])).toBe('en');
  });

  it('maps any Portuguese variant to pt-PT, case-insensitively', () => {
    expect(resolveLanguage('system', ['pt-BR'])).toBe('pt-PT');
    expect(resolveLanguage('system', ['PT'])).toBe('pt-PT');
    expect(resolveLanguage('system', ['pt_PT'])).toBe('pt-PT');
  });

  it('takes the first supported language in the device order', () => {
    expect(resolveLanguage('system', ['fr-FR', 'pt-PT', 'en-US'])).toBe('pt-PT');
    expect(resolveLanguage('system', ['de-DE', 'en-US', 'pt-PT'])).toBe('en');
  });

  it('falls back to English for unsupported, empty or missing device languages', () => {
    expect(resolveLanguage('system', ['fr-FR', 'es-ES'])).toBe('en');
    expect(resolveLanguage('system', [])).toBe('en');
    expect(resolveLanguage('system', [null, undefined, '', '  '])).toBe('en');
  });
});

describe('translate', () => {
  it('returns the string for the language', () => {
    expect(translate('en', 'tabs.profile')).toBe('Profile');
    expect(translate('pt-PT', 'tabs.profile')).toBe('Perfil');
  });

  it('fills in placeholders', () => {
    expect(translate('pt-PT', 'profile.memberSince', { date: 'março de 2026' })).toBe(
      'Membro desde março de 2026'
    );
    expect(translate('en', 'form.newPasswordPlaceholder', { min: 6 })).toBe(
      'At least 6 characters'
    );
  });

  it('fills in 0 and empty values instead of dropping them', () => {
    expect(translate('en', 'form.newPasswordPlaceholder', { min: 0 })).toBe(
      'At least 0 characters'
    );
    expect(translate('en', 'profile.memberSince', { date: '' })).toBe('Member since ');
  });

  it('leaves unknown placeholders visible so they are easy to spot', () => {
    expect(translate('en', 'profile.memberSince')).toBe('Member since {date}');
    expect(translate('en', 'profile.memberSince', { other: 'x' })).toBe('Member since {date}');
  });
});

describe('translations', () => {
  it('has a non-empty pt-PT string for every English key', () => {
    for (const key of Object.keys(en) as TranslationKey[]) {
      expect(ptPT[key]?.trim()).toBeTruthy();
    }
  });

  it('keeps the same placeholders in both languages', () => {
    const placeholders = (text: string) => (text.match(/\{\w+\}/g) ?? []).sort();
    for (const key of Object.keys(en) as TranslationKey[]) {
      expect([key, placeholders(ptPT[key])]).toEqual([key, placeholders(en[key])]);
    }
  });
});

describe('translateMessage', () => {
  // Every message src/lib can return. If one is reworded without updating translations.ts,
  // this fails instead of silently showing English to Portuguese users.
  const libMessages = [
    validateEmail(''),
    validateEmail('nope'),
    validateNewPassword(''),
    validateNewPassword('a'),
    validatePasswordConfirmation('abcdef', ''),
    validatePasswordConfirmation('abcdef', 'abcdeg'),
    validateName(''),
    validateName('a'.repeat(MAX_NAME_LENGTH + 1)),
    'Email already in use',
    'Could not create account',
    'Invalid email or password',
    'No account found with that email',
    'Current password is incorrect',
    'Account not found',
    'New password must be different from the current one',
    'You are signed out',
    ...Object.values(
      validateSubscription({ notes: 'n'.repeat(MAX_NOTES_LENGTH + 1), intervalCount: 0 })
    ),
    ...Object.values(
      validateSubscription({
        paymentMethod: 'card',
        cardBrand: 'diners' as never,
        cardLast4: '12345',
      })
    ),
    ...Object.values(validateSubscription({ paymentMethod: 'cash' as never })),
    'Subscription not found',
    'Could not save subscription',
    'Could not load your subscriptions',
  ] as string[];

  it.each(libMessages)('translates "%s" to pt-PT', (message) => {
    expect(message).toBeTruthy();
    const translated = translateMessage('pt-PT', message);
    expect(translated).not.toBe(message);
    expect(translated).not.toMatch(/\{\w+\}/);
  });

  it('keeps the numbers in messages with limits', () => {
    expect(
      translateMessage('pt-PT', `Password must be at least ${MIN_PASSWORD_LENGTH} characters`)
    ).toBe(`A palavra-passe deve ter pelo menos ${MIN_PASSWORD_LENGTH} caracteres`);
    expect(translateMessage('pt-PT', `Name must be ${MAX_NAME_LENGTH} characters or fewer`)).toBe(
      `O nome deve ter no máximo ${MAX_NAME_LENGTH} caracteres`
    );
  });

  it('returns English messages unchanged in English', () => {
    expect(translateMessage('en', 'Email already in use')).toBe('Email already in use');
  });

  it('returns unknown messages unchanged', () => {
    expect(translateMessage('pt-PT', 'Something new went wrong')).toBe('Something new went wrong');
    expect(translateMessage('pt-PT', '')).toBe('');
  });

  it('is exact: different case or extra spaces are not matched', () => {
    expect(translateMessage('pt-PT', 'email already in use')).toBe('email already in use');
    expect(translateMessage('pt-PT', ' Email already in use')).toBe(' Email already in use');
  });
});

describe('languageName', () => {
  it('names each language in its own language', () => {
    expect(languageName('en')).toBe('English');
    expect(languageName('pt-PT')).toBe('Português (Portugal)');
  });
});

describe('formatInterval', () => {
  it('uses the single-word label for every 1 unit', () => {
    expect(formatInterval('en', { unit: 'month', count: 1 })).toBe('Monthly');
    expect(formatInterval('pt-PT', { unit: 'week', count: 1 })).toBe('Semanal');
    expect(formatInterval('en', { unit: 'day', count: 1 })).toBe('Daily');
  });

  it('spells out custom intervals in each language', () => {
    expect(formatInterval('en', { unit: 'month', count: 3 })).toBe('Every 3 months');
    expect(formatInterval('pt-PT', { unit: 'week', count: 2 })).toBe('A cada 2 semanas');
    expect(formatInterval('pt-PT', { unit: 'year', count: 99 })).toBe('A cada 99 anos');
  });
});
