import { DarkTheme, DefaultTheme, Stack, ThemeProvider } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import * as SystemUI from 'expo-system-ui';
import { useEffect } from 'react';
import { useColorScheme } from 'react-native';

import { AnimatedSplashOverlay } from '@/components/animated-icon';
import { Colors, Spacing } from '@/constants/theme';
import { AuthProvider, useAuth } from '@/context/auth-context';
import { LanguageProvider } from '@/context/language-context';
import { ThemePreferenceProvider } from '@/context/theme-preference-context';
import { useTheme } from '@/hooks/use-theme';

SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  return (
    <ThemePreferenceProvider>
      <LanguageProvider>
        <ThemedRoot />
      </LanguageProvider>
    </ThemePreferenceProvider>
  );
}

function ThemedRoot() {
  const colorScheme = useColorScheme();

  // Match the native root view to the theme so screen transitions never flash white.
  useEffect(() => {
    SystemUI.setBackgroundColorAsync(Colors[colorScheme === 'dark' ? 'dark' : 'light'].background);
  }, [colorScheme]);

  return (
    <ThemeProvider value={colorScheme === 'dark' ? DarkTheme : DefaultTheme}>
      <AuthProvider>
        <RootNavigator />
      </AuthProvider>
    </ThemeProvider>
  );
}

function RootNavigator() {
  const { user, isLoading } = useAuth();
  const theme = useTheme();

  // Account edits open as sheets over the whole app, tab bar included.
  const sheetOptions = {
    presentation: 'formSheet' as const,
    sheetGrabberVisible: true,
    sheetAllowedDetents: 'fitToContents' as const,
    sheetCornerRadius: Spacing.four,
    contentStyle: { backgroundColor: theme.backgroundSheet },
  };

  // Keep the native splash screen up until the stored session has been restored.
  if (isLoading) return null;

  return (
    <>
      <Stack screenOptions={{ headerShown: false }}>
        <Stack.Protected guard={!!user} redirectTo="/login">
          <Stack.Screen name="(tabs)" />
          <Stack.Screen name="account/edit-name" options={sheetOptions} />
          <Stack.Screen name="account/edit-email" options={sheetOptions} />
          <Stack.Screen name="account/change-password" options={sheetOptions} />
        </Stack.Protected>
        <Stack.Protected guard={!user} redirectTo="/">
          <Stack.Screen name="(auth)" />
        </Stack.Protected>
      </Stack>
      <AnimatedSplashOverlay />
    </>
  );
}
