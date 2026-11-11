import { StyleSheet, Text, type TextStyle } from 'react-native';

import { useTranslation } from '@/context/language-context';
import { useTheme } from '@/hooks/use-theme';
import { formatMoney, formatMoneyParts, type Currency } from '@/lib/money';

type MoneyProps = {
  amountMinor: number;
  currency: Currency;
  /** Size of the main figure; the symbol and decimals are drawn at ~55%. */
  size?: number;
  weight?: TextStyle['fontWeight'];
  color?: string;
};

/**
 * An amount formatted for the user's language with `Intl.NumberFormat`, using tabular figures
 * and a smaller currency symbol and decimals, so the main number stands out.
 */
export function Money({ amountMinor, currency, size = 16, weight = 600, color }: MoneyProps) {
  const theme = useTheme();
  const { locale } = useTranslation();
  const smallSize = Math.round(size * 0.55);

  return (
    <Text
      accessibilityLabel={formatMoney(amountMinor, currency, locale)}
      style={[
        styles.base,
        { color: color ?? theme.text, fontSize: size, lineHeight: Math.round(size * 1.2), fontWeight: weight },
      ]}>
      {formatMoneyParts(amountMinor, currency, locale).map((part, index) => (
        <Text key={index} style={part.small && size > 20 ? { fontSize: smallSize } : undefined}>
          {part.value}
        </Text>
      ))}
    </Text>
  );
}

const styles = StyleSheet.create({
  base: {
    fontVariant: ['tabular-nums'],
  },
});
