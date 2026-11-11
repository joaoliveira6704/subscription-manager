import Constants from 'expo-constants';
import * as Haptics from 'expo-haptics';
import { useRouter } from 'expo-router';
import { Alert, ScrollView, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { ThemedText } from '@/components/themed-text';
import { Button } from '@/components/ui/button';
import { ListRow, ListSection } from '@/components/ui/list';
import { BottomTabInset, MaxContentWidth, Spacing } from '@/constants/theme';
import { useAuth } from '@/context/auth-context';
import { useTranslation } from '@/context/language-context';
import { useThemePreference } from '@/context/theme-preference-context';
import { useTheme } from '@/hooks/use-theme';
import { languageName } from '@/lib/i18n';
import { formatMonthYear, getInitials } from '@/lib/profile';

const AVATAR_SIZE = 88;

export default function ProfileScreen() {
  const insets = useSafeAreaInsets();
  const theme = useTheme();
  const router = useRouter();
  const { user, signOut } = useAuth();
  const { preference: themePreference } = useThemePreference();
  const { t, language, locale } = useTranslation();

  const displayName = user?.name || user?.email || '';
  const createdMonth = formatMonthYear(user?.createdAt, locale);
  const version = Constants.expoConfig?.version;

  function confirmSignOut() {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
    Alert.alert(t('profile.signOutTitle'), t('profile.signOutMessage'), [
      { text: t('profile.cancel'), style: 'cancel' },
      { text: t('profile.signOut'), style: 'destructive', onPress: () => signOut() },
    ]);
  }

  return (
    <ScrollView
      style={{ backgroundColor: theme.background }}
      contentContainerStyle={[
        styles.content,
        {
          paddingTop: insets.top + Spacing.four,
          paddingBottom: insets.bottom + BottomTabInset + Spacing.four,
        },
      ]}>
      <View style={styles.inner}>
        <View style={styles.header}>
          <View style={[styles.avatar, { backgroundColor: theme.backgroundElement }]}>
            <ThemedText style={styles.avatarText} accessibilityElementsHidden>
              {getInitials(user?.name, user?.email)}
            </ThemedText>
          </View>
          <View style={styles.identity}>
            <ThemedText type="subtitle" style={styles.name} numberOfLines={2}>
              {displayName}
            </ThemedText>
            {user?.name ? (
              <ThemedText themeColor="textSecondary">{user.email}</ThemedText>
            ) : null}
            {createdMonth ? (
              <ThemedText type="small" themeColor="textSecondary">
                {t('profile.memberSince', { date: createdMonth })}
              </ThemedText>
            ) : null}
          </View>
        </View>

        <ListSection title={t('profile.account')}>
          <ListRow
            icon={{ ios: 'person', android: 'person', web: 'person' }}
            title={t('form.name')}
            subtitle={user?.name || t('profile.addName')}
            onPress={() => router.navigate('/account/edit-name')}
          />
          <ListRow
            icon={{ ios: 'envelope', android: 'mail', web: 'mail' }}
            title={t('form.email')}
            subtitle={user?.email}
            onPress={() => router.navigate('/account/edit-email')}
          />
          <ListRow
            icon={{ ios: 'lock', android: 'lock', web: 'lock' }}
            title={t('form.password')}
            subtitle={t('profile.changePassword')}
            onPress={() => router.navigate('/account/change-password')}
          />
        </ListSection>

        <ListSection title={t('profile.preferences')}>
          <ListRow
            icon={{ ios: 'gearshape', android: 'settings', web: 'settings' }}
            title={t('profile.settings')}
            subtitle={t('profile.settingsSummary', {
              theme: t(`settings.${themePreference}`),
              language: languageName(language),
            })}
            onPress={() => router.navigate('/profile/settings')}
          />
        </ListSection>

        {version ? (
          <ListSection title={t('profile.about')}>
            <ListRow
              icon={{ ios: 'info.circle', android: 'info', web: 'info' }}
              title={t('profile.appVersion')}
              value={version}
            />
          </ListSection>
        ) : null}

        <Button title={t('profile.signOut')} variant="secondary" onPress={confirmSignOut} />
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  content: {
    alignItems: 'center',
    paddingHorizontal: Spacing.four,
  },
  inner: {
    width: '100%',
    maxWidth: MaxContentWidth / 2,
    gap: Spacing.four,
  },
  header: {
    alignItems: 'center',
    gap: Spacing.three,
    paddingVertical: Spacing.three,
  },
  avatar: {
    width: AVATAR_SIZE,
    height: AVATAR_SIZE,
    borderRadius: AVATAR_SIZE / 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: {
    fontSize: 32,
    lineHeight: 40,
    fontWeight: 700,
  },
  identity: {
    alignItems: 'center',
    gap: Spacing.one,
  },
  name: {
    textAlign: 'center',
  },
});
