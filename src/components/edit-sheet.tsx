import type { PropsWithChildren } from 'react';
import { StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { ThemedText } from '@/components/themed-text';
import { ERROR_COLOR } from '@/components/ui/text-field';
import { Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

type EditSheetProps = PropsWithChildren<{
  title: string;
  subtitle?: string;
  /** Form-level error, e.g. "Current password is incorrect". */
  error?: string | null;
}>;

/**
 * Shared layout for the profile edit sheets (name, email, password).
 * No `flex: 1` here: the sheet uses `fitToContents`, and on iOS a flex child inside a form
 * sheet has no height to fill, so it collapsed to an empty sheet.
 */
export function EditSheet({ title, subtitle, error, children }: EditSheetProps) {
  const theme = useTheme();
  const insets = useSafeAreaInsets();

  return (
    <View
      style={[
        styles.content,
        { backgroundColor: theme.backgroundSheet, paddingBottom: insets.bottom + Spacing.four },
      ]}>
      <View style={styles.header}>
        <ThemedText type="subtitle">{title}</ThemedText>
        {subtitle ? <ThemedText themeColor="textSecondary">{subtitle}</ThemedText> : null}
      </View>

      {error ? (
        <View style={[styles.banner, { backgroundColor: theme.backgroundElement }]}>
          <ThemedText type="small" style={{ color: ERROR_COLOR }}>
            {error}
          </ThemedText>
        </View>
      ) : null}

      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  content: {
    gap: Spacing.four,
    paddingHorizontal: Spacing.four,
    paddingTop: Spacing.five,
  },
  header: {
    gap: Spacing.two,
  },
  banner: {
    borderRadius: Spacing.three,
    padding: Spacing.three,
  },
});
