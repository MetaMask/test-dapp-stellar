import { StellarWalletsKit } from '@creit.tech/stellar-wallets-kit/sdk';
import { useCallback } from 'react';
import { useWalletState } from '../contexts/WalletContext';

export function useConnect() {
  const state = useWalletState();
  const { setAddress, setConnected, setConnecting, setError } = state;

  const getErrorMessage = useCallback((error: unknown): string => {
    if (typeof error === 'object' && error !== null) {
      const err = error as { message?: string; error?: { message?: string } };
      return err.error?.message ?? err.message ?? 'Unknown wallet error';
    }

    return typeof error === 'string' ? error : 'Unknown wallet error';
  }, []);

  const connect = useCallback(async (): Promise<void> => {
    setConnecting(true);
    setError(null);
    try {
      const { address } = await StellarWalletsKit.authModal();
      setAddress(address);
      setConnected(true);
    } catch (e) {
      console.error('Connect error:', e);
      setError(getErrorMessage(e));
    } finally {
      setConnecting(false);
    }
  }, [getErrorMessage, setAddress, setConnected, setConnecting, setError]);

  const disconnect = useCallback(async (): Promise<void> => {
    try {
      await StellarWalletsKit.disconnect();
    } catch (e) {
      console.error('Disconnect error:', e);
    }
    setAddress(null);
    setConnected(false);
    setError(null);
  }, [setAddress, setConnected, setError]);

  return { ...state, connect, disconnect };
}
