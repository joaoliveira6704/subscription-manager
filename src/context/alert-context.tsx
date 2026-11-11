import { createContext, use, useCallback, useState, type PropsWithChildren } from 'react';
import { Alert, Platform } from 'react-native';

import { AlertDialog } from '@/components/ui/alert-dialog';
import { useTranslation } from '@/context/language-context';
import { arrangeAlertButtons, type AlertButton, type AlertLayout } from '@/lib/alert-buttons';

export type { AlertButton } from '@/lib/alert-buttons';

type ShowAlert = (title: string, message?: string, buttons?: AlertButton[]) => void;

type Shown = AlertLayout & { title: string; message?: string };

const AlertContext = createContext<ShowAlert | null>(null);

/**
 * Alerts that look the same on every platform. iOS uses the native alert; Android and web draw
 * an iOS-style dialog instead of the Material one.
 */
export function AlertProvider({ children }: PropsWithChildren) {
  const { t } = useTranslation();
  // Kept after closing so the dialog's content stays put while it fades out.
  const [shown, setShown] = useState<Shown | null>(null);
  const [visible, setVisible] = useState(false);

  const show = useCallback<ShowAlert>(
    (title, message, buttons) => {
      if (Platform.OS === 'ios') {
        Alert.alert(title, message, buttons);
        return;
      }
      setShown({ title, message, ...arrangeAlertButtons(buttons, t('form.ok')) });
      setVisible(true);
    },
    [t]
  );

  function press(button: AlertButton | undefined) {
    setVisible(false);
    // Runs after closing, so a button may open a follow-up alert.
    button?.onPress?.();
  }

  return (
    <AlertContext value={show}>
      {children}
      {shown ? (
        <AlertDialog
          visible={visible}
          title={shown.title}
          message={shown.message}
          layout={shown.layout}
          buttons={shown.buttons}
          onPress={press}
          // Android back acts as cancel, like the system alert.
          onRequestClose={() => press(shown.buttons.find((button) => button.style === 'cancel'))}
        />
      ) : null}
    </AlertContext>
  );
}

/** Shows an alert: `alert(title, message?, buttons?)`, with the same buttons as `Alert.alert`. */
export function useAlert() {
  const context = use(AlertContext);
  if (!context) throw new Error('useAlert must be used inside AlertProvider');
  return context;
}
