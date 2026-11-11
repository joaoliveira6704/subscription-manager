import { BlurTargetView, BlurView } from 'expo-blur';
import * as Haptics from 'expo-haptics';
import { usePathname } from 'expo-router';
import {
  TabList,
  TabSlot,
  TabTrigger,
  Tabs,
  type TabListProps,
  type TabTriggerSlotProps,
} from 'expo-router/ui';
import { SymbolView, type AndroidSymbol } from 'expo-symbols';
import { useRef, useState, type ComponentRef, type RefObject } from 'react';
import { Pressable, StyleSheet, View, useColorScheme, type LayoutChangeEvent } from 'react-native';
import Animated, { useAnimatedStyle, withTiming } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { ThemedText } from '@/components/themed-text';
import { Colors, Spacing } from '@/constants/theme';
import { useTranslation } from '@/context/language-context';
import type { TranslationKey } from '@/lib/i18n';

type TabConfig = {
  name: string;
  href: '/' | '/subscriptions' | '/analytics' | '/profile';
  label: TranslationKey;
  icon: AndroidSymbol;
};

const TABS: TabConfig[] = [
  { name: 'index', href: '/', label: 'tabs.home', icon: 'home' },
  { name: 'subscriptions', href: '/subscriptions', label: 'tabs.subscriptions', icon: 'sell' },
  { name: 'analytics', href: '/analytics', label: 'tabs.analytics', icon: 'analytics' },
  { name: 'profile', href: '/profile', label: 'tabs.profile', icon: 'person' },
];

const BAR_PADDING = Spacing.one;
const INDICATOR_DURATION = 220;

/**
 * Android tab bar: a floating, blurred pill with a sliding highlight behind the active tab.
 * iOS keeps the native tabs in `app-tabs.tsx`; Metro picks this file on Android only.
 */
export default function AppTabs() {
  const blurTarget = useRef<ComponentRef<typeof View>>(null);
  const background = Colors[useColorScheme() === 'dark' ? 'dark' : 'light'].background;
  const { t } = useTranslation();

  return (
    <Tabs>
      {/* Explicit background: while switching tabs the old screen unmounts before the new one
          paints, and without it the blur samples the empty (white) window for a frame. */}
      <BlurTargetView ref={blurTarget} style={[styles.fill, { backgroundColor: background }]}>
        <TabSlot style={[styles.fill, { backgroundColor: background }]} />
      </BlurTargetView>
      <TabList asChild>
        <FloatingTabBar blurTarget={blurTarget}>
          {TABS.map((tab) => (
            <TabTrigger key={tab.name} name={tab.name} href={tab.href} asChild>
              <TabButton label={t(tab.label)} icon={tab.icon} />
            </TabTrigger>
          ))}
        </FloatingTabBar>
      </TabList>
    </Tabs>
  );
}

type FloatingTabBarProps = TabListProps & {
  blurTarget: RefObject<ComponentRef<typeof View> | null>;
};

// TabList injects `style` (a row layout). It is ignored on purpose: in a row the pill
// shrinks to its content and the flex:1 tabs collapse to zero width.
function FloatingTabBar({ blurTarget, children, style: _style, ...rest }: FloatingTabBarProps) {
  const scheme = useColorScheme() === 'dark' ? 'dark' : 'light';
  const colors = Colors[scheme];
  const insets = useSafeAreaInsets();
  const pathname = usePathname();
  const [barWidth, setBarWidth] = useState(0);

  const activeIndex = Math.max(
    0,
    TABS.findIndex((tab) =>
      tab.href === '/' ? pathname === '/' : pathname.startsWith(tab.href)
    )
  );
  const itemWidth = barWidth > 0 ? (barWidth - BAR_PADDING * 2) / TABS.length : 0;

  const indicatorStyle = useAnimatedStyle(() => ({
    width: itemWidth,
    transform: [
      { translateX: withTiming(activeIndex * itemWidth, { duration: INDICATOR_DURATION }) },
    ],
  }));

  const onLayout = (event: LayoutChangeEvent) => setBarWidth(event.nativeEvent.layout.width);

  return (
    <View
      {...rest}
      pointerEvents="box-none"
      style={[styles.barContainer, { paddingBottom: insets.bottom + Spacing.two }]}>
      <View style={styles.barShadow} onLayout={onLayout}>
        <BlurView
          blurTarget={blurTarget}
          blurMethod="dimezisBlurViewSdk31Plus"
          intensity={60}
          tint={scheme}
          style={[
            styles.bar,
            {
              backgroundColor:
                scheme === 'dark' ? 'rgba(33, 34, 37, 0.72)' : 'rgba(240, 240, 243, 0.78)',
            },
          ]}>
          {itemWidth > 0 ? (
            <Animated.View
              pointerEvents="none"
              style={[
                styles.indicator,
                { backgroundColor: colors.backgroundSelected },
                indicatorStyle,
              ]}
            />
          ) : null}
          {children}
        </BlurView>
      </View>
    </View>
  );
}

type TabButtonProps = TabTriggerSlotProps & {
  label: string;
  icon: AndroidSymbol;
};

// `ref` is dropped on purpose: TabTriggerSlotProps types it for the legacy View class,
// which doesn't match RN 0.88's Pressable ref, and the trigger doesn't need it.
function TabButton({ label, icon, isFocused, onPress, ref: _ref, ...rest }: TabButtonProps) {
  const scheme = useColorScheme() === 'dark' ? 'dark' : 'light';
  const colors = Colors[scheme];
  const color = isFocused ? colors.text : colors.textSecondary;

  return (
    <Pressable
      {...rest}
      onPress={(event) => {
        if (!isFocused) Haptics.selectionAsync();
        onPress?.(event);
      }}
      accessibilityRole="tab"
      accessibilityState={{ selected: isFocused }}
      accessibilityLabel={label}
      style={({ pressed }) => [styles.tab, pressed && styles.pressed]}>
      <SymbolView name={{ android: icon, ios: 'circle', web: icon }} size={24} tintColor={color} />
      <ThemedText
        numberOfLines={1}
        style={[styles.label, { color }, isFocused && styles.labelFocused]}>
        {label}
      </ThemedText>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  fill: {
    flex: 1,
  },
  barContainer: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    flexDirection: 'column',
    paddingHorizontal: Spacing.three,
  },
  barShadow: {
    alignSelf: 'stretch',
    borderRadius: Spacing.five,
    elevation: 8,
    shadowColor: '#000',
  },
  bar: {
    width: '100%',
    flexDirection: 'row',
    padding: BAR_PADDING,
    borderRadius: Spacing.five,
    overflow: 'hidden',
  },
  indicator: {
    position: 'absolute',
    top: BAR_PADDING,
    bottom: BAR_PADDING,
    left: BAR_PADDING,
    borderRadius: Spacing.five - BAR_PADDING,
  },
  tab: {
    flex: 1,
    minHeight: 56,
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.half,
    paddingVertical: Spacing.two,
  },
  pressed: {
    opacity: 0.7,
  },
  label: {
    fontSize: 11,
    lineHeight: 14,
    fontWeight: 500,
  },
  labelFocused: {
    fontWeight: 700,
  },
});
