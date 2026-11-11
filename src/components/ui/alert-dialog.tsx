import { Modal, Pressable, StyleSheet, View } from 'react-native';
import Animated, { Keyframe } from 'react-native-reanimated';

import { ThemedText } from '@/components/themed-text';
import { Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import type { AlertButton, AlertLayout } from '@/lib/alert-buttons';

const WIDTH = 300;
const RADIUS = 14;

// The card settles from slightly larger while the backdrop fades in, like an iOS alert.
const enter = new Keyframe({
  0: { opacity: 0, transform: [{ scale: 1.1 }] },
  100: { opacity: 1, transform: [{ scale: 1 }] },
}).duration(200);

type AlertDialogProps = AlertLayout & {
  visible: boolean;
  title: string;
  message?: string;
  onPress: (button: AlertButton) => void;
  /** Android back button. */
  onRequestClose: () => void;
};

/**
 * A centered alert drawn the way iOS draws one: a rounded card with a centered title and
 * message, and buttons separated by hairlines. Destructive actions are red, cancel is bold.
 */
export function AlertDialog({
  visible,
  title,
  message,
  layout,
  buttons,
  onPress,
  onRequestClose,
}: AlertDialogProps) {
  const theme = useTheme();
  const isRow = layout === 'row';

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onRequestClose}
      statusBarTranslucent
      navigationBarTranslucent>
      <View style={[styles.backdrop, { backgroundColor: theme.scrim }]}>
        {visible ? (
          <Animated.View
            entering={enter}
            accessibilityViewIsModal
            accessibilityRole="alert"
            style={[styles.card, { backgroundColor: theme.backgroundAlert }]}>
            <View style={styles.text}>
              <ThemedText style={styles.title}>{title}</ThemedText>
              {message ? <ThemedText style={styles.message}>{message}</ThemedText> : null}
            </View>
            <View style={[isRow ? styles.row : styles.column, { borderTopColor: theme.separator }]}>
              {buttons.map((button, index) => (
                <Pressable
                  key={`${index}-${button.text}`}
                  accessibilityRole="button"
                  accessibilityLabel={button.text}
                  onPress={() => onPress(button)}
                  style={({ pressed }) => [
                    styles.button,
                    isRow && styles.rowButton,
                    index > 0 &&
                      (isRow
                        ? [styles.rowDivider, { borderLeftColor: theme.separator }]
                        : [styles.columnDivider, { borderTopColor: theme.separator }]),
                    pressed && { backgroundColor: theme.separator },
                  ]}>
                  <ThemedText
                    style={[
                      styles.buttonLabel,
                      button.style === 'cancel' && styles.cancelLabel,
                      button.style === 'destructive' && { color: theme.destructive },
                    ]}>
                    {button.text}
                  </ThemedText>
                </Pressable>
              ))}
            </View>
          </Animated.View>
        ) : null}
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: Spacing.five,
  },
  card: {
    width: '100%',
    maxWidth: WIDTH,
    borderRadius: RADIUS,
    overflow: 'hidden',
  },
  text: {
    paddingTop: Spacing.four,
    paddingBottom: Spacing.three + Spacing.one,
    paddingHorizontal: Spacing.three,
    gap: Spacing.one,
  },
  title: {
    fontSize: 17,
    lineHeight: 22,
    fontWeight: 600,
    textAlign: 'center',
  },
  message: {
    fontSize: 13,
    lineHeight: 18,
    fontWeight: 400,
    textAlign: 'center',
  },
  row: {
    flexDirection: 'row',
    borderTopWidth: StyleSheet.hairlineWidth,
  },
  column: {
    borderTopWidth: StyleSheet.hairlineWidth,
  },
  button: {
    minHeight: 44,
    paddingVertical: Spacing.two + Spacing.half,
    paddingHorizontal: Spacing.two,
    alignItems: 'center',
    justifyContent: 'center',
  },
  rowButton: {
    flex: 1,
  },
  rowDivider: {
    borderLeftWidth: StyleSheet.hairlineWidth,
  },
  columnDivider: {
    borderTopWidth: StyleSheet.hairlineWidth,
  },
  buttonLabel: {
    fontSize: 17,
    lineHeight: 22,
    fontWeight: 400,
    textAlign: 'center',
  },
  cancelLabel: {
    fontWeight: 600,
  },
});
