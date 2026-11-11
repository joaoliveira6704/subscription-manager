import { Image } from 'expo-image';
import { SymbolView } from 'expo-symbols';
import { useState } from 'react';
import { StyleSheet, View } from 'react-native';

import { useTheme } from '@/hooks/use-theme';
import { CATEGORY_ICONS, type Category } from '@/lib/categories';
import { logoUrlFor } from '@/lib/logos';

type SubscriptionAvatarProps = {
  name: string;
  category: Category;
  /** Diameter in points; defaults to the list size. */
  size?: number;
};

/**
 * The brand's logo when we recognise the name (e.g. Netflix, Claude), cached on disk; otherwise,
 * or if the logo fails to load (offline, not found), the category icon.
 */
export function SubscriptionAvatar({ name, category, size = 36 }: SubscriptionAvatarProps) {
  const theme = useTheme();
  const url = logoUrlFor(name);
  // Remember which URL failed, so renaming the subscription tries again.
  const [failedUrl, setFailedUrl] = useState<string | null>(null);
  const circle = { width: size, height: size, borderRadius: size / 2 };

  if (url && url !== failedUrl) {
    return (
      <View style={[styles.circle, circle, styles.logoCircle]}>
        <Image
          source={{ uri: url }}
          style={{ width: size, height: size }}
          contentFit="cover"
          cachePolicy="disk"
          transition={150}
          accessibilityIgnoresInvertColors
          onError={() => setFailedUrl(url)}
        />
      </View>
    );
  }

  const icon = CATEGORY_ICONS[category];
  return (
    <View style={[styles.circle, circle, { backgroundColor: theme.backgroundSelected }]}>
      <SymbolView
        name={{ ios: icon.ios, android: icon.android, web: icon.android }}
        size={Math.round(size * 0.55)}
        tintColor={theme.text}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  circle: {
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  // Shows through transparent logos, which are made for a white background.
  logoCircle: {
    backgroundColor: 'white',
  },
});
