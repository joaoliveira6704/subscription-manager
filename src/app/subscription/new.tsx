import { useRouter } from 'expo-router';

import { SubscriptionForm } from '@/components/subscription-form';
import { useTranslation } from '@/context/language-context';
import { useSubscriptions } from '@/context/subscriptions-context';

export default function NewSubscriptionScreen() {
  const router = useRouter();
  const { t } = useTranslation();
  const { add } = useSubscriptions();

  return (
    <SubscriptionForm
      title={t('subscriptionForm.newTitle')}
      submitLabel={t('subscriptions.add')}
      onSubmit={add}
      onClose={() => router.back()}
    />
  );
}
