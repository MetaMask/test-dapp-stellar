import { StellarWalletsKit } from '@jsr/creit-tech__stellar-wallets-kit/sdk';
import type { StellarAdapterError } from '@metamask/connect-stellar';
import { useCallback } from 'react';
import { useWalletState } from '../contexts/WalletContext';

/**
 * Hook returning a signAuthEntry function that dispatches to the active adapter.
 */
export function useSignAuthEntry() {
  const { mode, adapter } = useWalletState();

  return useCallback(
    async (
      authEntry: string,
      opts: { networkPassphrase: string; address: string },
    ): Promise<{ signedAuthEntry?: string | null; error?: StellarAdapterError }> => {
      try {
        if (mode === 'sep043') {
          if (!adapter) {
            return { error: { message: 'Adapter not available', code: -3 } };
          }
          return adapter.signAuthEntry(authEntry, opts);
        }
        const { signedAuthEntry: signed } = await StellarWalletsKit.signAuthEntry(authEntry, opts);
        return { signedAuthEntry: signed };
      } catch (e: unknown) {
        const err = e as { message?: string; code?: number };
        return { error: { message: err.message ?? 'Unknown error', code: err.code ?? -1 } };
      }
    },
    [mode, adapter],
  );
}
