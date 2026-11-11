import * as Haptics from 'expo-haptics';
import { useRouter } from 'expo-router';
import { SymbolView } from 'expo-symbols';
import { useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { ScrollView } from 'react-native-gesture-handler';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { CategoryTag } from '@/components/category-tag';
import { confirmDeleteSubscription } from '@/components/confirm-delete-subscription';
import { PaymentBadge } from '@/components/payment-badge';
import { SubscriptionAvatar } from '@/components/subscription-avatar';
import { ThemedText } from '@/components/themed-text';
import { ChipGroup } from '@/components/ui/chip-group';
import { Button } from '@/components/ui/button';
import { CurrencyPicker, type CurrencyChoice } from '@/components/ui/currency-picker';
import { ListRow } from '@/components/ui/list';
import { Money } from '@/components/ui/money';
import { SwipeActions } from '@/components/ui/swipe-actions';
import { BottomTabInset, MaxContentWidth, Spacing } from '@/constants/theme';
import { useAlert } from '@/context/alert-context';
import { useCurrency } from '@/context/currency-context';
import { useTranslation } from '@/context/language-context';
import { useSubscriptions } from '@/context/subscriptions-context';
import { useTheme } from '@/hooks/use-theme';
import {
  groupByDue,
  isoToLocalDate,
  nextPaymentFrom,
  todayISO,
  totalsByCurrency,
} from '@/lib/billing';
import { CATEGORY_ICONS, categoriesInUse, type Category } from '@/lib/categories';
import { effectiveCurrency } from '@/lib/currency-preference';
import { formatInterval } from '@/lib/i18n';
import { formatMoney } from '@/lib/money';

export default function SubscriptionsScreen() {
  const insets = useSafeAreaInsets();
  const theme = useTheme();
  const router = useRouter();
  const { t, tm, locale, language } = useTranslation();
  const alert = useAlert();
  const prefs = useCurrency();
  const { subscriptions, isLoading, error, reload, remove } = useSubscriptions();
  const [filter, setFilter] = useState<CurrencyChoice>('all');
  const [categoryFilter, setCategoryFilter] = useState<Category | 'all'>('all');
  const [pickerOpen, setPickerOpen] = useState(false);

  const today = todayISO();
  const items = subscriptions
    .map((sub) => ({
      ...sub,
      currency: effectiveCurrency(sub.currency, prefs),
      nextPayment: nextPaymentFrom(sub.firstPayment, sub.interval, sub.billingDay, today),
    }))
    .filter((sub) => prefs.mode === 'single' || filter === 'all' || sub.currency === filter);
  const usedCategories = categoriesInUse(items);
  // Falls back to "All" if the chosen category no longer has any subscriptions (e.g. deleted).
  const activeCategory =
    categoryFilter !== 'all' && usedCategories.includes(categoryFilter) ? categoryFilter : 'all';
  const visibleItems =
    activeCategory === 'all' ? items : items.filter((sub) => sub.category === activeCategory);
  const totals = totalsByCurrency(visibleItems);
  const groups = groupByDue(visibleItems, today);

  const pillValue: CurrencyChoice = prefs.mode === 'single' ? prefs.currency : filter;
  const dateFormat = new Intl.DateTimeFormat(locale, {
    day: 'numeric',
    month: 'short',
  });
  const dateFormatWithYear = new Intl.DateTimeFormat(locale, {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });

  function renewsLabel(nextPayment: string) {
    const date = isoToLocalDate(nextPayment);
    if (!date) return '';
    const format = nextPayment.slice(0, 4) === today.slice(0, 4) ? dateFormat : dateFormatWithYear;
    return t('subscriptions.renews', { date: format.format(date) });
  }

  function openAdd() {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    router.navigate('/subscription/new');
  }

  const showEmpty = !isLoading && !error && subscriptions.length === 0;

  return (
    <View style={[styles.flex, { backgroundColor: theme.background }]}>
      {/* Fixed: header, totals and filters stay put; only the cards below scroll. */}
      <View style={[styles.content, styles.fixedTop, { paddingTop: insets.top + Spacing.three }]}>
        <View style={styles.inner}>
          <View style={styles.header}>
            <ThemedText type="subtitle" style={styles.flex} numberOfLines={1}>
              {t('tabs.subscriptions')}
            </ThemedText>
            {subscriptions.length > 0 ? (
              <Pressable
                onPress={() => setPickerOpen(true)}
                accessibilityRole="button"
                accessibilityLabel={`${t('currency.title')}, ${
                  pillValue === 'all' ? t('currency.all') : pillValue
                }`}
                style={({ pressed }) => [
                  styles.pill,
                  { backgroundColor: theme.backgroundElement },
                  pressed && styles.pressed,
                ]}>
                <ThemedText type="smallBold">
                  {pillValue === 'all' ? t('currency.allShort') : pillValue}
                </ThemedText>
                <SymbolView
                  name={{
                    ios: 'chevron.down',
                    android: 'expand_more',
                    web: 'expand_more',
                  }}
                  size={12}
                  tintColor={theme.textSecondary}
                />
              </Pressable>
            ) : null}
            <Pressable
              onPress={openAdd}
              accessibilityRole="button"
              accessibilityLabel={t('subscriptions.add')}
              style={({ pressed }) => [
                styles.addButton,
                { backgroundColor: theme.text },
                pressed && styles.pressedScale,
              ]}>
              <SymbolView
                name={{ ios: 'plus', android: 'add', web: 'add' }}
                size={22}
                weight="semibold"
                tintColor={theme.background}
              />
            </Pressable>
          </View>

          {subscriptions.length > 0 ? (
            <View style={styles.hero} accessibilityRole="summary">
              {totals.length === 0 ? (
                <Money
                  amountMinor={0}
                  currency={pillValue === 'all' ? prefs.currency : pillValue}
                  size={44}
                  weight={700}
                />
              ) : (
                totals.map((total, index) => (
                  <View key={total.currency} style={styles.heroLine}>
                    <Money
                      amountMinor={total.monthly}
                      currency={total.currency}
                      size={index === 0 ? 44 : 26}
                      weight={700}
                    />
                    {index === 0 ? (
                      <ThemedText themeColor="textSecondary">
                        {t('subscriptions.perMonth')}
                      </ThemedText>
                    ) : null}
                  </View>
                ))
              )}
              {totals.length === 1 ? (
                <ThemedText type="small" themeColor="textSecondary" style={styles.tabular}>
                  {t('subscriptions.perYear', {
                    amount: formatMoney(totals[0].yearly, totals[0].currency, locale),
                  })}
                </ThemedText>
              ) : null}
            </View>
          ) : null}

          {usedCategories.length > 1 ? (
            <ChipGroup
              scrollable
              edgeInset={Spacing.four}
              accessibilityLabel={t('subscriptionForm.category')}
              options={[
                { value: 'all' as const, label: t('subscriptions.allCategories') },
                ...usedCategories.map((category) => ({
                  value: category,
                  label: t(`category.${category}`),
                  icon: { ...CATEGORY_ICONS[category], web: CATEGORY_ICONS[category].android },
                })),
              ]}
              value={activeCategory}
              onChange={setCategoryFilter}
            />
          ) : null}
        </View>
      </View>

      {/* Gesture-handler's ScrollView coordinates with the swipeable cards: once a
          vertical scroll starts, the card swipe is cancelled (and vice versa). */}
      <ScrollView
        style={styles.flex}
        // Each group's header ("Next 7 days", "Later"…) sticks to the top while its cards
        // scroll underneath. Children: status first, then header + cards for each group.
        stickyHeaderIndices={groups.map((_, index) => 1 + index * 2)}
        contentContainerStyle={[
          styles.content,
          { paddingBottom: insets.bottom + BottomTabInset + Spacing.four },
        ]}>
        <View style={styles.inner}>
          {error ? (
            <View style={[styles.card, { backgroundColor: theme.backgroundElement }]}>
              <ThemedText themeColor="textSecondary">{tm(error)}</ThemedText>
              <Button title={t('subscriptions.retry')} variant="secondary" onPress={reload} />
            </View>
          ) : null}

          {isLoading && subscriptions.length === 0 ? <SkeletonList /> : null}

          {showEmpty ? (
            <View style={[styles.card, styles.empty, { backgroundColor: theme.backgroundElement }]}>
              <View style={[styles.emptyIcon, { backgroundColor: theme.backgroundSelected }]}>
                <SymbolView
                  name={{
                    ios: 'creditcard',
                    android: 'credit_card',
                    web: 'credit_card',
                  }}
                  size={28}
                  tintColor={theme.text}
                />
              </View>
              <ThemedText type="smallBold" style={styles.emptyTitle}>
                {t('subscriptions.emptyTitle')}
              </ThemedText>
              <ThemedText themeColor="textSecondary" style={styles.center}>
                {t('subscriptions.emptyBody')}
              </ThemedText>
              <Button
                title={t('subscriptions.emptyAction')}
                onPress={openAdd}
                style={styles.stretch}
              />
            </View>
          ) : null}
        </View>

        {groups.flatMap(({ group, items: groupItems }) => [
          <View
            key={`${group}-header`}
            style={[styles.inner, styles.stickyHeader, { backgroundColor: theme.background }]}>
            <ThemedText type="small" themeColor="textSecondary">
              {t(`due.${group}`)}
            </ThemedText>
          </View>,
          <View key={`${group}-cards`} style={[styles.inner, styles.section]}>
            {groupItems.map((sub) => (
              <SwipeActions
                key={sub.id}
                editLabel={t('details.edit')}
                onEdit={() =>
                  router.navigate({
                    pathname: '/subscription/edit/[id]',
                    params: { id: String(sub.id) },
                  })
                }
                deleteLabel={t('subscriptionForm.deleteConfirm')}
                onDelete={() =>
                  confirmDeleteSubscription({
                    alert,
                    name: sub.name,
                    t,
                    tm,
                    remove: () => remove(sub.id),
                  })
                }>
                <View
                  style={[styles.subscriptionCard, { backgroundColor: theme.backgroundElement }]}>
                  <ListRow
                    icon={{
                      ...CATEGORY_ICONS[sub.category],
                      web: CATEGORY_ICONS[sub.category].android,
                    }}
                    leading={<SubscriptionAvatar name={sub.name} category={sub.category} />}
                    titleAccessory={<CategoryTag category={sub.category} />}
                    title={sub.name}
                    subtitle={`${renewsLabel(sub.nextPayment)} · ${formatInterval(language, sub.interval)}`}
                    trailing={
                      <View style={styles.trailing}>
                        <Money amountMinor={sub.amountMinor} currency={sub.currency} />
                        <PaymentBadge
                          method={sub.paymentMethod}
                          brand={sub.cardBrand}
                          last4={sub.cardLast4}
                        />
                      </View>
                    }
                    onPress={() =>
                      router.navigate({
                        pathname: '/subscription/[id]',
                        params: { id: String(sub.id) },
                      })
                    }
                  />
                </View>
              </SwipeActions>
            ))}
          </View>,
        ])}
      </ScrollView>

      <CurrencyPicker
        visible={pickerOpen}
        title={prefs.mode === 'single' ? t('currency.appCurrency') : t('currency.filter')}
        value={pillValue}
        includeAll={prefs.mode === 'perSubscription'}
        onSelect={(value) => {
          if (prefs.mode === 'single') {
            if (value !== 'all') prefs.setCurrency(value);
          } else {
            setFilter(value);
          }
        }}
        onClose={() => setPickerOpen(false)}
      />
    </View>
  );
}

/** Placeholder rows shown while the list loads for the first time. */
function SkeletonList() {
  const theme = useTheme();
  return (
    <View
      style={[styles.card, { backgroundColor: theme.backgroundElement }]}
      accessibilityElementsHidden
      importantForAccessibility="no-hide-descendants">
      {[0, 1, 2].map((key) => (
        <View key={key} style={styles.skeletonRow}>
          <View style={[styles.skeletonIcon, { backgroundColor: theme.backgroundSelected }]} />
          <View style={styles.skeletonText}>
            <View
              style={[
                styles.skeletonLine,
                { width: '60%', backgroundColor: theme.backgroundSelected },
              ]}
            />
            <View
              style={[
                styles.skeletonLine,
                { width: '40%', backgroundColor: theme.backgroundSelected },
              ]}
            />
          </View>
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  trailing: {
    alignItems: 'flex-end',
    gap: Spacing.half,
  },
  flex: {
    flex: 1,
  },
  content: {
    alignItems: 'center',
    paddingHorizontal: Spacing.four,
  },
  fixedTop: {
    paddingBottom: Spacing.three,
  },
  inner: {
    width: '100%',
    maxWidth: MaxContentWidth / 2,
    gap: Spacing.four,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.two,
  },
  pill: {
    minHeight: 44,
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.one,
    paddingHorizontal: Spacing.three,
    borderRadius: 22,
  },
  addButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
  },
  pressed: {
    opacity: 0.7,
  },
  pressedScale: {
    opacity: 0.85,
    transform: [{ scale: 0.94 }],
  },
  hero: {
    gap: Spacing.one,
    paddingVertical: Spacing.two,
  },
  section: {
    gap: Spacing.two,
    marginBottom: Spacing.three,
  },
  // Opaque so the cards scroll underneath it while it's stuck to the top.
  stickyHeader: {
    paddingHorizontal: Spacing.two,
    paddingVertical: Spacing.two,
  },
  subscriptionCard: {
    borderRadius: Spacing.three,
    overflow: 'hidden',
  },
  tabular: {
    fontVariant: ['tabular-nums'],
  },
  heroLine: {
    flexDirection: 'row',
    alignItems: 'baseline',
    flexWrap: 'wrap',
    gap: Spacing.two,
  },
  card: {
    borderRadius: Spacing.three,
    padding: Spacing.four,
    gap: Spacing.three,
  },
  empty: {
    alignItems: 'center',
  },
  emptyIcon: {
    width: 64,
    height: 64,
    borderRadius: 32,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyTitle: {
    fontSize: 18,
    lineHeight: 24,
  },
  center: {
    textAlign: 'center',
  },
  stretch: {
    alignSelf: 'stretch',
  },
  skeletonRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.three,
  },
  skeletonIcon: {
    width: 36,
    height: 36,
    borderRadius: 18,
  },
  skeletonText: {
    flex: 1,
    gap: Spacing.two,
  },
  skeletonLine: {
    height: 12,
    borderRadius: 6,
  },
});
