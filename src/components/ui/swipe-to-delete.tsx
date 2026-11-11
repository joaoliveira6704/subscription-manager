import * as Haptics from 'expo-haptics';
import { SymbolView } from 'expo-symbols';
import { useRef, type PropsWithChildren } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import ReanimatedSwipeable, {
  type SwipeableMethods,
} from 'react-native-gesture-handler/ReanimatedSwipeable';

import { ERROR_COLOR } from '@/components/ui/text-field';
import { Spacing } from '@/constants/theme';

const BUTTON_SIZE = 52;
const SWIPE_START_DISTANCE = 24;
// The button plus the gap between it and the card.
const ACTION_WIDTH = BUTTON_SIZE + Spacing.three;

type SwipeToDeleteProps = PropsWithChildren<{
  /** Accessibility label for the revealed button, e.g. "Delete". */
  label: string;
  /** Called when the revealed button is tapped; the card slides back first. */
  onDelete: () => void;
}>;

/**
 * Swipe a card to the left: the whole card slides over as one piece (keeping its rounded
 * shape) and a round red delete button appears beside it.
 */
export function SwipeToDelete({ label, onDelete, children }: SwipeToDeleteProps) {
  const swipeable = useRef<SwipeableMethods>(null);

  return (
    <ReanimatedSwipeable
      ref={swipeable}
      friction={2}
      rightThreshold={ACTION_WIDTH / 2}
      overshootRight={false}
      // Only start on a clearly sideways drag, so a vertical scroll that drifts a little
      // doesn't open the card.
      dragOffsetFromRight={-SWIPE_START_DISTANCE}
      // Let the card slide into the page margin instead of being clipped at the content edge.
      containerStyle={styles.container}
      onSwipeableWillOpen={() => Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light)}
      renderRightActions={() => (
        <View style={styles.actions}>
          <Pressable
            onPress={() => {
              swipeable.current?.close();
              onDelete();
            }}
            accessibilityRole="button"
            accessibilityLabel={label}
            hitSlop={Spacing.two}
            style={({ pressed }) => [
              styles.button,
              { backgroundColor: ERROR_COLOR },
              pressed && styles.pressed,
            ]}>
            <SymbolView
              name={{ ios: 'trash', android: 'delete', web: 'delete' }}
              size={22}
              tintColor="white"
            />
          </Pressable>
        </View>
      )}>
      {children}
    </ReanimatedSwipeable>
  );
}

const styles = StyleSheet.create({
  container: {
    overflow: 'visible',
  },
  actions: {
    width: ACTION_WIDTH,
    alignItems: 'flex-end',
    justifyContent: 'center',
  },
  button: {
    width: BUTTON_SIZE,
    height: BUTTON_SIZE,
    borderRadius: BUTTON_SIZE / 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  pressed: {
    opacity: 0.8,
    transform: [{ scale: 0.94 }],
  },
});
