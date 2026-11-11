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
      title="Reset password"
      subtitle="Enter your account email and choose a new password."
      error={formError}>
      <View style={styles.fields}>
        <TextField
          label="Email"
          value={email}
          onChangeText={setEmail}
          error={fieldErrors.email}
          placeholder="you@example.com"
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
          label="New password"
          value={password}
          onChangeText={setPassword}
          error={fieldErrors.password}
          placeholder={`At least ${MIN_PASSWORD_LENGTH} characters`}
          autoComplete="new-password"
          textContentType="newPassword"
          returnKeyType="next"
          onSubmitEditing={() => confirmRef.current?.focus()}
          submitBehavior="submit"
        />
        <PasswordField
          ref={confirmRef}
          label="Confirm new password"
          value={confirm}
          onChangeText={setConfirm}
          error={fieldErrors.confirm}
          placeholder="Repeat your new password"
          autoComplete="new-password"
          textContentType="newPassword"
          returnKeyType="go"
          onSubmitEditing={handleSubmit}
        />
      </View>

      <Button title="Update password" loading={submitting} onPress={handleSubmit} />

      <View style={styles.footer}>
        <Link href="/login" dismissTo>
          <ThemedText type="linkPrimary">Back to sign in</ThemedText>
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
