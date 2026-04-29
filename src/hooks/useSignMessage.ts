import { StellarWalletsKit } from '@jsr/creit-tech__stellar-wallets-kit/sdk';
import { useCallback } from 'react';

export function useSignMessage() {
  return useCallback(
    async (
      message: string,
      opts: { address: string },
    ): Promise<{ signedMessage?: string; error?: { message: string; code: number } }> => {
      try {
        const { signedMessage } = await StellarWalletsKit.signMessage(message, opts);
        return { signedMessage };
      } catch (e: unknown) {
        const err = e as { message?: string; code?: number };
        return { error: { message: err.message ?? 'Unknown error', code: err.code ?? -1 } };
      }
    },
    [],
  );
}
