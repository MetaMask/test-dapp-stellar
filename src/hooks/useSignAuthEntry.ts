import { StellarWalletsKit } from '@creit.tech/stellar-wallets-kit/sdk';
import { useCallback } from 'react';

export function useSignAuthEntry() {
  return useCallback(
    async (
      authEntry: string,
      opts: { networkPassphrase: string; address: string },
    ): Promise<{ signedAuthEntry?: string | null; error?: { message: string; code: number } }> => {
      try {
        const { signedAuthEntry } = await StellarWalletsKit.signAuthEntry(authEntry, opts);
        return { signedAuthEntry };
      } catch (e: unknown) {
        const err = e as { message?: string; code?: number };
        return { error: { message: err.message ?? 'Unknown error', code: err.code ?? -1 } };
      }
    },
    [],
  );
}
