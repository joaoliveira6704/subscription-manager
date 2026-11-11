import { logoDomainFor, logoUrlFor, normalizeBrandName } from '@/lib/logos';

describe('normalizeBrandName', () => {
  it('lowercases and drops spaces, punctuation and accents', () => {
    expect(normalizeBrandName('  Disney+ ')).toBe('disneyplus');
    expect(normalizeBrandName('YouTube Premium')).toBe('youtubepremium');
    expect(normalizeBrandName('Crème-Brûlée.TV')).toBe('cremebruleetv');
  });

  it('handles empty, null and undefined', () => {
    expect(normalizeBrandName('')).toBe('');
    expect(normalizeBrandName('   ')).toBe('');
    expect(normalizeBrandName(null)).toBe('');
    expect(normalizeBrandName(undefined)).toBe('');
  });
});

describe('logoDomainFor', () => {
  it('recognises well-known brands regardless of case and spacing', () => {
    expect(logoDomainFor('Netflix')).toBe('netflix.com');
    expect(logoDomainFor('netflix')).toBe('netflix.com');
    expect(logoDomainFor('NETFLIX ')).toBe('netflix.com');
    expect(logoDomainFor('Claude')).toBe('claude.ai');
    expect(logoDomainFor('ChatGPT')).toBe('openai.com');
    expect(logoDomainFor('Spotify')).toBe('spotify.com');
    expect(logoDomainFor('Disney+')).toBe('disneyplus.com');
    expect(logoDomainFor('Disney Plus')).toBe('disneyplus.com');
  });

  it('matches common plan names that start with a known brand', () => {
    expect(logoDomainFor('Netflix Premium')).toBe('netflix.com');
    expect(logoDomainFor('Spotify Family')).toBe('spotify.com');
    expect(logoDomainFor('Claude Pro')).toBe('claude.ai');
    expect(logoDomainFor('YouTube Premium')).toBe('youtube.com');
  });

  it('uses a name that is already a domain', () => {
    expect(logoDomainFor('figma.com')).toBe('figma.com');
    expect(logoDomainFor('https://www.Example.org/path')).toBe('example.org');
  });

  it('returns null for unknown names instead of guessing', () => {
    expect(logoDomainFor('Gym down the street')).toBeNull();
    expect(logoDomainFor('Test music')).toBeNull();
    expect(logoDomainFor('')).toBeNull();
    expect(logoDomainFor(null)).toBeNull();
  });

  it('does not match a short brand inside an unrelated word', () => {
    // "max" (HBO Max) must not match "Maximum gym".
    expect(logoDomainFor('Maximum gym')).toBeNull();
  });
});

describe('logoUrlFor', () => {
  it('builds a favicon URL for known brands and null otherwise', () => {
    expect(logoUrlFor('Netflix')).toBe(
      'https://www.google.com/s2/favicons?domain=netflix.com&sz=128'
    );
    expect(logoUrlFor('Unknown thing')).toBeNull();
  });
});
