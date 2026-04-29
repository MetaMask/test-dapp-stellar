import { StellarWalletsKit } from '@jsr/creit-tech__stellar-wallets-kit/sdk';
import { useCallback } from 'react';

export function useSignTransaction() {
  return useCallback(
    async (
      xdr: string,
      opts: { networkPassphrase: string; address: string },
    ): Promise<{ signedTxXdr?: string; error?: { message: string; code: number } }> => {
      try {
        const { signedTxXdr } = await StellarWalletsKit.signTransaction(xdr, opts);
        return { signedTxXdr };
      } catch (e: unknown) {
        const err = e as { message?: string; code?: number };
        return { error: { message: err.message ?? 'Unknown error', code: err.code ?? -1 } };
      }
    },
    [],
  );
}
