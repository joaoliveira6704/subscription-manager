import { Image } from 'expo-image';
import { SymbolView } from 'expo-symbols';
import { useState } from 'react';
import { StyleSheet, View } from 'react-native';

import { useTheme } from '@/hooks/use-theme';
import { CATEGORY_ICONS, type Category } from '@/lib/categories';
import { logoUrlFor } from '@/lib/logos';

const SIZE = 36;

type SubscriptionAvatarProps = {
  name: string;
  category: Category;
};

/**
 * The brand's logo when we recognise the name (e.g. Netflix, Claude), cached on disk; otherwise,
 * or if the logo fails to load (offline, not found), the category icon.
 */
export function SubscriptionAvatar({ name, category }: SubscriptionAvatarProps) {
  const theme = useTheme();
  const url = logoUrlFor(name);
  // Remember which URL failed, so renaming the subscription tries again.
  const [failedUrl, setFailedUrl] = useState<string | null>(null);

  if (url && url !== failedUrl) {
    return (
      <View style={[styles.circle, styles.logoCircle]}>
        <Image
          source={{ uri: url }}
          style={styles.logo}
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
    <View style={[styles.circle, { backgroundColor: theme.backgroundSelected }]}>
      <SymbolView
        name={{ ios: icon.ios, android: icon.android, web: icon.android }}
        size={20}
        tintColor={theme.text}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  circle: {
    width: SIZE,
    height: SIZE,
    borderRadius: SIZE / 2,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  // Shows through transparent logos, which are made for a white background.
  logoCircle: {
    backgroundColor: 'white',
  },
  // Fills the whole circle edge to edge; the circle clips the corners.
  logo: {
    width: SIZE,
    height: SIZE,
  },
});
