import * as Haptics from 'expo-haptics';
import { useRouter } from 'expo-router';
import { useRef, useState } from 'react';
import { type TextInputInstance } from 'react-native';

import { EditSheet } from '@/components/edit-sheet';
import { Button } from '@/components/ui/button';
import { PasswordField } from '@/components/ui/password-field';
import { TextField } from '@/components/ui/text-field';
import { useAuth } from '@/context/auth-context';
import { useTranslation } from '@/context/language-context';
import { validateEmail } from '@/lib/validation';

type FieldErrors = { email?: string; password?: string };

export default function EditEmailScreen() {
  const { user, updateEmail } = useAuth();
  const router = useRouter();
  const { t, tm } = useTranslation();
  const passwordRef = useRef<TextInputInstance>(null);

  const [email, setEmail] = useState(user?.email ?? '');
  const [password, setPassword] = useState('');
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  async function handleSave() {
    const errors: FieldErrors = {
      email: validateEmail(email) ?? undefined,
      password: password ? undefined : t('errors.enterCurrentPassword'),
    };
    setFieldErrors(errors);
    setFormError(null);
    if (errors.email || errors.password) return;

    setSubmitting(true);
    const result = await updateEmail(email, password);
    setSubmitting(false);

    if (result.error) {
      setFormError(result.error);
      return;
    }
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    router.back();
  }

  return (
    <EditSheet
      title={t('editEmail.title')}
      subtitle={t('editEmail.subtitle')}
      error={formError && tm(formError)}>
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
        autoFocus
      />
      <PasswordField
        ref={passwordRef}
        label={t('form.currentPassword')}
        value={password}
        onChangeText={setPassword}
        error={fieldErrors.password}
        autoComplete="current-password"
        textContentType="password"
        returnKeyType="done"
        onSubmitEditing={handleSave}
      />
      <Button title={t('form.save')} onPress={handleSave} loading={submitting} />
    </EditSheet>
  );
}
