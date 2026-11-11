/**
 * Brand logos for subscriptions. Only names we recognise (or names that are already a domain)
 * get a logo; anything else falls back to the category icon. We never guess a domain from an
 * arbitrary name, so nothing the user types is sent to the logo service unless it's a known
 * brand or a domain they entered.
 */

/** Normalised brand name → website domain. Keys are lowercase letters and digits only. */
const BRAND_DOMAINS: Record<string, string> = {
  // Video
  netflix: 'netflix.com',
  youtube: 'youtube.com',
  disneyplus: 'disneyplus.com',
  disney: 'disneyplus.com',
  hbo: 'max.com',
  hbomax: 'max.com',
  max: 'max.com',
  prime: 'primevideo.com',
  primevideo: 'primevideo.com',
  amazonprime: 'amazon.com',
  amazon: 'amazon.com',
  apple: 'apple.com',
  appletv: 'tv.apple.com',
  hulu: 'hulu.com',
  paramount: 'paramountplus.com',
  paramountplus: 'paramountplus.com',
  peacock: 'peacocktv.com',
  crunchyroll: 'crunchyroll.com',
  dazn: 'dazn.com',
  twitch: 'twitch.tv',
  // Music and audio
  spotify: 'spotify.com',
  applemusic: 'music.apple.com',
  deezer: 'deezer.com',
  tidal: 'tidal.com',
  audible: 'audible.com',
  // AI
  claude: 'claude.ai',
  anthropic: 'anthropic.com',
  chatgpt: 'openai.com',
  openai: 'openai.com',
  perplexity: 'perplexity.ai',
  midjourney: 'midjourney.com',
  cursor: 'cursor.com',
  // Software and productivity
  github: 'github.com',
  notion: 'notion.so',
  figma: 'figma.com',
  canva: 'canva.com',
  adobe: 'adobe.com',
  microsoft365: 'microsoft.com',
  office365: 'microsoft.com',
  slack: 'slack.com',
  zoom: 'zoom.us',
  '1password': '1password.com',
  onepassword: '1password.com',
  nordvpn: 'nordvpn.com',
  expressvpn: 'expressvpn.com',
  proton: 'proton.me',
  linkedin: 'linkedin.com',
  // Cloud
  icloud: 'icloud.com',
  googleone: 'one.google.com',
  dropbox: 'dropbox.com',
  // Gaming
  xbox: 'xbox.com',
  playstation: 'playstation.com',
  psplus: 'playstation.com',
  nintendo: 'nintendo.com',
  steam: 'steampowered.com',
  // News, learning, fitness
  nytimes: 'nytimes.com',
  newyorktimes: 'nytimes.com',
  medium: 'medium.com',
  duolingo: 'duolingo.com',
  strava: 'strava.com',
  headspace: 'headspace.com',
  calm: 'calm.com',
  patreon: 'patreon.com',
  discord: 'discord.com',
};

/** Lowercase words with accents removed; "+" reads as "plus" (Disney+ → disney plus). */
function words(name: string | null | undefined): string[] {
  return (name ?? '')
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .replace(/\+/g, ' plus ')
    .split(/[^a-z0-9]+/)
    .filter(Boolean);
}

export function normalizeBrandName(name: string | null | undefined): string {
  return words(name).join('');
}

const DOMAIN_PATTERN = /^[a-z0-9-]+(\.[a-z0-9-]+)+$/;

/** The host if the name is already a domain or URL, e.g. "figma.com" or "https://x.org/a". */
function domainFromName(name: string): string | null {
  const host = name
    .trim()
    .toLowerCase()
    .replace(/^[a-z]+:\/\//, '')
    .replace(/^www\./, '')
    .split(/[/?#]/)[0];
  return DOMAIN_PATTERN.test(host) ? host : null;
}

/**
 * The website domain for a subscription name, or null if we don't recognise it. Tries the
 * whole name, then shorter runs of leading words, so "Netflix Premium" → netflix.com but
 * "Maximum gym" doesn't match "max".
 */
export function logoDomainFor(name: string | null | undefined): string | null {
  if (!name?.trim()) return null;

  const asDomain = domainFromName(name);
  if (asDomain) return asDomain;

  const parts = words(name);
  for (let count = parts.length; count > 0; count--) {
    const domain = BRAND_DOMAINS[parts.slice(0, count).join('')];
    if (domain) return domain;
  }
  return null;
}

/** A 128 px logo URL for the subscription, or null to use the category icon instead. */
export function logoUrlFor(name: string | null | undefined): string | null {
  const domain = logoDomainFor(name);
  return domain ? `https://www.google.com/s2/favicons?domain=${domain}&sz=128` : null;
}
