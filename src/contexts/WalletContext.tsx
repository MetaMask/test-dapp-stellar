import { FreighterModule } from '@creit.tech/stellar-wallets-kit/modules/freighter';
import { LobstrModule } from '@creit.tech/stellar-wallets-kit/modules/lobstr';
import { WalletConnectModule } from '@creit.tech/stellar-wallets-kit/modules/wallet-connect';
import { StellarWalletsKit } from '@creit.tech/stellar-wallets-kit/sdk';
import { KitEventType, type ModuleInterface, type Networks } from '@creit.tech/stellar-wallets-kit/types';
import { MetaMaskModule } from '@metamask/connect-stellar';
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

const WALLETCONNECT_PROJECT_ID = (import.meta.env.VITE_WALLETCONNECT_PROJECT_ID as string | undefined) ?? '';

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
  error: string | null;
  setAddress: (addr: string | null) => void;
  setConnected: (v: boolean) => void;
  setConnecting: (v: boolean) => void;
  setError: (v: string | null) => void;
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
  const [error, setError] = useState<string | null>(null);
  const addressRef = useRef<string | null>(null);

  useEffect(() => {
    addressRef.current = address;
  }, [address]);

  const resetState = useCallback((): void => {
    addressRef.current = null;
    setAddress(null);
    setConnected(false);
    setError(null);
  }, []);

  const isMainnet = selectedNetwork === 'pubnet';

  // Initialize kit on mount and when switching to/from mainnet (WalletConnect is mainnet-only)
  // biome-ignore lint/correctness/useExhaustiveDependencies: selectedNetwork sync is handled by the effect below
  useEffect(() => {
    const modules: ModuleInterface[] = [
      new MetaMaskModule(),
      new FreighterModule(),
      new LobstrModule(),
      ...(isMainnet ? [new WalletConnectModule({ projectId: WALLETCONNECT_PROJECT_ID, metadata: WC_METADATA })] : []),
    ];

    StellarWalletsKit.init({
      modules,
      network: STELLAR_NETWORKS[selectedNetwork].networkPassphrase as Networks,
    });

    // Stellar Wallets Kit 2.1 does not forward a selected module's onChange
    // callback. Subscribe to each selected module here so wallets such as
    // MetaMask can keep the dapp's active address in sync.
    const modulesListeningForChanges = new WeakSet<ModuleInterface>();
    const subscribeToSelectedWalletChanges = (): void => {
      let selectedModule: ModuleInterface | undefined;
      try {
        selectedModule = StellarWalletsKit.selectedModule;
      } catch {
        // No wallet has been selected yet.
        return;
      }

      if (!selectedModule?.onChange || modulesListeningForChanges.has(selectedModule)) {
        return;
      }

      modulesListeningForChanges.add(selectedModule);
      selectedModule.onChange((event) => {
        // The kit cannot unsubscribe from onChange, so ignore events from a
        // module that is no longer selected.
        try {
          if (StellarWalletsKit.selectedModule !== selectedModule) {
            return;
          }
        } catch {
          return;
        }

        // Do not establish a connection from an unsolicited wallet event.
        if (event.error || !event.address || !addressRef.current) {
          return;
        }

        setAddress(event.address);
        setConnected(true);
      });
    };

    // Track which wallet is selected
    const unsubWalletSelected = StellarWalletsKit.on(KitEventType.WALLET_SELECTED, (event) => {
      if (event.payload.id) {
        localStorage.setItem('lastWalletId', event.payload.id);
      }
      subscribeToSelectedWalletChanges();
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

    // Also handle a module selected before this effect subscribed to kit events.
    subscribeToSelectedWalletChanges();

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
    } else if (lastWalletId) {
      localStorage.removeItem('lastWalletId');
    }

    return () => {
      unsubWalletSelected();
      unsubState();
      unsubDisconnect();
    };
  }, [isMainnet]);

  // Update network without reinitializing kit
  useEffect(() => {
    const networkPassphrase = STELLAR_NETWORKS[selectedNetwork].networkPassphrase;
    StellarWalletsKit.setNetwork(networkPassphrase as Networks);
  }, [selectedNetwork]);

  const value = useMemo(
    () => ({
      address,
      connected,
      connecting,
      error,
      setAddress,
      setConnected,
      setConnecting,
      setError,
    }),
    [address, connected, connecting, error],
  );

  return <WalletStateContext.Provider value={value}>{children}</WalletStateContext.Provider>;
};
