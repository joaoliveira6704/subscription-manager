import * as Haptics from 'expo-haptics';

import type { AlertButton } from '@/context/alert-context';
import type { TranslationKey, TranslateParams } from '@/lib/i18n';

type ConfirmDeleteOptions = {
  /** From `useAlert()`, so Android shows the same dialog as iOS. */
  alert: (title: string, message?: string, buttons?: AlertButton[]) => void;
  name: string;
  t: (key: TranslationKey, params?: TranslateParams) => string;
  tm: (message: string) => string;
  remove: () => Promise<{ error: string | null }>;
  /** Called after the subscription was deleted, e.g. to close the edit screen. */
  onDeleted?: () => void;
};

/** Asks before deleting a subscription (warning haptic + destructive alert), then deletes it. */
export function confirmDeleteSubscription({
  alert,
  name,
  t,
  tm,
  remove,
  onDeleted,
}: ConfirmDeleteOptions) {
  Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
  alert(t('subscriptionForm.deleteTitle', { name }), t('subscriptionForm.deleteMessage'), [
    { text: t('profile.cancel'), style: 'cancel' },
    {
      text: t('subscriptionForm.deleteConfirm'),
      style: 'destructive',
      onPress: async () => {
        const result = await remove();
        if (result.error) {
          alert(tm(result.error));
          return;
        }
        onDeleted?.();
      },
    },
  ]);
}
