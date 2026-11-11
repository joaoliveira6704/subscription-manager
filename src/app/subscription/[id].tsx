import { useLocalSearchParams, useRouter } from 'expo-router';
import { SymbolView } from 'expo-symbols';
import { Pressable, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { CategoryTag } from '@/components/category-tag';
import { confirmDeleteSubscription } from '@/components/confirm-delete-subscription';
import { SubscriptionAvatar } from '@/components/subscription-avatar';
import { ThemedText } from '@/components/themed-text';
import { Button } from '@/components/ui/button';
import { ListRow, ListSection } from '@/components/ui/list';
import { Money } from '@/components/ui/money';
import { Spacing } from '@/constants/theme';
import { useAlert } from '@/context/alert-context';
import { useCurrency } from '@/context/currency-context';
import { useTranslation } from '@/context/language-context';
import { useSubscriptions } from '@/context/subscriptions-context';
import { useTheme } from '@/hooks/use-theme';
import { effectiveAmount } from '@/lib/currency-preference';
import { isoToLocalDate, nextPaymentFrom, toMonthly, todayISO } from '@/lib/billing';
import { formatInterval } from '@/lib/i18n';
import { formatMoney } from '@/lib/money';
import { PAYMENT_METHOD_ICONS, paymentDetailLabel } from '@/lib/payment-methods';

/** Read-only summary of a subscription, shown as a sheet, with Edit and Delete actions. */
export default function SubscriptionDetailsScreen() {
  const router = useRouter();
  const theme = useTheme();
  const insets = useSafeAreaInsets();
  const { id } = useLocalSearchParams<{ id: string }>();
  const { t, tm, locale, language } = useTranslation();
  const alert = useAlert();
  const prefs = useCurrency();
  const { subscriptions, remove } = useSubscriptions();
  const sub = subscriptions.find((item) => item.id === Number(id));

  if (!sub) {
    return (
      <View style={[styles.content, { paddingBottom: insets.bottom + Spacing.four }]}>
        <ThemedText themeColor="textSecondary" style={styles.center}>
          {t('subscriptionForm.notFound')}
        </ThemedText>
        <Button title={t('form.close')} variant="secondary" onPress={() => router.back()} />
      </View>
    );
  }

  const dateFormat = new Intl.DateTimeFormat(locale, {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });
  const formatDate = (iso: string) => {
    const date = isoToLocalDate(iso);
    return date ? dateFormat.format(date) : iso;
  };
  const nextPayment = nextPaymentFrom(sub.firstPayment, sub.interval, sub.billingDay, todayISO());
  // Shown the same way as in the list (single mode uses the app currency).
  const shown = effectiveAmount(sub.amountMinor, sub.currency, prefs);
  const isMonthly = sub.interval.unit === 'month' && sub.interval.count === 1;
  const payment = paymentDetailLabel(sub.paymentMethod, sub.cardBrand, sub.cardLast4, {
    method: (value) => t(`paymentMethod.${value}`),
    brand: (value) => t(`cardBrand.${value}`),
  });
  const paymentIcon = sub.paymentMethod
    ? PAYMENT_METHOD_ICONS[sub.paymentMethod]
    : PAYMENT_METHOD_ICONS.card;

  function confirmDelete() {
    if (!sub) return;
    confirmDeleteSubscription({
      alert,
      name: sub.name,
      t,
      tm,
      remove: () => remove(sub.id),
      onDeleted: () => router.back(),
    });
  }

  return (
    <View style={[styles.content, { paddingBottom: insets.bottom + Spacing.four }]}>
      <View style={styles.header}>
        <SubscriptionAvatar name={sub.name} category={sub.category} size={56} />
        <View style={styles.identity}>
          <ThemedText style={styles.name} numberOfLines={2}>
            {sub.name}
          </ThemedText>
          <View style={styles.tagRow}>
            <CategoryTag category={sub.category} />
          </View>
        </View>
      </View>

      <View style={styles.hero}>
        <Money amountMinor={shown.amountMinor} currency={shown.currency} size={44} weight={700} />
        <ThemedText themeColor="textSecondary">{formatInterval(language, sub.interval)}</ThemedText>
      </View>

      <ListSection>
        <ListRow
          icon={{ ios: 'calendar', android: 'calendar_today', web: 'calendar_today' }}
          title={t('details.nextPayment')}
          value={formatDate(nextPayment)}
        />
        <ListRow
          icon={{ ios: 'clock.arrow.circlepath', android: 'history', web: 'history' }}
          title={t('details.firstPayment')}
          value={formatDate(sub.firstPayment)}
        />
        {isMonthly ? null : (
          <ListRow
            icon={{ ios: 'chart.bar', android: 'bar_chart', web: 'bar_chart' }}
            title={t('details.perMonth')}
            value={formatMoney(toMonthly(shown.amountMinor, sub.interval), shown.currency, locale)}
          />
        )}
        <ListRow
          icon={{ ...paymentIcon, web: paymentIcon.android }}
          title={t('details.paymentMethod')}
          value={payment ?? t('details.notSet')}
        />
      </ListSection>

      {sub.notes ? (
        <ListSection title={t('subscriptionForm.notes')}>
          <ThemedText style={styles.notes}>{sub.notes}</ThemedText>
        </ListSection>
      ) : null}

      <View style={styles.actions}>
        <Button
          title={t('details.edit')}
          onPress={() =>
            router.navigate({ pathname: '/subscription/edit/[id]', params: { id: String(sub.id) } })
          }
        />
        <Pressable
          onPress={confirmDelete}
          accessibilityRole="button"
          style={({ pressed }) => [styles.delete, pressed && styles.pressed]}>
          <SymbolView
            name={{ ios: 'trash', android: 'delete', web: 'delete' }}
            size={18}
            tintColor={theme.destructive}
          />
          <ThemedText type="smallBold" style={[styles.deleteLabel, { color: theme.destructive }]}>
            {t('subscriptionForm.delete')}
          </ThemedText>
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  content: {
    paddingTop: Spacing.five,
    paddingHorizontal: Spacing.four,
    gap: Spacing.four,
  },
  center: {
    textAlign: 'center',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.three,
  },
  identity: {
    flex: 1,
    gap: Spacing.one,
  },
  name: {
    fontSize: 24,
    lineHeight: 30,
    fontWeight: 700,
  },
  tagRow: {
    flexDirection: 'row',
  },
  hero: {
    gap: Spacing.one,
  },
  notes: {
    padding: Spacing.three,
  },
  actions: {
    gap: Spacing.one,
  },
  delete: {
    minHeight: 52,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.two,
  },
  deleteLabel: {
    fontSize: 16,
  },
  pressed: {
    opacity: 0.6,
  },
});
