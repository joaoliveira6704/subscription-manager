import * as SecureStore from 'expo-secure-store';
import { createContext, use, useEffect, useState, type PropsWithChildren } from 'react';

import { createUser, getUserById, updatePassword, verifyUser, type User } from '@/lib/auth';
import { migrate } from '@/lib/db';

const SESSION_KEY = 'session.userId';

type ActionResult = { error: string | null };

type AuthContextValue = {
  user: User | null;
  isLoading: boolean;
  signIn: (email: string, password: string) => Promise<ActionResult>;
  signUp: (name: string, email: string, password: string) => Promise<ActionResult>;
  signOut: () => Promise<void>;
  resetPassword: (email: string, newPassword: string) => Promise<ActionResult>;
};

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: PropsWithChildren) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;

    (async () => {
      try {
        await migrate();
        const storedId = await SecureStore.getItemAsync(SESSION_KEY);
        if (storedId) {
          const storedUser = await getUserById(Number(storedId));
          if (!cancelled) setUser(storedUser);
          if (!storedUser) await SecureStore.deleteItemAsync(SESSION_KEY);
        }
      } catch (error) {
        console.error('Failed to restore session', error);
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, []);

  async function startSession(nextUser: User) {
    await SecureStore.setItemAsync(SESSION_KEY, String(nextUser.id));
    setUser(nextUser);
  }

  const value: AuthContextValue = {
    user,
    isLoading,
    async signIn(email, password) {
      const result = await verifyUser(email, password);
      if (result.error !== null) return { error: result.error };
      await startSession(result.data);
      return { error: null };
    },
    async signUp(name, email, password) {
      const result = await createUser(name, email, password);
      if (result.error !== null) return { error: result.error };
      await startSession(result.data);
      return { error: null };
    },
    async signOut() {
      await SecureStore.deleteItemAsync(SESSION_KEY);
      setUser(null);
    },
    async resetPassword(email, newPassword) {
      const result = await updatePassword(email, newPassword);
      return { error: result.error };
    },
  };

  return <AuthContext value={value}>{children}</AuthContext>;
}

export function useAuth() {
  const context = use(AuthContext);
  if (!context) throw new Error('useAuth must be used inside an AuthProvider');
  return context;
}
