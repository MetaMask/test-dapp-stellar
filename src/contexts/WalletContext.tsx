import { WalletConnectModule } from '@jsr/creit-tech__stellar-wallets-kit/modules/wallet-connect';
import { StellarWalletsKit } from '@jsr/creit-tech__stellar-wallets-kit/sdk';
import { KitEventType, type ModuleInterface, type Networks } from '@jsr/creit-tech__stellar-wallets-kit/types';
import { MetaMaskModule } from '@metamask/connect-stellar';
import type { MetaMaskStellarAdapter } from '@metamask/connect-stellar';
import {
  type FC,
  type ReactNode,
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import { STELLAR_NETWORKS } from '../config';
import { useNetwork } from './NetworkContext';
import { type WalletMode, useWalletMode } from './WalletModeContext';

// ── WalletConnect constants ──────────────────────────────────────────

const WC_PROJECT_ID = (import.meta.env.VITE_WALLETCONNECT_PROJECT_ID as string | undefined) ?? '';

const WC_METADATA = {
  name: 'MetaMask Stellar Test DApp',
  description: 'Test DApp for Stellar',
  url: typeof window !== 'undefined' ? window.location.origin : '',
  icons: [],
};

// ── Context type ─────────────────────────────────────────────────────

export interface WalletStateContextValue {
  mode: WalletMode;
  address: string | null;
  connected: boolean;
  connecting: boolean;
  adapter: MetaMaskStellarAdapter | null;
  setAddress: (addr: string | null) => void;
  setConnected: (v: boolean) => void;
  setConnecting: (v: boolean) => void;
}

const WalletStateContext = createContext<WalletStateContextValue | undefined>(undefined);

export function useWalletState(): WalletStateContextValue {
  const ctx = useContext(WalletStateContext);
  if (!ctx) {
    throw new Error('useWalletState must be used within WalletProvider');
  }
  return ctx;
}

// ── Provider ─────────────────────────────────────────────────────────

export const WalletProvider: FC<{ children: ReactNode }> = ({ children }) => {
  const { mode } = useWalletMode();
  const { selectedNetwork } = useNetwork();

  const [address, setAddress] = useState<string | null>(null);
  const [connected, setConnected] = useState(false);
  const [connecting, setConnecting] = useState(false);

  const resetState = useCallback((): void => {
    setAddress(null);
    setConnected(false);
  }, []);

  // ── SEP-0043: adapter ref ──────────────────────────────────────────
  const moduleRef = useRef<MetaMaskModule | null>(mode === 'sep043' ? new MetaMaskModule() : null);
  const adapter: MetaMaskStellarAdapter | null = mode === 'sep043' ? (moduleRef.current?.adapter ?? null) : null;

  // ── SEP-0043: disconnect on unmount ────────────────────────────────
  useEffect(() => {
    if (mode !== 'sep043' || !moduleRef.current) {
      return;
    }
    const mod = moduleRef.current;
    return () => {
      void mod.disconnect().catch(() => undefined);
    };
  }, [mode]);

  // ── SEP-0043: adapter events ───────────────────────────────────────
  useEffect(() => {
    if (mode !== 'sep043' || !adapter) {
      return;
    }
    const onConnect = (data: unknown): void => {
      setAddress(data as string);
      setConnected(true);
    };
    const onAccountsChanged = (data: unknown): void => {
      const addr = data as string | null;
      setAddress(addr);
      setConnected(!!addr);
    };
    const onDisconnect = (): void => resetState();

    adapter.on('connect', onConnect);
    adapter.on('accountsChanged', onAccountsChanged);
    adapter.on('disconnect', onDisconnect);
    return () => {
      adapter.off('connect', onConnect);
      adapter.off('accountsChanged', onAccountsChanged);
      adapter.off('disconnect', onDisconnect);
    };
  }, [mode, adapter, resetState]);

  // ── SWK: initialize kit ────────────────────────────────────────────
  useEffect(() => {
    if (mode !== 'kit-module') {
      return;
    }

    const modules: ModuleInterface[] = [
      new MetaMaskModule() as unknown as ModuleInterface,
      ...(WC_PROJECT_ID ? [new WalletConnectModule({ projectId: WC_PROJECT_ID, metadata: WC_METADATA })] : []),
    ];

    StellarWalletsKit.init({
      modules,
      network: STELLAR_NETWORKS[selectedNetwork].networkPassphrase as Networks,
    });

    const unsubState = StellarWalletsKit.on(KitEventType.STATE_UPDATED, (event) => {
      const addr = event.payload.address ?? null;
      setAddress(addr);
      setConnected(!!addr);
    });

    const unsubDisconnect = StellarWalletsKit.on(KitEventType.DISCONNECT, () => {
      resetState();
    });

    return () => {
      unsubState();
      unsubDisconnect();
      void StellarWalletsKit.disconnect().catch(() => undefined);
    };
  }, [mode, selectedNetwork, resetState]);

  // ── Context value ──────────────────────────────────────────────────
  const value = useMemo(
    () => ({
      mode,
      address,
      connected,
      connecting,
      adapter,
      setAddress,
      setConnected,
      setConnecting,
    }),
    [mode, address, connected, connecting, adapter],
  );

  return <WalletStateContext.Provider value={value}>{children}</WalletStateContext.Provider>;
};
