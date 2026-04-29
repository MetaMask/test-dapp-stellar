import { StellarWalletsKit } from '@jsr/creit-tech__stellar-wallets-kit/sdk';
import { useCallback } from 'react';
import { useWalletState } from '../contexts/WalletContext';

export function useConnect() {
  const state = useWalletState();
  const { setAddress, setConnected, setConnecting } = state;

  const connect = useCallback(async (): Promise<void> => {
    setConnecting(true);
    try {
      const { address } = await StellarWalletsKit.authModal();
      setAddress(address);
      setConnected(true);
    } catch (e) {
      console.error('Connect error:', e);
    } finally {
      setConnecting(false);
    }
  }, [setAddress, setConnected, setConnecting]);

  const disconnect = useCallback(async (): Promise<void> => {
    try {
      await StellarWalletsKit.disconnect();
    } catch (e) {
      console.error('Disconnect error:', e);
    }
    setAddress(null);
    setConnected(false);
  }, [setAddress, setConnected]);

  return { ...state, connect, disconnect };
}
