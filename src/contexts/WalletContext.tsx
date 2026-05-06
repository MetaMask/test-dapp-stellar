import { FreighterModule } from '@creit.tech/stellar-wallets-kit/modules/freighter';
import { LobstrModule } from '@creit.tech/stellar-wallets-kit/modules/lobstr';
import { WalletConnectModule } from '@creit.tech/stellar-wallets-kit/modules/wallet-connect';
import { StellarWalletsKit } from '@creit.tech/stellar-wallets-kit/sdk';
import { KitEventType, type ModuleInterface, type Networks } from '@creit.tech/stellar-wallets-kit/types';
import { MetaMaskModule } from '@metamask/connect-stellar';
import { type FC, type ReactNode, createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { STELLAR_NETWORKS } from '../config';
import { useNetwork } from './NetworkContext';

const WC_PROJECT_ID = (import.meta.env.VITE_WALLETCONNECT_PROJECT_ID as string | undefined) ?? '';

const WC_METADATA = {
  name: 'MetaMask Stellar Test DApp',
  description: 'Test DApp for Stellar',
  url: typeof window !== 'undefined' ? window.location.origin : '',
  icons: [],
};

export interface WalletStateContextValue {
  address: string | null;
  connected: boolean;
  connecting: boolean;
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

export const WalletProvider: FC<{ children: ReactNode }> = ({ children }) => {
  const { selectedNetwork } = useNetwork();

  const [address, setAddress] = useState<string | null>(null);
  const [connected, setConnected] = useState(false);
  const [connecting, setConnecting] = useState(false);

  const resetState = useCallback((): void => {
    setAddress(null);
    setConnected(false);
  }, []);

  // Initialize kit once on mount
  // biome-ignore lint/correctness/useExhaustiveDependencies: <explanation>
  useEffect(() => {
    const modules: ModuleInterface[] = [
      new MetaMaskModule(),
      new FreighterModule(),
      new LobstrModule(),
      ...(WC_PROJECT_ID ? [new WalletConnectModule({ projectId: WC_PROJECT_ID, metadata: WC_METADATA })] : []),
    ];

    StellarWalletsKit.init({
      modules,
      network: STELLAR_NETWORKS[selectedNetwork].networkPassphrase as Networks,
    });

    // Track which wallet is selected
    const unsubWalletSelected = StellarWalletsKit.on(KitEventType.WALLET_SELECTED, (event) => {
      localStorage.setItem('lastWalletId', event.payload.id!);
    });

    const unsubState = StellarWalletsKit.on(KitEventType.STATE_UPDATED, (event) => {
      const addr = event.payload.address ?? null;
      setAddress(addr);
      setConnected(!!addr);
    });

    const unsubDisconnect = StellarWalletsKit.on(KitEventType.DISCONNECT, () => {
      localStorage.removeItem('lastWalletId');
      resetState();
    });

    // Restore connection on mount
    const lastWalletId = localStorage.getItem('lastWalletId');
    if (lastWalletId && modules.some((m) => m.productId === lastWalletId)) {
      try {
        StellarWalletsKit.setWallet(lastWalletId);
        StellarWalletsKit.fetchAddress()
          .then(({ address }) => {
            setAddress(address);
            setConnected(true);
          })
          .catch(() => {
            // Wallet session expired or not available
            localStorage.removeItem('lastWalletId');
          });
      } catch {
        localStorage.removeItem('lastWalletId');
      }
    }

    return () => {
      unsubWalletSelected();
      unsubState();
      unsubDisconnect();
    };
  }, []); // Mount only - no dependencies

  // Update network without reinitializing kit
  useEffect(() => {
    StellarWalletsKit.setNetwork(STELLAR_NETWORKS[selectedNetwork].networkPassphrase as Networks);
  }, [selectedNetwork]);

  const value = useMemo(
    () => ({
      address,
      connected,
      connecting,
      setAddress,
      setConnected,
      setConnecting,
    }),
    [address, connected, connecting],
  );

  return <WalletStateContext.Provider value={value}>{children}</WalletStateContext.Provider>;
};
