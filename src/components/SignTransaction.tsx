import { Asset, Horizon, Operation, TransactionBuilder } from '@stellar/stellar-sdk';
import { type FC, useCallback, useState } from 'react';
import { STELLAR_NETWORKS } from '../config';
import { useNetwork } from '../contexts/NetworkContext';
import { useWalletState } from '../contexts/WalletContext';
import { useSignTransaction } from '../hooks/useSignTransaction';
import { dataTestIds } from '../test';
import { Button } from './Button';

const isHorizonNotFoundError = (error: unknown): boolean => {
  const horizonError = error as { response?: { status?: number }; status?: number };
  return horizonError.status === 404 || horizonError.response?.status === 404;
};

export const SignTransaction: FC = () => {
  const { address } = useWalletState();
  const signTransaction = useSignTransaction();
  const { selectedNetwork } = useNetwork();
  const [signedTransaction, setSignedTransaction] = useState<string | undefined>();
  const [xdr, setXdr] = useState<string>('');
  const [loading, setLoading] = useState(false);
  const [loadingExample, setLoadingExample] = useState(false);
  const [error, setError] = useState<string | undefined>();

  /**
   * Build a signable example transaction for the connected account.
   */
  const loadExampleXdr = useCallback(async () => {
    if (!address) {
      setError('Connect a Stellar account before loading an example transaction.');
      return;
    }

    const networkConfig = STELLAR_NETWORKS[selectedNetwork];

    setError(undefined);
    setSignedTransaction(undefined);
    setLoadingExample(true);
    try {
      const server = new Horizon.Server(networkConfig.horizonUrl, { allowHttp: true });
      const sourceAccount = await server.loadAccount(address);
      const transaction = new TransactionBuilder(sourceAccount, {
        fee: '100',
        networkPassphrase: networkConfig.networkPassphrase,
      })
        .addOperation(
          Operation.payment({
            destination: address,
            asset: Asset.native(),
            amount: '0.0000001',
          }),
        )
        .setTimeout(30)
        .build();

      setXdr(transaction.toXDR());
    } catch (err) {
      const message = isHorizonNotFoundError(err)
        ? `Connected account ${address} is not funded on ${networkConfig.name}. Fund it on this network before loading a signable example transaction.`
        : err instanceof Error
          ? err.message
          : 'Failed to load example transaction';
      console.error('Load example transaction error:', message);
      setError(message);
    } finally {
      setLoadingExample(false);
    }
  }, [address, selectedNetwork]);

  /**
   * Sign the transaction using the active wallet.
   */
  const signOnly = useCallback(async () => {
    if (!address || !xdr) {
      throw new Error('Wallet not connected or XDR missing');
    }

    setError(undefined);
    setSignedTransaction(undefined);
    setLoading(true);
    try {
      const result = await signTransaction(xdr, {
        networkPassphrase: STELLAR_NETWORKS[selectedNetwork].networkPassphrase,
        address,
      });
      if (result.error) {
        const errorMessage = result.error.code === -4 ? 'The user rejected this request.' : result.error.message;
        console.error('Sign transaction error:', errorMessage);
        setError(errorMessage);
        return;
      }
      setSignedTransaction(result.signedTxXdr);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown signing error';
      console.error('Error signing transaction:', message);
      setError(message);
    } finally {
      setLoading(false);
    }
  }, [address, signTransaction, xdr, selectedNetwork]);

  return (
    <div data-testid={dataTestIds.testPage.signTransaction.id}>
      <div style={{ marginBottom: '1rem' }}>
        <label htmlFor="xdr">Transaction XDR:</label>
        <textarea
          data-testid={dataTestIds.testPage.signTransaction.xdr}
          id="xdr"
          value={xdr}
          onChange={(e) => setXdr(e.target.value)}
          rows={4}
          style={{ width: '90%', padding: '0.5rem', marginTop: '0.5rem', resize: 'vertical' }}
          placeholder="Paste your base64 XDR transaction envelope here..."
        />
      </div>

      <div style={{ marginBottom: '1rem', fontSize: '0.875rem', color: '#666' }}>
        <strong>Network:</strong> {STELLAR_NETWORKS[selectedNetwork].name}
        <br />
        <strong>Passphrase:</strong> {STELLAR_NETWORKS[selectedNetwork].networkPassphrase}
      </div>

      <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap', marginBottom: '0.5rem' }}>
        <Button
          data-testid={dataTestIds.testPage.signTransaction.loadExampleXdr}
          onClick={loadExampleXdr}
          disabled={!address}
          loading={loadingExample}
          style={{ fontSize: '0.875rem' }}
        >
          Load Example XDR
        </Button>
        <Button
          data-testid={dataTestIds.testPage.signTransaction.signTransaction}
          onClick={signOnly}
          disabled={!address || !xdr}
          loading={loading}
        >
          Sign Transaction
        </Button>
      </div>

      {error && <p style={{ color: '#b71c1c', fontStyle: 'italic' }}>{error}</p>}

      {signedTransaction && (
        <>
          <h3>Signed transaction</h3>
          <pre data-testid={dataTestIds.testPage.signTransaction.signedTransaction} className="signedTransactions">
            {signedTransaction}
          </pre>
        </>
      )}
    </div>
  );
};
