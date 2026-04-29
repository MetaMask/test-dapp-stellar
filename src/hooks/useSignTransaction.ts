import { StellarWalletsKit } from '@jsr/creit-tech__stellar-wallets-kit/sdk';
import type { StellarAdapterError } from '@metamask/connect-stellar';
import { useCallback } from 'react';
import { useWalletState } from '../contexts/WalletContext';

/**
 * Hook returning a signTransaction function that dispatches to the active adapter.
 */
export function useSignTransaction() {
  const { mode, adapter } = useWalletState();

  return useCallback(
    async (
      xdr: string,
      opts: { networkPassphrase: string; address: string },
    ): Promise<{ signedTxXdr?: string; error?: StellarAdapterError }> => {
      try {
        if (mode === 'sep043') {
          if (!adapter) {
            return { error: { message: 'Adapter not available', code: -3 } };
          }
          return adapter.signTransaction(xdr, opts);
        }
        const { signedTxXdr } = await StellarWalletsKit.signTransaction(xdr, opts);
        return { signedTxXdr };
      } catch (e: unknown) {
        const err = e as { message?: string; code?: number };
        return { error: { message: err.message ?? 'Unknown error', code: err.code ?? -1 } };
      }
    },
    [mode, adapter],
  );
}
