import { StellarWalletsKit } from '@jsr/creit-tech__stellar-wallets-kit/sdk';
import { useCallback } from 'react';
import { useWalletState } from '../contexts/WalletContext';

/**
 * Hook exposing wallet state + connect/disconnect actions.
 */
export function useConnect() {
  const state = useWalletState();
  const { mode, adapter, setAddress, setConnected, setConnecting } = state;

  const connect = useCallback(async (): Promise<void> => {
    setConnecting(true);
    try {
      if (mode === 'sep043') {
        if (!adapter) {
          return;
        }
        const result = await adapter.requestAccess();
        if (result.error) {
          console.error('Connect error:', result.error);
          return;
        }
        setAddress(result.address);
        setConnected(true);
      } else {
        const { address: addr } = await StellarWalletsKit.authModal();
        setAddress(addr);
        setConnected(true);
      }
    } catch (e) {
      console.error('Connect error:', e);
    } finally {
      setConnecting(false);
    }
  }, [mode, adapter, setAddress, setConnected, setConnecting]);

  const disconnect = useCallback(async (): Promise<void> => {
    try {
      if (mode === 'sep043') {
        if (adapter) {
          await adapter.disconnect();
        }
      } else {
        await StellarWalletsKit.disconnect();
      }
    } catch (e) {
      console.error('Disconnect error:', e);
    }
    setAddress(null);
    setConnected(false);
  }, [mode, adapter, setAddress, setConnected]);

  return { ...state, connect, disconnect };
}
