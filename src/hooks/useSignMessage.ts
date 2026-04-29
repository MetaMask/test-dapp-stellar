import { StellarWalletsKit } from '@jsr/creit-tech__stellar-wallets-kit/sdk';
import type { StellarAdapterError } from '@metamask/connect-stellar';
import { useCallback } from 'react';
import { useWalletState } from '../contexts/WalletContext';

/**
 * Hook returning a signMessage function that dispatches to the active adapter.
 */
export function useSignMessage() {
  const { mode, adapter } = useWalletState();

  return useCallback(
    async (
      message: string,
      opts: { address: string },
    ): Promise<{ signedMessage?: string; error?: StellarAdapterError }> => {
      try {
        if (mode === 'sep043') {
          if (!adapter) {
            return { error: { message: 'Adapter not available', code: -3 } };
          }
          return adapter.signMessage(message, opts);
        }
        const { signedMessage: signed } = await StellarWalletsKit.signMessage(message, opts);
        return { signedMessage: signed };
      } catch (e: unknown) {
        const err = e as { message?: string; code?: number };
        return { error: { message: err.message ?? 'Unknown error', code: err.code ?? -1 } };
      }
    },
    [mode, adapter],
  );
}
