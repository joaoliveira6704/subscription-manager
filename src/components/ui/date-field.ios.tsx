import { DatePicker, Host } from '@expo/ui/swift-ui';
import { datePickerStyle, labelsHidden } from '@expo/ui/swift-ui/modifiers';
import { StyleSheet, View, useColorScheme } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { ERROR_COLOR } from '@/components/ui/text-field';
import { Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { isoToLocalDate, localDateToISO } from '@/lib/billing';

import type { DateFieldProps } from './date-field';

/** iOS: the native compact date picker (a pill that opens a calendar). */
export function DateField({ label, value, onChange, error }: DateFieldProps) {
  const theme = useTheme();
  const scheme = useColorScheme() === 'dark' ? 'dark' : 'light';
  const selection = isoToLocalDate(value) ?? new Date();

  return (
    <View style={styles.container}>
      <View style={[styles.row, { backgroundColor: theme.backgroundElement }]}>
        <ThemedText>{label}</ThemedText>
        <Host matchContents colorScheme={scheme} alignment="trailing">
          <DatePicker
            selection={selection}
            displayedComponents={['date']}
            onDateChange={(date) => onChange(localDateToISO(date))}
            modifiers={[datePickerStyle('compact'), labelsHidden()]}
          />
        </Host>
      </View>
      {error ? (
        <ThemedText type="small" style={{ color: ERROR_COLOR }}>
          {error}
        </ThemedText>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: Spacing.two,
  },
  row: {
    minHeight: 52,
    borderRadius: Spacing.three,
    paddingHorizontal: Spacing.three,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
});
