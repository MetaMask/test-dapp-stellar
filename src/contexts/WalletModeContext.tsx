/**
 * Context for selecting which MetaMask Stellar adapter interface is used.
 *
 * Two modes are available:
 * - `'sep043'` (default): `MetaMaskStellarAdapter` called directly (SEP-0043 interface).
 * - `'kit-module'`: `MetaMaskModule` called (Stellar Wallets Kit ModuleInterface).
 *
 * The selected mode is persisted in localStorage so the choice survives page reloads.
 * Switching modes causes WalletProvider to remount, which disconnects the current session.
 */
import { type FC, type ReactNode, createContext, useCallback, useContext, useState } from 'react';

export type WalletMode = 'sep043' | 'kit-module';

const STORAGE_KEY = 'stellarWalletMode';

type WalletModeContextValue = {
  mode: WalletMode;
  setMode: (mode: WalletMode) => void;
};

const WalletModeContext = createContext<WalletModeContextValue | undefined>(undefined);

function getInitialMode(): WalletMode {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved === 'kit-module') {
      return 'kit-module';
    }
  } catch {
    // ignore
  }
  return 'sep043';
}

export const WalletModeProvider: FC<{ children: ReactNode }> = ({ children }) => {
  const [mode, setModeState] = useState<WalletMode>(getInitialMode);

  const setMode = useCallback((next: WalletMode) => {
    try {
      localStorage.setItem(STORAGE_KEY, next);
    } catch {
      // ignore
    }
    setModeState(next);
  }, []);

  return <WalletModeContext.Provider value={{ mode, setMode }}>{children}</WalletModeContext.Provider>;
};

export function useWalletMode(): WalletModeContextValue {
  const ctx = useContext(WalletModeContext);
  if (!ctx) {
    throw new Error('useWalletMode must be used inside WalletModeProvider');
  }
  return ctx;
}
