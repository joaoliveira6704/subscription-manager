import * as Haptics from 'expo-haptics';
import { SymbolView } from 'expo-symbols';
import { Modal, Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { ThemedText } from '@/components/themed-text';
import { ListRow, ListSection } from '@/components/ui/list';
import { Spacing } from '@/constants/theme';
import { useTranslation } from '@/context/language-context';
import { useTheme } from '@/hooks/use-theme';
import { SUPPORTED_CURRENCIES, currencySymbol, type Currency } from '@/lib/money';

export type CurrencyChoice = Currency | 'all';

type CurrencyPickerProps = {
  visible: boolean;
  value: CurrencyChoice;
  onSelect: (value: CurrencyChoice) => void;
  onClose: () => void;
  /** Adds an "All currencies" option (used to filter the list). */
  includeAll?: boolean;
  title: string;
};

/** Bottom sheet listing the supported currencies, each with its symbol and localized name. */
export function CurrencyPicker({
  visible,
  value,
  onSelect,
  onClose,
  includeAll = false,
  title,
}: CurrencyPickerProps) {
  const theme = useTheme();
  const insets = useSafeAreaInsets();
  const { t, locale } = useTranslation();

  const options: CurrencyChoice[] = includeAll ? ['all', ...SUPPORTED_CURRENCIES] : [...SUPPORTED_CURRENCIES];
  const checkmark = (
    <SymbolView
      name={{ ios: 'checkmark', android: 'check', web: 'check' }}
      size={20}
      tintColor={theme.text}
    />
  );

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={onClose}
      // Android: draw under the system bars so the sheet reaches the bottom of the screen
      // (otherwise a strip is left above the navigation bar). The sheet pads for it itself.
      statusBarTranslucent
      navigationBarTranslucent>
      <View style={styles.root}>
        <Pressable
          style={[StyleSheet.absoluteFill, { backgroundColor: theme.scrim }]}
          onPress={onClose}
          accessibilityRole="button"
          accessibilityLabel={t('profile.cancel')}
        />
        <View
          style={[
            styles.sheet,
            { backgroundColor: theme.backgroundSheet, paddingBottom: insets.bottom + Spacing.three },
          ]}>
          <View style={[styles.grabber, { backgroundColor: theme.backgroundSelected }]} />
          <ThemedText type="smallBold" style={styles.title}>
            {title}
          </ThemedText>
          <ScrollView bounces={false}>
            <ListSection>
              {options.map((option) => {
                const selected = option === value;
                return (
                  <ListRow
                    key={option}
                    icon={
                      option === 'all'
                        ? { ios: 'square.stack', android: 'stacks', web: 'stacks' }
                        : { ios: 'banknote', android: 'payments', web: 'payments' }
                    }
                    title={option === 'all' ? t('currency.all') : t(`currencyName.${option}`)}
                    subtitle={option === 'all' ? undefined : `${option} · ${currencySymbol(option, locale)}`}
                    accessibilityRole="radio"
                    selected={selected}
                    trailing={selected ? checkmark : null}
                    onPress={() => {
                      if (!selected) Haptics.selectionAsync();
                      onSelect(option);
                      onClose();
                    }}
                  />
                );
              })}
            </ListSection>
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  sheet: {
    maxHeight: '80%',
    borderTopLeftRadius: Spacing.four,
    borderTopRightRadius: Spacing.four,
    paddingHorizontal: Spacing.three,
    paddingTop: Spacing.two,
    gap: Spacing.three,
  },
  grabber: {
    alignSelf: 'center',
    width: 36,
    height: 5,
    borderRadius: 3,
  },
  title: {
    textAlign: 'center',
  },
});
