import { Link, useLocalSearchParams } from 'expo-router';
import { useRef, useState } from 'react';
import { StyleSheet, View, type TextInputInstance } from 'react-native';

import { AuthScreen } from '@/components/auth-screen';
import { ThemedText } from '@/components/themed-text';
import { Button } from '@/components/ui/button';
import { PasswordField } from '@/components/ui/password-field';
import { TextField } from '@/components/ui/text-field';
import { Spacing } from '@/constants/theme';
import { useAuth } from '@/context/auth-context';
import { useTranslation } from '@/context/language-context';
import { validateEmail } from '@/lib/validation';

export default function LoginScreen() {
  const { signIn } = useAuth();
  const { t, tm } = useTranslation();
  const { reset } = useLocalSearchParams<{ reset?: string }>();
  const passwordRef = useRef<TextInputInstance>(null);

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fieldErrors, setFieldErrors] = useState<{ email?: string; password?: string }>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit() {
    const errors = {
      email: validateEmail(email) ?? undefined,
      password: password ? undefined : t('errors.passwordRequired'),
    };
    setFieldErrors(errors);
    setFormError(null);
    if (errors.email || errors.password) return;

    setSubmitting(true);
    const { error } = await signIn(email, password);
    setSubmitting(false);
    if (error) setFormError(error);
  }

  return (
    <AuthScreen
      title={t('login.title')}
      subtitle={t('login.subtitle')}
      error={formError && tm(formError)}
      notice={reset ? t('login.passwordUpdated') : null}>
      <View style={styles.fields}>
        <TextField
          label={t('form.email')}
          value={email}
          onChangeText={setEmail}
          error={fieldErrors.email && tm(fieldErrors.email)}
          placeholder={t('form.emailPlaceholder')}
          autoCapitalize="none"
          autoComplete="email"
          autoCorrect={false}
          keyboardType="email-address"
          textContentType="emailAddress"
          returnKeyType="next"
          onSubmitEditing={() => passwordRef.current?.focus()}
          submitBehavior="submit"
        />
        <PasswordField
          ref={passwordRef}
          label={t('form.password')}
          value={password}
          onChangeText={setPassword}
          error={fieldErrors.password}
          placeholder={t('form.passwordPlaceholder')}
          autoComplete="current-password"
          textContentType="password"
          returnKeyType="go"
          onSubmitEditing={handleSubmit}
        />
        <Link href="/forgot-password" style={styles.forgot}>
          <ThemedText type="linkPrimary">{t('login.forgotPassword')}</ThemedText>
        </Link>
      </View>

      <Button title={t('login.submit')} loading={submitting} onPress={handleSubmit} />

      <View style={styles.footer}>
        <ThemedText type="small" themeColor="textSecondary">
          {t('login.noAccount')}
        </ThemedText>
        <Link href="/sign-up">
          <ThemedText type="linkPrimary">{t('login.createAccount')}</ThemedText>
        </Link>
      </View>
    </AuthScreen>
  );
}

const styles = StyleSheet.create({
  fields: {
    gap: Spacing.three,
  },
  forgot: {
    alignSelf: 'flex-end',
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: Spacing.one,
  },
});
