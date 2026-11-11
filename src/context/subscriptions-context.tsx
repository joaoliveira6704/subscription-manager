import { createContext, use, useCallback, useEffect, useState, type PropsWithChildren } from 'react';

import { useAuth } from '@/context/auth-context';
import {
  createSubscription,
  deleteSubscription,
  listSubscriptions,
  updateSubscription,
  type Subscription,
  type SubscriptionInput,
} from '@/lib/subscriptions';

type ActionResult = { error: string | null };

type SubscriptionsContextValue = {
  subscriptions: Subscription[];
  isLoading: boolean;
  /** Set when loading the list failed. */
  error: string | null;
  reload: () => Promise<void>;
  add: (input: SubscriptionInput) => Promise<ActionResult>;
  update: (id: number, input: SubscriptionInput) => Promise<ActionResult>;
  remove: (id: number) => Promise<ActionResult>;
};

const SubscriptionsContext = createContext<SubscriptionsContextValue | null>(null);
const SIGNED_OUT: ActionResult = { error: 'You are signed out' };
const LOAD_FAILED = 'Could not load your subscriptions';

type Loaded = { userId: number; subscriptions: Subscription[]; error: string | null };

async function load(userId: number): Promise<Loaded> {
  try {
    return { userId, subscriptions: await listSubscriptions(userId), error: null };
  } catch (loadError) {
    console.error('Failed to load subscriptions', loadError);
    return { userId, subscriptions: [], error: LOAD_FAILED };
  }
}

export function SubscriptionsProvider({ children }: PropsWithChildren) {
  const { user } = useAuth();
  const userId = user?.id ?? null;
  const [loaded, setLoaded] = useState<Loaded | null>(null);

  // Data is tagged with the user it belongs to, so after switching accounts the previous
  // user's list is never shown, even for a frame.
  const current = loaded && loaded.userId === userId ? loaded : null;
  const subscriptions = current?.subscriptions ?? [];
  const isLoading = userId !== null && current === null;
  const error = current?.error ?? null;

  const reload = useCallback(async () => {
    if (userId === null) return;
    setLoaded(await load(userId));
  }, [userId]);

  useEffect(() => {
    if (userId === null) return;
    let cancelled = false;
    load(userId).then((result) => {
      if (!cancelled) setLoaded(result);
    });
    return () => {
      cancelled = true;
    };
  }, [userId]);

  async function run(action: () => Promise<{ error: string | null }>): Promise<ActionResult> {
    try {
      const result = await action();
      if (result.error) return { error: result.error };
      await reload();
      return { error: null };
    } catch (actionError) {
      console.error('Subscription change failed', actionError);
      return { error: 'Could not save subscription' };
    }
  }

  const value: SubscriptionsContextValue = {
    subscriptions,
    isLoading,
    error,
    reload,
    add: (input) => (userId === null ? Promise.resolve(SIGNED_OUT) : run(() => createSubscription(userId, input))),
    update: (id, input) =>
      userId === null ? Promise.resolve(SIGNED_OUT) : run(() => updateSubscription(userId, id, input)),
    remove: (id) =>
      userId === null ? Promise.resolve(SIGNED_OUT) : run(() => deleteSubscription(userId, id)),
  };

  return <SubscriptionsContext value={value}>{children}</SubscriptionsContext>;
}

export function useSubscriptions() {
  const context = use(SubscriptionsContext);
  if (!context) throw new Error('useSubscriptions must be used inside a SubscriptionsProvider');
  return context;
}
