import { Asset, Horizon, Operation, TransactionBuilder } from '@stellar/stellar-sdk';
import { useCallback, useState } from 'react';
import { STELLAR_NETWORKS } from '../config';
import { useNetwork } from '../contexts/NetworkContext';
import { useWalletState } from '../contexts/WalletContext';
import { useSignTransaction } from './useSignTransaction';

export interface TransferTokenResult {
  hash?: string;
  error?: { message: string; code?: number };
}

export interface TransferTokenParams {
  tokenCode: string;
  tokenIssuer: string;
  recipientAddress: string;
  amount: string;
}

/**
 * Hook to transfer any token on Stellar
 */
export function useTransferToken() {
  const { address } = useWalletState();
  const { selectedNetwork } = useNetwork();
  const signTransaction = useSignTransaction();
  const [loading, setLoading] = useState(false);

  const transfer = useCallback(
    async (params: TransferTokenParams): Promise<TransferTokenResult> => {
      if (!address) {
        throw new Error('Wallet not connected');
      }

      setLoading(true);
      try {
        const networkConfig = STELLAR_NETWORKS[selectedNetwork];
        const networkPassphrase = networkConfig.networkPassphrase as string;
        const horizonUrl = networkConfig.horizonUrl as string;

        const server = new Horizon.Server(horizonUrl, { allowHttp: true });

        // Get the source account
        let sourceAccount;
        try {
          sourceAccount = await server.loadAccount(address);
        } catch (err) {
          const error = err as any;
          if (error.status === 404 || error.response?.status === 404) {
            throw new Error(
              `Account not found on ${networkConfig.name}. Make sure your wallet is funded on this network.`,
            );
          }
          throw err;
        }

        // Build the payment transaction
        const txBuilder = new TransactionBuilder(sourceAccount, {
          fee: '100',
          networkPassphrase,
        });

        txBuilder.addOperation(
          Operation.payment({
            destination: params.recipientAddress,
            asset: new Asset(params.tokenCode, params.tokenIssuer),
            amount: params.amount,
          }),
        );

        const transaction = txBuilder.setTimeout(30).build();
        const xdr = transaction.toXDR();

        // Sign the transaction
        const signResult = await signTransaction(xdr, {
          networkPassphrase,
          address,
        });

        if (signResult.error || !signResult.signedTxXdr) {
          return {
            error: signResult.error || { message: 'Failed to sign transaction' },
          };
        }

        // Submit the transaction
        const submittedTx = TransactionBuilder.fromXDR(signResult.signedTxXdr, networkPassphrase);
        const response = await server.submitTransaction(submittedTx);

        return {
          hash: response.hash,
        };
      } catch (e) {
        const error = e instanceof Error ? e : new Error(String(e));
        console.error('Error transferring token:', error);
        return {
          error: {
            message: error.message,
            code: -1,
          },
        };
      } finally {
        setLoading(false);
      }
    },
    [address, selectedNetwork, signTransaction],
  );

  return {
    transfer,
    loading,
  };
}
