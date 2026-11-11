import { Stack } from 'expo-router';

import { useTranslation } from '@/context/language-context';
import { useTheme } from '@/hooks/use-theme';

export const unstable_settings = { anchor: 'index' };

export default function ProfileLayout() {
  const theme = useTheme();
  const { t } = useTranslation();

  return (
    <Stack
      screenOptions={{
        headerShadowVisible: false,
        headerStyle: { backgroundColor: theme.background },
        headerTintColor: theme.text,
        contentStyle: { backgroundColor: theme.background },
      }}>
      <Stack.Screen name="index" options={{ headerShown: false, title: t('profile.title') }} />
      <Stack.Screen
        name="settings"
        options={{
          title: t('settings.title'),
          // Set here, not only via the previous screen's title: iOS reads that once on push,
          // so the back button kept the old language after switching it in Settings.
          headerBackTitle: t('profile.title'),
        }}
      />
    </Stack>
  );
}
