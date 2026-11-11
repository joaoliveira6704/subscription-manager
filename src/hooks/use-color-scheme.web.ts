import { useSyncExternalStore } from 'react';
import { useColorScheme as useRNColorScheme } from 'react-native';

// Nothing to subscribe to: the value only flips once, from server to client rendering.
const subscribe = () => () => {};

/**
 * To support static rendering, this value needs to be re-calculated on the client side for web:
 * the server render (and hydration) uses 'light', then the client uses the real scheme.
 */
export function useColorScheme() {
  const hasHydrated = useSyncExternalStore(
    subscribe,
    () => true,
    () => false
  );
  const colorScheme = useRNColorScheme();

  return hasHydrated ? colorScheme : 'light';
}
