import { SymbolView } from 'expo-symbols';
import { StyleSheet, View } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { Spacing } from '@/constants/theme';
import { useTranslation } from '@/context/language-context';
import { useTheme } from '@/hooks/use-theme';
import {
  PAYMENT_METHOD_ICONS,
  isCardLast4,
  paymentLabel,
  type CardBrand,
  type PaymentMethod,
} from '@/lib/payment-methods';

type PaymentBadgeProps = {
  method: PaymentMethod | null;
  brand: CardBrand | null;
  last4: string | null;
};

/** The payment method's icon and, for a card, its last digits ("•••• 4242"). */
export function PaymentBadge({ method, brand, last4 }: PaymentBadgeProps) {
  const theme = useTheme();
  const { t } = useTranslation();

  const label = paymentLabel(method, brand, last4, {
    method: (value) => t(`paymentMethod.${value}`),
    brand: (value) => t(`cardBrand.${value}`),
  });
  if (!method || !label) return null;

  const icon = PAYMENT_METHOD_ICONS[method];
  return (
    <View
      style={styles.row}
      accessible
      accessibilityLabel={
        method === 'card' && isCardLast4(last4) ? t('payment.cardEnding', { digits: last4 }) : label
      }>
      <SymbolView
        name={{ ios: icon.ios, android: icon.android, web: icon.android }}
        size={14}
        tintColor={theme.textSecondary}
      />
      <ThemedText type="small" themeColor="textSecondary" style={styles.label} numberOfLines={1}>
        {label}
      </ThemedText>
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.one,
  },
  label: {
    fontVariant: ['tabular-nums'],
  },
});
