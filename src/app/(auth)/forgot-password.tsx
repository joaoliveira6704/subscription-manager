import { Link, useRouter } from 'expo-router';
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
import {
  MIN_PASSWORD_LENGTH,
  validateEmail,
  validateNewPassword,
  validatePasswordConfirmation,
} from '@/lib/validation';

type FieldErrors = { email?: string; password?: string; confirm?: string };

/**
 * Accounts live only in the on-device SQLite database and there is no email server,
 * so the reset happens directly on the device. Replace with an emailed reset link
 * if a backend is added.
 */
export default function ForgotPasswordScreen() {
  const { resetPassword } = useAuth();
  const { t, tm } = useTranslation();
  const router = useRouter();
  const passwordRef = useRef<TextInputInstance>(null);
  const confirmRef = useRef<TextInputInstance>(null);

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit() {
    const errors: FieldErrors = {
      email: validateEmail(email) ?? undefined,
      password: validateNewPassword(password) ?? undefined,
      confirm: validatePasswordConfirmation(password, confirm) ?? undefined,
    };
    setFieldErrors(errors);
    setFormError(null);
    if (errors.email || errors.password || errors.confirm) return;

    setSubmitting(true);
    const { error } = await resetPassword(email, password);
    setSubmitting(false);

    if (error) {
      setFormError(error);
      return;
    }
    router.dismissTo({ pathname: '/login', params: { reset: '1' } });
  }

  return (
    <AuthScreen
      title={t('forgotPassword.title')}
      subtitle={t('forgotPassword.subtitle')}
      error={formError && tm(formError)}>
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
          label={t('form.newPassword')}
          value={password}
          onChangeText={setPassword}
          error={fieldErrors.password && tm(fieldErrors.password)}
          placeholder={t('form.newPasswordPlaceholder', { min: MIN_PASSWORD_LENGTH })}
          autoComplete="new-password"
          textContentType="newPassword"
          returnKeyType="next"
          onSubmitEditing={() => confirmRef.current?.focus()}
          submitBehavior="submit"
        />
        <PasswordField
          ref={confirmRef}
          label={t('form.confirmNewPassword')}
          value={confirm}
          onChangeText={setConfirm}
          error={fieldErrors.confirm && tm(fieldErrors.confirm)}
          placeholder={t('form.confirmNewPasswordPlaceholder')}
          autoComplete="new-password"
          textContentType="newPassword"
          returnKeyType="go"
          onSubmitEditing={handleSubmit}
        />
      </View>

      <Button title={t('forgotPassword.submit')} loading={submitting} onPress={handleSubmit} />

      <View style={styles.footer}>
        <Link href="/login" dismissTo>
          <ThemedText type="linkPrimary">{t('forgotPassword.backToSignIn')}</ThemedText>
        </Link>
      </View>
    </AuthScreen>
  );
}

const styles = StyleSheet.create({
  fields: {
    gap: Spacing.three,
  },
  footer: {
    alignItems: 'center',
  },
});
