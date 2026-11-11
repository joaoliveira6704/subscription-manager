import { Link } from 'expo-router';
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
  validateName,
  validateNewPassword,
  validatePasswordConfirmation,
} from '@/lib/validation';

type FieldErrors = { name?: string; email?: string; password?: string; confirm?: string };

export default function SignUpScreen() {
  const { signUp } = useAuth();
  const emailRef = useRef<TextInputInstance>(null);
  const passwordRef = useRef<TextInputInstance>(null);
  const confirmRef = useRef<TextInputInstance>(null);

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit() {
    const errors: FieldErrors = {
      name: validateName(name) ?? undefined,
      email: validateEmail(email) ?? undefined,
      password: validateNewPassword(password) ?? undefined,
      confirm: validatePasswordConfirmation(password, confirm) ?? undefined,
    };
    setFieldErrors(errors);
    setFormError(null);
    if (errors.name || errors.email || errors.password || errors.confirm) return;

    setSubmitting(true);
    const { error } = await signUp(name, email, password);
    setSubmitting(false);
    // On success the auth guard swaps this stack for the tabs automatically.
    if (error) setFormError(error);
  }

  return (
    <AuthScreen
      title="Create account"
      subtitle="Start tracking your subscriptions."
      error={formError}>
      <View style={styles.fields}>
        <TextField
          label="Name"
          value={name}
          onChangeText={setName}
          error={fieldErrors.name}
          placeholder="Your name"
          autoCapitalize="words"
          autoComplete="name"
          textContentType="name"
          returnKeyType="next"
          onSubmitEditing={() => emailRef.current?.focus()}
          submitBehavior="submit"
        />
        <TextField
          ref={emailRef}
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
          label="Password"
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
          label="Confirm password"
          value={confirm}
          onChangeText={setConfirm}
          error={fieldErrors.confirm}
          placeholder="Repeat your password"
          autoComplete="new-password"
          textContentType="newPassword"
          returnKeyType="go"
          onSubmitEditing={handleSubmit}
        />
      </View>

      <Button title="Create account" loading={submitting} onPress={handleSubmit} />

      <View style={styles.footer}>
        <ThemedText type="small" themeColor="textSecondary">
          Already have an account?
        </ThemedText>
        <Link href="/login" dismissTo>
          <ThemedText type="linkPrimary">Sign in</ThemedText>
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
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: Spacing.one,
  },
});
