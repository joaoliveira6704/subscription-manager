import type { AndroidSymbol, SFSymbol } from 'expo-symbols';

export const CATEGORIES = [
  'streaming',
  'music',
  'software',
  'gaming',
  'news',
  'fitness',
  'cloud',
  'other',
] as const;
export type Category = (typeof CATEGORIES)[number];
export const DEFAULT_CATEGORY: Category = 'other';

export function isCategory(value: unknown): value is Category {
  return typeof value === 'string' && (CATEGORIES as readonly string[]).includes(value);
}

export const CATEGORY_ICONS: Record<Category, { ios: SFSymbol; android: AndroidSymbol }> = {
  streaming: { ios: 'play.tv', android: 'live_tv' },
  music: { ios: 'music.note', android: 'music_note' },
  software: { ios: 'app.badge', android: 'apps' },
  gaming: { ios: 'gamecontroller', android: 'sports_esports' },
  news: { ios: 'newspaper', android: 'newspaper' },
  fitness: { ios: 'figure.run', android: 'fitness_center' },
  cloud: { ios: 'icloud', android: 'cloud' },
  other: { ios: 'square.grid.2x2', android: 'category' },
};

/** The categories that appear in `items`, each once, in the fixed CATEGORIES order. */
export function categoriesInUse(items: readonly { category: Category }[]): Category[] {
  const used = new Set(items.map((item) => item.category));
  return CATEGORIES.filter((category) => used.has(category));
}
