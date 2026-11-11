import { SymbolView } from 'expo-symbols';
import { forwardRef, useState } from 'react';
import { Pressable, StyleSheet, type TextInputInstance } from 'react-native';

import { TextField, type TextFieldProps } from '@/components/ui/text-field';
import { Spacing } from '@/constants/theme';
import { useTranslation } from '@/context/language-context';
import { useTheme } from '@/hooks/use-theme';

export type PasswordFieldProps = Omit<TextFieldProps, 'secureTextEntry' | 'accessory'>;

export const PasswordField = forwardRef<TextInputInstance, PasswordFieldProps>(function PasswordField(
  props,
  ref
) {
  const theme = useTheme();
  const { t } = useTranslation();
  const [visible, setVisible] = useState(false);

  return (
    <TextField
      ref={ref}
      autoCapitalize="none"
      autoCorrect={false}
      {...props}
      secureTextEntry={!visible}
      accessory={
        <Pressable
          onPress={() => setVisible((v) => !v)}
          hitSlop={Spacing.two}
          accessibilityRole="button"
          accessibilityLabel={visible ? t('form.hidePassword') : t('form.showPassword')}
          style={({ pressed }) => [styles.toggle, pressed && styles.pressed]}>
          <SymbolView
            tintColor={theme.textSecondary}
            size={20}
            name={
              visible
                ? { ios: 'eye.slash', android: 'visibility_off', web: 'visibility_off' }
                : { ios: 'eye', android: 'visibility', web: 'visibility' }
            }
          />
        </Pressable>
      }
    />
  );
});

const styles = StyleSheet.create({
  toggle: {
    paddingLeft: Spacing.two,
  },
  pressed: {
    opacity: 0.6,
  },
});
