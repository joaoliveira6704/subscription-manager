import * as Haptics from 'expo-haptics';
import { SymbolView, type SymbolViewProps } from 'expo-symbols';
import { Pressable, ScrollView, StyleSheet, View } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

type ChipGroupProps<T extends string> = {
  options: readonly { value: T; label: string; icon?: SymbolViewProps['name'] }[];
  value: T;
  onChange: (value: T) => void;
  accessibilityLabel?: string;
  /** One horizontally scrolling row instead of wrapping lines (e.g. a filter bar). */
  scrollable?: boolean;
  /**
   * For scrollable rows: the parent's horizontal padding. The row then scrolls edge to edge
   * across the full screen width while the first chip still lines up with the content.
   */
  edgeInset?: number;
};

/** Wrapping single-choice chips, e.g. categories. The selected chip is inverted. */
export function ChipGroup<T extends string>({
  options,
  value,
  onChange,
  accessibilityLabel,
  scrollable = false,
  edgeInset = 0,
}: ChipGroupProps<T>) {
  const theme = useTheme();

  const chips = (
    <View
      accessibilityRole="radiogroup"
      accessibilityLabel={accessibilityLabel}
      style={scrollable ? styles.row : styles.wrap}>
      {options.map((option) => {
        const selected = option.value === value;
        const color = selected ? theme.background : theme.text;
        return (
          <Pressable
            key={option.value}
            accessibilityRole="radio"
            accessibilityState={{ selected, checked: selected }}
            accessibilityLabel={option.label}
            onPress={() => {
              if (selected) return;
              Haptics.selectionAsync();
              onChange(option.value);
            }}
            style={({ pressed }) => [
              styles.chip,
              { backgroundColor: selected ? theme.text : theme.backgroundElement },
              pressed && styles.pressed,
            ]}>
            {option.icon ? <SymbolView name={option.icon} size={16} tintColor={color} /> : null}
            <ThemedText type="small" style={{ color }}>
              {option.label}
            </ThemedText>
          </Pressable>
        );
      })}
    </View>
  );

  if (!scrollable) return chips;
  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      style={{ marginHorizontal: -edgeInset }}
      contentContainerStyle={{ paddingHorizontal: edgeInset }}>
      {chips}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  wrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.two,
  },
  row: {
    flexDirection: 'row',
    gap: Spacing.two,
  },
  chip: {
    minHeight: 44,
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.one,
    paddingHorizontal: Spacing.three,
    borderRadius: 22,
  },
  pressed: {
    opacity: 0.7,
  },
});
