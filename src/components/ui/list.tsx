import { SymbolView, type SymbolViewProps } from 'expo-symbols';
import { Children, Fragment, type PropsWithChildren, type ReactNode } from 'react';
import { Pressable, StyleSheet, View, type AccessibilityRole } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

type ListSectionProps = PropsWithChildren<{ title?: string }>;

/** A small sentence-case header above a rounded card of rows. */
export function ListSection({ title, children }: ListSectionProps) {
  const theme = useTheme();
  const rows = Children.toArray(children);

  return (
    <View style={styles.section}>
      {title ? (
        <ThemedText type="small" themeColor="textSecondary" style={styles.sectionTitle}>
          {title}
        </ThemedText>
      ) : null}
      <ThemedView type="backgroundElement" style={styles.card}>
        {rows.map((row, index) => (
          <Fragment key={index}>
            {index > 0 ? (
              <View style={[styles.separator, { backgroundColor: theme.backgroundSelected }]} />
            ) : null}
            {row}
          </Fragment>
        ))}
      </ThemedView>
    </View>
  );
}

type ListRowProps = {
  icon: SymbolViewProps['name'];
  title: string;
  subtitle?: string;
  /** Short value shown at the end of the row, e.g. the current theme. */
  value?: string;
  /** Replaces the chevron, e.g. a checkmark for the selected option. */
  trailing?: ReactNode;
  onPress?: () => void;
  accessibilityRole?: AccessibilityRole;
  selected?: boolean;
};

/** Leading round icon, title and subtitle, then a trailing value and chevron when pressable. */
export function ListRow({
  icon,
  title,
  subtitle,
  value,
  trailing,
  onPress,
  accessibilityRole,
  selected,
}: ListRowProps) {
  const theme = useTheme();
  const showChevron = onPress && trailing === undefined;

  const content = (
    <>
      <View style={[styles.iconCircle, { backgroundColor: theme.backgroundSelected }]}>
        <SymbolView name={icon} size={20} tintColor={theme.text} />
      </View>
      <View style={styles.text}>
        <ThemedText>{title}</ThemedText>
        {subtitle ? (
          <ThemedText type="small" themeColor="textSecondary">
            {subtitle}
          </ThemedText>
        ) : null}
      </View>
      {value ? (
        <ThemedText type="small" themeColor="textSecondary">
          {value}
        </ThemedText>
      ) : null}
      {trailing}
      {showChevron ? (
        <SymbolView
          name={{ ios: 'chevron.right', android: 'chevron_right', web: 'chevron_right' }}
          size={16}
          tintColor={theme.textSecondary}
        />
      ) : null}
    </>
  );

  if (!onPress) {
    return (
      <View style={styles.row} accessible accessibilityLabel={[title, subtitle, value].filter(Boolean).join(', ')}>
        {content}
      </View>
    );
  }

  return (
    <Pressable
      onPress={onPress}
      accessibilityRole={accessibilityRole ?? 'button'}
      accessibilityState={selected === undefined ? undefined : { selected, checked: selected }}
      accessibilityLabel={[title, subtitle, value].filter(Boolean).join(', ')}
      style={({ pressed }) => [
        styles.row,
        pressed && { backgroundColor: theme.backgroundSelected },
      ]}>
      {content}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  section: {
    gap: Spacing.two,
  },
  sectionTitle: {
    paddingHorizontal: Spacing.two,
  },
  card: {
    borderRadius: Spacing.three,
    overflow: 'hidden',
  },
  separator: {
    height: StyleSheet.hairlineWidth,
    marginLeft: Spacing.three + 36 + Spacing.three,
  },
  row: {
    minHeight: 60,
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.three,
    paddingHorizontal: Spacing.three,
    paddingVertical: Spacing.two,
  },
  iconCircle: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  text: {
    flex: 1,
    gap: Spacing.half,
  },
});
