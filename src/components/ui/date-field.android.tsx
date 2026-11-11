import { DatePickerDialog, Host } from '@expo/ui/jetpack-compose';
import { useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { ERROR_COLOR } from '@/components/ui/text-field';
import { Spacing } from '@/constants/theme';
import { useTranslation } from '@/context/language-context';
import { useTheme } from '@/hooks/use-theme';
import { isoToLocalDate, localDateToISO } from '@/lib/billing';

import type { DateFieldProps } from './date-field';

/** Android: a field showing the date that opens the Material 3 date picker dialog. */
export function DateField({ label, value, onChange, error }: DateFieldProps) {
  const theme = useTheme();
  const { locale, t } = useTranslation();
  const [open, setOpen] = useState(false);
  const date = isoToLocalDate(value);
  const display = date
    ? new Intl.DateTimeFormat(locale, { day: 'numeric', month: 'short', year: 'numeric' }).format(date)
    : '';

  return (
    <View style={styles.container}>
      <Pressable
        onPress={() => setOpen(true)}
        accessibilityRole="button"
        accessibilityLabel={`${label}, ${display}`}
        style={({ pressed }) => [
          styles.row,
          { backgroundColor: theme.backgroundElement },
          pressed && styles.pressed,
        ]}>
        <ThemedText>{label}</ThemedText>
        <ThemedText type="smallBold">{display}</ThemedText>
      </Pressable>
      {error ? (
        <ThemedText type="small" style={{ color: ERROR_COLOR }}>
          {error}
        </ThemedText>
      ) : null}
      {open ? (
        <Host matchContents>
          <DatePickerDialog
            // The dialog expects a UTC midnight timestamp for the chosen calendar day.
            initialDate={value ? `${value}T00:00:00.000Z` : null}
            showVariantToggle={false}
            confirmButtonLabel={t('form.ok')}
            dismissButtonLabel={t('profile.cancel')}
            onDateSelected={(picked) => {
              setOpen(false);
              // Material returns UTC midnight of the picked day; read it back in UTC.
              onChange(
                localDateToISO(new Date(picked.getUTCFullYear(), picked.getUTCMonth(), picked.getUTCDate()))
              );
            }}
            onDismissRequest={() => setOpen(false)}
          />
        </Host>
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
  pressed: {
    opacity: 0.7,
  },
});
