import * as Haptics from 'expo-haptics';
import { SymbolView, type SymbolViewProps } from 'expo-symbols';
import { ScrollView, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { ListRow, ListSection } from '@/components/ui/list';
import { BottomTabInset, MaxContentWidth, Spacing } from '@/constants/theme';
import { useTranslation } from '@/context/language-context';
import { useThemePreference } from '@/context/theme-preference-context';
import { useTheme } from '@/hooks/use-theme';
import { LANGUAGES, languageName, type LanguagePreference } from '@/lib/i18n';
import { THEME_PREFERENCES, type ThemePreference } from '@/lib/theme-preference';

const THEME_ICONS: Record<ThemePreference, SymbolViewProps['name']> = {
  system: { ios: 'circle.lefthalf.filled', android: 'contrast', web: 'contrast' },
  light: { ios: 'sun.max', android: 'light_mode', web: 'light_mode' },
  dark: { ios: 'moon', android: 'dark_mode', web: 'dark_mode' },
};

const SYSTEM_ICON: SymbolViewProps['name'] = {
  ios: 'iphone',
  android: 'smartphone',
  web: 'smartphone',
};
const LANGUAGE_ICON: SymbolViewProps['name'] = {
  ios: 'character.bubble',
  android: 'translate',
  web: 'translate',
};

export default function SettingsScreen() {
  const insets = useSafeAreaInsets();
  const theme = useTheme();
  const themePreference = useThemePreference();
  const { t, language, preference: languagePreference, setPreference: setLanguage } =
    useTranslation();

  function chooseTheme(next: ThemePreference) {
    if (next === themePreference.preference) return;
    Haptics.selectionAsync();
    themePreference.setPreference(next);
  }

  function chooseLanguage(next: LanguagePreference) {
    if (next === languagePreference) return;
    Haptics.selectionAsync();
    setLanguage(next);
  }

  const checkmark = (
    <SymbolView
      name={{ ios: 'checkmark', android: 'check', web: 'check' }}
      size={20}
      tintColor={theme.text}
    />
  );

  return (
    <ScrollView
      style={{ backgroundColor: theme.background }}
      contentContainerStyle={[
        styles.content,
        { paddingBottom: insets.bottom + BottomTabInset + Spacing.four },
      ]}>
      <View style={styles.inner}>
        <ListSection title={t('settings.theme')}>
          {THEME_PREFERENCES.map((option) => {
            const isSelected = option === themePreference.preference;
            return (
              <ListRow
                key={option}
                icon={THEME_ICONS[option]}
                title={t(`settings.${option}`)}
                subtitle={option === 'system' ? t('settings.matchDevice') : undefined}
                onPress={() => chooseTheme(option)}
                accessibilityRole="radio"
                selected={isSelected}
                trailing={isSelected ? checkmark : null}
              />
            );
          })}
        </ListSection>

        <ListSection title={t('settings.language')}>
          <ListRow
            icon={SYSTEM_ICON}
            title={t('settings.system')}
            subtitle={
              languagePreference === 'system'
                ? `${t('settings.matchDevice')} · ${languageName(language)}`
                : t('settings.matchDevice')
            }
            onPress={() => chooseLanguage('system')}
            accessibilityRole="radio"
            selected={languagePreference === 'system'}
            trailing={languagePreference === 'system' ? checkmark : null}
          />
          {LANGUAGES.map((option) => {
            const isSelected = option.value === languagePreference;
            return (
              <ListRow
                key={option.value}
                icon={LANGUAGE_ICON}
                title={option.name}
                onPress={() => chooseLanguage(option.value)}
                accessibilityRole="radio"
                selected={isSelected}
                trailing={isSelected ? checkmark : null}
              />
            );
          })}
        </ListSection>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  content: {
    alignItems: 'center',
    paddingHorizontal: Spacing.four,
    paddingTop: Spacing.three,
  },
  inner: {
    width: '100%',
    maxWidth: MaxContentWidth / 2,
    gap: Spacing.four,
  },
});
