import * as Haptics from 'expo-haptics';
import { useRouter } from 'expo-router';
import { useRef, useState } from 'react';
import { type TextInputInstance } from 'react-native';

import { EditSheet } from '@/components/edit-sheet';
import { Button } from '@/components/ui/button';
import { PasswordField } from '@/components/ui/password-field';
import { useAuth } from '@/context/auth-context';
import { useTranslation } from '@/context/language-context';
import {
  MIN_PASSWORD_LENGTH,
  validateNewPassword,
  validatePasswordConfirmation,
} from '@/lib/validation';

type FieldErrors = { current?: string; password?: string; confirm?: string };

export default function ChangePasswordScreen() {
  const { changePassword } = useAuth();
  const router = useRouter();
  const { t, tm } = useTranslation();
  const passwordRef = useRef<TextInputInstance>(null);
  const confirmRef = useRef<TextInputInstance>(null);

  const [current, setCurrent] = useState('');
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  async function handleSave() {
    const errors: FieldErrors = {
      current: current ? undefined : t('errors.enterCurrentPassword'),
      password: validateNewPassword(password) ?? undefined,
      confirm: validatePasswordConfirmation(password, confirm) ?? undefined,
    };
    setFieldErrors(errors);
    setFormError(null);
    if (errors.current || errors.password || errors.confirm) return;

    setSubmitting(true);
    const result = await changePassword(current, password);
    setSubmitting(false);

    if (result.error) {
      setFormError(result.error);
      return;
    }
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    router.back();
  }

  return (
    <EditSheet title={t('changePassword.title')} error={formError && tm(formError)}>
      <PasswordField
        label={t('form.currentPassword')}
        value={current}
        onChangeText={setCurrent}
        error={fieldErrors.current}
        autoComplete="current-password"
        textContentType="password"
        returnKeyType="next"
        onSubmitEditing={() => passwordRef.current?.focus()}
        submitBehavior="submit"
        autoFocus
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
        autoComplete="new-password"
        textContentType="newPassword"
        returnKeyType="done"
        onSubmitEditing={handleSave}
      />
      <Button title={t('changePassword.submit')} onPress={handleSave} loading={submitting} />
    </EditSheet>
  );
}
