import {
  MAX_NAME_LENGTH,
  MIN_PASSWORD_LENGTH,
  validateEmail,
  validateName,
  validateNewPassword,
  validatePasswordConfirmation,
} from '@/lib/validation';

describe('validateEmail', () => {
  it('accepts a normal email', () => {
    expect(validateEmail('user@example.com')).toBeNull();
  });

  it('accepts emails with subdomains, plus-tags and dashes', () => {
    expect(validateEmail('first.last+tag@mail.sub-domain.co.uk')).toBeNull();
  });

  it('accepts surrounding whitespace (it is trimmed)', () => {
    expect(validateEmail('  user@example.com  ')).toBeNull();
  });

  it('requires a value', () => {
    expect(validateEmail('')).toBe('Email is required');
  });

  it('treats whitespace-only input as empty', () => {
    expect(validateEmail('   \t ')).toBe('Email is required');
  });

  it.each([
    'plainaddress',
    'missing-at.example.com',
    'user@',
    '@example.com',
    'user@example',
    'user@exa mple.com',
    'us er@example.com',
    'user@@example.com',
  ])('rejects malformed email %p', (email) => {
    expect(validateEmail(email)).toBe('Enter a valid email');
  });
});

describe('validateNewPassword', () => {
  it('requires a value', () => {
    expect(validateNewPassword('')).toBe('Password is required');
  });

  it('rejects one character below the minimum', () => {
    expect(validateNewPassword('a'.repeat(MIN_PASSWORD_LENGTH - 1))).toMatch(/at least/);
  });

  it('accepts exactly the minimum length', () => {
    expect(validateNewPassword('a'.repeat(MIN_PASSWORD_LENGTH))).toBeNull();
  });

  it('accepts long passwords', () => {
    expect(validateNewPassword('x'.repeat(500))).toBeNull();
  });

  it('counts whitespace as characters (passwords are not trimmed)', () => {
    expect(validateNewPassword(' '.repeat(MIN_PASSWORD_LENGTH))).toBeNull();
  });

  it('accepts unicode and symbols', () => {
    expect(validateNewPassword('pässwörd-🔒!')).toBeNull();
  });
});

describe('validatePasswordConfirmation', () => {
  it('requires the confirmation', () => {
    expect(validatePasswordConfirmation('secret1', '')).toBe('Confirm your password');
  });

  it('passes when both match', () => {
    expect(validatePasswordConfirmation('secret1', 'secret1')).toBeNull();
  });

  it('is case sensitive', () => {
    expect(validatePasswordConfirmation('Secret1', 'secret1')).toBe('Passwords do not match');
  });

  it('does not ignore trailing whitespace', () => {
    expect(validatePasswordConfirmation('secret1', 'secret1 ')).toBe('Passwords do not match');
  });
});

describe('validateName', () => {
  it('accepts a normal name', () => {
    expect(validateName('Ada Lovelace')).toBeNull();
  });

  it('accepts accented and non-latin names', () => {
    expect(validateName('João Oliveira')).toBeNull();
    expect(validateName('山田太郎')).toBeNull();
  });

  it('requires a value', () => {
    expect(validateName('')).toBe('Name is required');
  });

  it('treats whitespace-only input as empty', () => {
    expect(validateName('    ')).toBe('Name is required');
  });

  it('accepts exactly the maximum length', () => {
    expect(validateName('a'.repeat(MAX_NAME_LENGTH))).toBeNull();
  });

  it('rejects one character over the maximum', () => {
    expect(validateName('a'.repeat(MAX_NAME_LENGTH + 1))).toMatch(/or fewer/);
  });

  it('measures length after trimming', () => {
    expect(validateName(`  ${'a'.repeat(MAX_NAME_LENGTH)}  `)).toBeNull();
  });
});
