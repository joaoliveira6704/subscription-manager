import { CATEGORIES, categoriesInUse, isCategory } from '@/lib/categories';

describe('isCategory', () => {
  it('accepts known categories only, case sensitive', () => {
    expect(isCategory('music')).toBe(true);
    expect(isCategory('Music')).toBe(false);
    expect(isCategory('food')).toBe(false);
    expect(isCategory('')).toBe(false);
    expect(isCategory(null)).toBe(false);
  });
});

describe('categoriesInUse', () => {
  it('lists each used category once, in the fixed category order', () => {
    expect(
      categoriesInUse([
        { category: 'other' },
        { category: 'music' },
        { category: 'streaming' },
        { category: 'music' },
      ])
    ).toEqual(['streaming', 'music', 'other']);
  });

  it('returns an empty list when there are no subscriptions', () => {
    expect(categoriesInUse([])).toEqual([]);
  });

  it('can list every category', () => {
    expect(categoriesInUse(CATEGORIES.map((category) => ({ category })))).toEqual([...CATEGORIES]);
  });
});
