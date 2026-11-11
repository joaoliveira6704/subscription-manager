import { StyleSheet, View } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { Spacing } from '@/constants/theme';
import { useTranslation } from '@/context/language-context';
import { useTheme } from '@/hooks/use-theme';
import type { Category } from '@/lib/categories';

/** A small pill with the category name, shown next to a subscription's name. */
export function CategoryTag({ category }: { category: Category }) {
  const theme = useTheme();
  const { t } = useTranslation();

  return (
    <View style={[styles.tag, { backgroundColor: theme.backgroundSelected }]}>
      <ThemedText themeColor="textSecondary" style={styles.label} numberOfLines={1}>
        {t(`category.${category}`)}
      </ThemedText>
    </View>
  );
}

const styles = StyleSheet.create({
  tag: {
    borderRadius: Spacing.two,
    paddingHorizontal: Spacing.two,
    paddingVertical: Spacing.half,
  },
  label: {
    fontSize: 11,
    lineHeight: 14,
    fontWeight: 600,
  },
});
