/** Button layout rules for the in-app alert dialog, matching how iOS arranges alert buttons. */

export type AlertButtonStyle = 'default' | 'cancel' | 'destructive';

export type AlertButton = {
  text: string;
  style?: AlertButtonStyle;
  onPress?: () => void;
};

export type AlertLayout = {
  /** 'row' = two buttons side by side; 'column' = stacked full-width buttons. */
  layout: 'row' | 'column';
  buttons: AlertButton[];
};

/** Longer labels don't fit half the dialog's width, so the buttons stack instead. */
export const MAX_ROW_LABEL_LENGTH = 16;

/**
 * Orders the buttons the way iOS does: two short buttons sit side by side with cancel on the
 * left; otherwise (three or more, or a long label) they stack with cancel at the bottom. Only
 * the first cancel button is kept. With no buttons, a single OK button is shown.
 */
export function arrangeAlertButtons(
  buttons: readonly AlertButton[] | undefined,
  okLabel: string
): AlertLayout {
  if (!buttons?.length) return { layout: 'row', buttons: [{ text: okLabel }] };

  const cancel = buttons.find((button) => button.style === 'cancel');
  const rest = buttons.filter((button) => button.style !== 'cancel');
  const fitsRow = (button: AlertButton) => button.text.trim().length <= MAX_ROW_LABEL_LENGTH;

  const sideBySide = cancel ? [cancel, ...rest] : rest;
  if (sideBySide.length <= 2 && sideBySide.every(fitsRow)) {
    return { layout: 'row', buttons: sideBySide };
  }
  return { layout: 'column', buttons: cancel ? [...rest, cancel] : rest };
}
