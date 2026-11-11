import * as Haptics from 'expo-haptics';
import { SymbolView } from 'expo-symbols';
import { useState } from 'react';
import { KeyboardAvoidingView, Platform, Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { ThemedText } from '@/components/themed-text';
import { Button } from '@/components/ui/button';
import { ChipGroup } from '@/components/ui/chip-group';
import { CurrencyPicker } from '@/components/ui/currency-picker';
import { DateField } from '@/components/ui/date-field';
import { SegmentedControl } from '@/components/ui/segmented-control';
import { ERROR_COLOR, TextField } from '@/components/ui/text-field';
import { MaxContentWidth, Spacing } from '@/constants/theme';
import { useCurrency } from '@/context/currency-context';
import { useTranslation } from '@/context/language-context';
import { useTheme } from '@/hooks/use-theme';
import {
  INTERVAL_UNITS,
  PRESET_INTERVALS,
  isoToLocalDate,
  nextPaymentFrom,
  parseISODate,
  presetFor,
  todayISO,
  type IntervalPreset,
  type IntervalUnit,
} from '@/lib/billing';
import { CATEGORIES, CATEGORY_ICONS, DEFAULT_CATEGORY, type Category } from '@/lib/categories';
import { amountToInput, currencySymbol, parseAmount, type Currency } from '@/lib/money';
import {
  validateSubscription,
  type SubscriptionErrors,
  type SubscriptionInput,
} from '@/lib/subscription-validation';
import type { Subscription } from '@/lib/subscriptions';
import { MAX_NAME_LENGTH, MAX_NOTES_LENGTH } from '@/lib/validation';

type SubscriptionFormProps = {
  title: string;
  submitLabel: string;
  initial?: Subscription;
  onSubmit: (input: SubscriptionInput) => Promise<{ error: string | null }>;
  onClose: () => void;
  /** Shown as a destructive button below the form when editing. */
  onDelete?: () => void;
};

/** Shared add/edit form, shown in a full-height sheet so it can scroll with the keyboard open. */
export function SubscriptionForm({
  title,
  submitLabel,
  initial,
  onSubmit,
  onClose,
  onDelete,
}: SubscriptionFormProps) {
  const theme = useTheme();
  const insets = useSafeAreaInsets();
  const { t, tm, locale } = useTranslation();
  const prefs = useCurrency();

  const [name, setName] = useState(initial?.name ?? '');
  const [currency, setCurrency] = useState<Currency>(initial?.currency ?? prefs.currency);
  // In single mode every subscription uses the app currency.
  const effective = prefs.mode === 'single' ? prefs.currency : currency;
  const [amountText, setAmountText] = useState(
    initial ? amountToInput(initial.amountMinor, initial.currency, locale) : ''
  );
  const [preset, setPreset] = useState<IntervalPreset>(
    initial ? presetFor(initial.interval) : 'monthly'
  );
  // Only used when the preset is "custom".
  const [customUnit, setCustomUnit] = useState<IntervalUnit>(initial?.interval.unit ?? 'month');
  const [customCountText, setCustomCountText] = useState(String(initial?.interval.count ?? 1));
  const [firstPayment, setFirstPayment] = useState(initial?.firstPayment ?? todayISO());

  const interval =
    preset === 'custom'
      ? { unit: customUnit, count: /^\d+$/.test(customCountText) ? Number(customCountText) : NaN }
      : PRESET_INTERVALS[preset];
  const firstDate = parseISODate(firstPayment);
  const nextPaymentPreview =
    firstDate && Number.isInteger(interval.count) && interval.count >= 1
      ? isoToLocalDate(nextPaymentFrom(firstPayment, interval, firstDate.day, firstPayment))
      : null;
  const [category, setCategory] = useState<Category>(initial?.category ?? DEFAULT_CATEGORY);
  const [notes, setNotes] = useState(initial?.notes ?? '');
  const [errors, setErrors] = useState<SubscriptionErrors>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [pickerOpen, setPickerOpen] = useState(false);

  async function handleSubmit() {
    const amountMinor = parseAmount(amountText, effective);
    const input: SubscriptionInput = {
      name,
      amountMinor: amountMinor ?? -1,
      currency: effective,
      intervalUnit: interval.unit,
      intervalCount: interval.count,
      firstPayment,
      category,
      notes,
    };
    const nextErrors = validateSubscription(input);
    setErrors(nextErrors);
    setFormError(null);
    if (Object.keys(nextErrors).length > 0) return;

    setSubmitting(true);
    const result = await onSubmit(input);
    setSubmitting(false);
    if (result.error) {
      setFormError(result.error);
      return;
    }
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    onClose();
  }

  const error = (key: keyof SubscriptionInput) => (errors[key] ? tm(errors[key]) : null);

  return (
    <KeyboardAvoidingView style={styles.flex} behavior="padding">
      {/* Fixed header: stays put while the form scrolls. Android shows the form full screen,
          so it needs the status bar inset; the iOS page sheet already starts below it. */}
      <View
        style={[
          styles.headerBar,
          {
            backgroundColor: theme.backgroundSheet,
            paddingTop: Platform.OS === 'android' ? insets.top + Spacing.three : Spacing.four,
          },
        ]}>
        <View style={[styles.inner, styles.header]}>
          <ThemedText type="subtitle" style={styles.title} numberOfLines={1}>
            {title}
          </ThemedText>
          <Pressable
            onPress={onClose}
            hitSlop={Spacing.two}
            accessibilityRole="button"
            accessibilityLabel={t('form.close')}
            style={({ pressed }) => [
              styles.close,
              { backgroundColor: theme.backgroundElement },
              pressed && styles.pressed,
            ]}>
            <SymbolView
              name={{ ios: 'xmark', android: 'close', web: 'close' }}
              size={16}
              tintColor={theme.text}
            />
          </Pressable>
        </View>
      </View>
      <ScrollView
        style={styles.flex}
        keyboardShouldPersistTaps="handled"
        contentContainerStyle={[styles.content, { paddingBottom: insets.bottom + Spacing.five }]}>
        <View style={styles.inner}>
          {formError ? (
            <View style={[styles.banner, { backgroundColor: theme.backgroundElement }]}>
              <ThemedText type="small" style={{ color: ERROR_COLOR }}>
                {tm(formError)}
              </ThemedText>
            </View>
          ) : null}

          <TextField
            label={t('form.name')}
            value={name}
            onChangeText={setName}
            error={error('name')}
            placeholder={t('subscriptionForm.namePlaceholder')}
            autoCapitalize="words"
            maxLength={MAX_NAME_LENGTH}
            returnKeyType="next"
          />

          <View style={styles.amountRow}>
            <View style={styles.flex}>
              <TextField
                label={t('subscriptionForm.price')}
                value={amountText}
                onChangeText={setAmountText}
                error={error('amountMinor')}
                placeholder="0,00"
                keyboardType="decimal-pad"
                accessory={
                  prefs.mode === 'single' ? (
                    <ThemedText themeColor="textSecondary">
                      {currencySymbol(effective, locale)}
                    </ThemedText>
                  ) : null
                }
              />
            </View>
            {prefs.mode === 'perSubscription' ? (
              <Pressable
                onPress={() => setPickerOpen(true)}
                accessibilityRole="button"
                accessibilityLabel={`${t('currency.title')}, ${currency}`}
                style={({ pressed }) => [
                  styles.currencyButton,
                  { backgroundColor: theme.backgroundElement },
                  pressed && styles.pressed,
                ]}>
                <ThemedText type="smallBold">{currency}</ThemedText>
                <SymbolView
                  name={{ ios: 'chevron.down', android: 'expand_more', web: 'expand_more' }}
                  size={14}
                  tintColor={theme.textSecondary}
                />
              </Pressable>
            ) : null}
          </View>

          <View style={styles.field}>
            <ThemedText type="smallBold">{t('subscriptionForm.cycle')}</ThemedText>
            <SegmentedControl
              accessibilityLabel={t('subscriptionForm.cycle')}
              options={(['weekly', 'monthly', 'yearly', 'custom'] as const).map((value) => ({
                value,
                label: t(`cycle.${value}`),
              }))}
              value={preset}
              onChange={setPreset}
            />
            {preset === 'custom' ? (
              <>
                <View style={styles.customRow}>
                  <ThemedText>{t('subscriptionForm.every')}</ThemedText>
                  <View style={styles.countField}>
                    <TextField
                      label={t('subscriptionForm.every')}
                      value={customCountText}
                      onChangeText={(text) => setCustomCountText(text.replace(/[^0-9]/g, ''))}
                      keyboardType="number-pad"
                      maxLength={2}
                      selectTextOnFocus
                      style={styles.countInput}
                      hideLabel
                    />
                  </View>
                  <ThemedText themeColor="textSecondary" style={styles.flex} numberOfLines={1}>
                    {t(`unit.${customUnit}s`)}
                  </ThemedText>
                </View>
                <SegmentedControl
                  accessibilityLabel={t('subscriptionForm.cycle')}
                  options={INTERVAL_UNITS.map((value) => ({
                    value,
                    label: t(`unitLabel.${value}`),
                  }))}
                  value={customUnit}
                  onChange={setCustomUnit}
                />
              </>
            ) : null}
            {errors.intervalCount ? (
              <ThemedText type="small" style={{ color: ERROR_COLOR }}>
                {tm(errors.intervalCount)}
              </ThemedText>
            ) : null}
          </View>

          <View style={styles.field}>
            <DateField
              label={t('subscriptionForm.firstPayment')}
              value={firstPayment}
              onChange={setFirstPayment}
              error={error('firstPayment')}
            />
            {nextPaymentPreview ? (
              <ThemedText type="small" themeColor="textSecondary" style={styles.hint}>
                {t('subscriptionForm.nextPaymentOn', {
                  date: new Intl.DateTimeFormat(locale, {
                    day: 'numeric',
                    month: 'short',
                    year: 'numeric',
                  }).format(nextPaymentPreview),
                })}
              </ThemedText>
            ) : null}
          </View>

          <View style={styles.field}>
            <ThemedText type="smallBold">{t('subscriptionForm.category')}</ThemedText>
            <ChipGroup
              accessibilityLabel={t('subscriptionForm.category')}
              options={CATEGORIES.map((value) => ({
                value,
                label: t(`category.${value}`),
                icon: { ...CATEGORY_ICONS[value], web: CATEGORY_ICONS[value].android },
              }))}
              value={category}
              onChange={setCategory}
            />
          </View>

          <TextField
            label={t('subscriptionForm.notes')}
            value={notes}
            onChangeText={setNotes}
            error={error('notes')}
            placeholder={t('subscriptionForm.notesPlaceholder')}
            maxLength={MAX_NOTES_LENGTH}
            multiline
            style={styles.notes}
          />

          <Button title={submitLabel} onPress={handleSubmit} loading={submitting} />
          {onDelete ? (
            <Pressable
              onPress={onDelete}
              accessibilityRole="button"
              style={({ pressed }) => [styles.delete, pressed && styles.pressed]}>
              <ThemedText type="smallBold" style={{ color: ERROR_COLOR, fontSize: 16 }}>
                {t('subscriptionForm.delete')}
              </ThemedText>
            </Pressable>
          ) : null}
        </View>
      </ScrollView>

      <CurrencyPicker
        visible={pickerOpen}
        title={t('currency.title')}
        value={currency}
        onSelect={(value) => value !== 'all' && setCurrency(value)}
        onClose={() => setPickerOpen(false)}
      />
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  flex: {
    flex: 1,
  },
  content: {
    alignItems: 'center',
    paddingHorizontal: Spacing.four,
    paddingTop: Spacing.two,
  },
  headerBar: {
    alignItems: 'center',
    paddingHorizontal: Spacing.four,
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
    gap: Spacing.three,
  },
  title: {
    flex: 1,
  },
  close: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
  },
  banner: {
    borderRadius: Spacing.three,
    padding: Spacing.three,
  },
  amountRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: Spacing.two,
  },
  currencyButton: {
    // Lines up with the input under the field label (label 20 + gap 8).
    marginTop: 28,
    minHeight: 52,
    minWidth: 88,
    borderRadius: Spacing.three,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.one,
    paddingHorizontal: Spacing.three,
  },
  field: {
    gap: Spacing.two,
  },
  customRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.two,
  },
  countField: {
    width: 64,
  },
  countInput: {
    textAlign: 'center',
    fontVariant: ['tabular-nums'],
  },
  hint: {
    paddingHorizontal: Spacing.three,
  },
  notes: {
    minHeight: 80,
    textAlignVertical: 'top',
  },
  delete: {
    minHeight: 52,
    alignItems: 'center',
    justifyContent: 'center',
  },
  pressed: {
    opacity: 0.7,
  },
});
