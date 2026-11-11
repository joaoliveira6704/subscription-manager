import { useLocalSearchParams, useRouter } from 'expo-router';
import { StyleSheet, View } from 'react-native';

import { confirmDeleteSubscription } from '@/components/confirm-delete-subscription';
import { SubscriptionForm } from '@/components/subscription-form';
import { ThemedText } from '@/components/themed-text';
import { Button } from '@/components/ui/button';
import { Spacing } from '@/constants/theme';
import { useAlert } from '@/context/alert-context';
import { useTranslation } from '@/context/language-context';
import { useSubscriptions } from '@/context/subscriptions-context';

export default function EditSubscriptionScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const { t, tm } = useTranslation();
  const alert = useAlert();
  const { subscriptions, update, remove } = useSubscriptions();
  const subscription = subscriptions.find((item) => item.id === Number(id));

  if (!subscription) {
    return (
      <View style={styles.missing}>
        <ThemedText themeColor="textSecondary">{t('subscriptionForm.notFound')}</ThemedText>
        <Button title={t('form.close')} variant="secondary" onPress={() => router.back()} />
      </View>
    );
  }

  function confirmDelete() {
    if (!subscription) return;
    confirmDeleteSubscription({
      alert,
      name: subscription.name,
      t,
      tm,
      remove: () => remove(subscription.id),
      // Close the details sheet underneath too, since the subscription is gone.
      onDeleted: () => router.dismissAll(),
    });
  }

  return (
    <SubscriptionForm
      title={t('subscriptionForm.editTitle')}
      submitLabel={t('form.save')}
      initial={subscription}
      onSubmit={(input) => update(subscription.id, input)}
      onClose={() => router.back()}
      onDelete={confirmDelete}
    />
  );
}

const styles = StyleSheet.create({
  missing: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.four,
    padding: Spacing.four,
  },
});
