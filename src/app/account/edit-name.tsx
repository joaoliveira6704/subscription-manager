import * as Haptics from 'expo-haptics';
import { useRouter } from 'expo-router';
import { useState } from 'react';

import { EditSheet } from '@/components/edit-sheet';
import { Button } from '@/components/ui/button';
import { TextField } from '@/components/ui/text-field';
import { useAuth } from '@/context/auth-context';
import { useTranslation } from '@/context/language-context';
import { MAX_NAME_LENGTH, validateName } from '@/lib/validation';

export default function EditNameScreen() {
  const { user, updateName } = useAuth();
  const router = useRouter();
  const { t, tm } = useTranslation();

  const [name, setName] = useState(user?.name ?? '');
  const [fieldError, setFieldError] = useState<string | null>(null);
  const [formError, setFormError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  async function handleSave() {
    const error = validateName(name);
    setFieldError(error);
    setFormError(null);
    if (error) return;

    setSubmitting(true);
    const result = await updateName(name);
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
      title={t('editName.title')}
      subtitle={t('editName.subtitle')}
      error={formError && tm(formError)}>
      <TextField
        label={t('form.name')}
        value={name}
        onChangeText={setName}
        error={fieldError && tm(fieldError)}
        placeholder={t('form.namePlaceholder')}
        autoCapitalize="words"
        autoComplete="name"
        textContentType="name"
        maxLength={MAX_NAME_LENGTH}
        returnKeyType="done"
        onSubmitEditing={handleSave}
        autoFocus
      />
      <Button title={t('form.save')} onPress={handleSave} loading={submitting} />
    </EditSheet>
  );
}
