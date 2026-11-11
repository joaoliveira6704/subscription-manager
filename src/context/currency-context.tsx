import Storage from 'expo-sqlite/kv-store';
import { createContext, use, useState, type PropsWithChildren } from 'react';

import {
  parseCurrency,
  parseCurrencyMode,
  type CurrencyMode,
  type CurrencyPreferences,
} from '@/lib/currency-preference';
import type { Currency } from '@/lib/money';

const MODE_KEY = 'settings.currencyMode';
const CURRENCY_KEY = 'settings.currency';

type CurrencyContextValue = CurrencyPreferences & {
  setMode: (mode: CurrencyMode) => void;
  setCurrency: (currency: Currency) => void;
};

const CurrencyContext = createContext<CurrencyContextValue | null>(null);

function read<T>(key: string, parse: (value: unknown) => T): T {
  try {
    return parse(Storage.getItemSync(key));
  } catch (error) {
    console.error(`Failed to read ${key}`, error);
    return parse(null);
  }
}

function write(key: string, value: string) {
  try {
    Storage.setItemSync(key, value);
  } catch (error) {
    console.error(`Failed to save ${key}`, error);
  }
}

export function CurrencyProvider({ children }: PropsWithChildren) {
  const [mode, setModeState] = useState(() => read(MODE_KEY, parseCurrencyMode));
  const [currency, setCurrencyState] = useState(() => read(CURRENCY_KEY, parseCurrency));

  const value: CurrencyContextValue = {
    mode,
    currency,
    setMode(next) {
      setModeState(next);
      write(MODE_KEY, next);
    },
    setCurrency(next) {
      setCurrencyState(next);
      write(CURRENCY_KEY, next);
    },
  };

  return <CurrencyContext value={value}>{children}</CurrencyContext>;
}

export function useCurrency() {
  const context = use(CurrencyContext);
  if (!context) throw new Error('useCurrency must be used inside a CurrencyProvider');
  return context;
}
