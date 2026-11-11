import type { PropsWithChildren } from 'react';
import { KeyboardAvoidingView, Platform, ScrollView, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { ThemedText } from '@/components/themed-text';
import { ERROR_COLOR } from '@/components/ui/text-field';
import { MaxContentWidth, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

type AuthScreenProps = PropsWithChildren<{
  title: string;
  subtitle?: string;
  /** Form-level error, e.g. "Invalid email or password". */
  error?: string | null;
  /** Form-level success message. */
  notice?: string | null;
}>;

/** Shared layout for the login, sign-up and forgot-password screens. */
export function AuthScreen({ title, subtitle, error, notice, children }: AuthScreenProps) {
  const theme = useTheme();
  const insets = useSafeAreaInsets();

  return (
    <KeyboardAvoidingView
      style={[styles.flex, { backgroundColor: theme.background }]}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <ScrollView
        style={styles.flex}
        keyboardShouldPersistTaps="handled"
        contentContainerStyle={[
          styles.content,
          {
            paddingTop: insets.top + Spacing.six,
            paddingBottom: insets.bottom + Spacing.four,
          },
        ]}>
        <View style={styles.inner}>
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

          {notice ? (
            <View style={[styles.banner, { backgroundColor: theme.backgroundElement }]}>
              <ThemedText type="small">{notice}</ThemedText>
            </View>
          ) : null}

          {children}
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  flex: {
    flex: 1,
  },
  content: {
    flexGrow: 1,
    alignItems: 'center',
    paddingHorizontal: Spacing.four,
  },
  inner: {
    width: '100%',
    maxWidth: MaxContentWidth / 2,
    gap: Spacing.four,
  },
  header: {
    gap: Spacing.two,
  },
  banner: {
    borderRadius: Spacing.three,
    padding: Spacing.three,
  },
});
