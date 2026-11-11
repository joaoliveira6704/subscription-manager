import { forwardRef, type ReactNode } from 'react';
import { StyleSheet, TextInput, View, type TextInputInstance, type TextInputProps } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

export const ERROR_COLOR = '#E5484D';

export type TextFieldProps = TextInputProps & {
  label: string;
  error?: string | null;
  /** Element rendered at the right edge of the input, e.g. an icon button. */
  accessory?: ReactNode;
};

export const TextField = forwardRef<TextInputInstance, TextFieldProps>(function TextField(
  { label, error, accessory, style, ...inputProps },
  ref
) {
  const theme = useTheme();

  return (
    <View style={styles.container}>
      <ThemedText type="smallBold">{label}</ThemedText>
      <View
        style={[
          styles.inputRow,
          { backgroundColor: theme.backgroundElement },
          error ? { borderColor: ERROR_COLOR } : null,
        ]}>
        <TextInput
          ref={ref}
          placeholderTextColor={theme.textSecondary}
          style={[styles.input, { color: theme.text }, style]}
          {...inputProps}
        />
        {accessory}
      </View>
      {error ? (
        <ThemedText type="small" style={{ color: ERROR_COLOR }}>
          {error}
        </ThemedText>
      ) : null}
    </View>
  );
});

const styles = StyleSheet.create({
  container: {
    gap: Spacing.two,
  },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: Spacing.three,
    borderWidth: 1,
    borderColor: 'transparent',
    paddingHorizontal: Spacing.three,
  },
  input: {
    flex: 1,
    fontSize: 16,
    paddingVertical: Spacing.three,
  },
});
