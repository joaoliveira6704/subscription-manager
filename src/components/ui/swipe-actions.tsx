import * as Haptics from 'expo-haptics';
import { SymbolView, type SymbolViewProps } from 'expo-symbols';
import { useRef, type PropsWithChildren } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import ReanimatedSwipeable, {
  type SwipeableMethods,
} from 'react-native-gesture-handler/ReanimatedSwipeable';

import { ERROR_COLOR } from '@/components/ui/text-field';
import { Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

const BUTTON_SIZE = 52;
const SWIPE_START_DISTANCE = 24;
// The button plus the gap between it and the card.
const ACTION_WIDTH = BUTTON_SIZE + Spacing.three;

type SwipeActionsProps = PropsWithChildren<{
  /** Accessibility label for the delete button, e.g. "Delete". */
  deleteLabel: string;
  /** Swipe left: called when the revealed delete button is tapped. */
  onDelete: () => void;
  /** Accessibility label for the edit button, e.g. "Edit". */
  editLabel: string;
  /** Swipe right: called when the revealed edit button is tapped. */
  onEdit: () => void;
}>;

/**
 * A card that slides as one piece (keeping its rounded shape): swipe left to reveal a round red
 * delete button, swipe right to reveal a round edit button.
 */
export function SwipeActions({
  deleteLabel,
  onDelete,
  editLabel,
  onEdit,
  children,
}: SwipeActionsProps) {
  const theme = useTheme();
  const swipeable = useRef<SwipeableMethods>(null);

  function action(
    side: 'left' | 'right',
    label: string,
    icon: SymbolViewProps['name'],
    background: string,
    tint: string,
    onPress: () => void
  ) {
    return (
      <View style={[styles.actions, side === 'left' ? styles.actionsLeft : styles.actionsRight]}>
        <Pressable
          onPress={() => {
            swipeable.current?.close();
            onPress();
          }}
          accessibilityRole="button"
          accessibilityLabel={label}
          hitSlop={Spacing.two}
          style={({ pressed }) => [
            styles.button,
            { backgroundColor: background },
            pressed && styles.pressed,
          ]}>
          <SymbolView name={icon} size={22} tintColor={tint} />
        </Pressable>
      </View>
    );
  }

  return (
    <ReanimatedSwipeable
      ref={swipeable}
      friction={2}
      leftThreshold={ACTION_WIDTH / 2}
      rightThreshold={ACTION_WIDTH / 2}
      overshootLeft={false}
      overshootRight={false}
      // Only start on a clearly sideways drag, so a vertical scroll that drifts a little
      // doesn't open the card.
      dragOffsetFromLeft={SWIPE_START_DISTANCE}
      dragOffsetFromRight={-SWIPE_START_DISTANCE}
      // Let the card slide into the page margin instead of being clipped at the content edge.
      containerStyle={styles.container}
      onSwipeableWillOpen={() => Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light)}
      renderLeftActions={() =>
        action(
          'left',
          editLabel,
          { ios: 'pencil', android: 'edit', web: 'edit' },
          theme.text,
          theme.background,
          onEdit
        )
      }
      renderRightActions={() =>
        action(
          'right',
          deleteLabel,
          { ios: 'trash', android: 'delete', web: 'delete' },
          ERROR_COLOR,
          'white',
          onDelete
        )
      }>
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
    justifyContent: 'center',
  },
  actionsLeft: {
    alignItems: 'flex-start',
  },
  actionsRight: {
    alignItems: 'flex-end',
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
