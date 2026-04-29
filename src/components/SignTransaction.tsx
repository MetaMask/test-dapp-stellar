import { type FC, useCallback, useState } from 'react';
import { STELLAR_NETWORKS } from '../config';
import { useNetwork } from '../contexts/NetworkContext';
import { useWalletState } from '../contexts/WalletContext';
import { useSignTransaction } from '../hooks/useSignTransaction';
import { dataTestIds } from '../test';
import { Button } from './Button';

/**
 * A minimal hardcoded test XDR for Stellar testnet.
 * You can generate your own at https://laboratory.stellar.org
 */
const EXAMPLE_TESTNET_XDR =
  'AAAAAgAAAABzdv3ojkzWHMD7KUoXhrPx0GH18vHKIRmKGmGOVJ0IsQAAAGQADdJPAAAAAgAAAAEAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAEAAAAAAAAAAQAAAABzdv3ojkzWHMD7KUoXhrPx0GH18vHKIRmKGmGOVJ0IsQAAAAAAAAAAAJiWgAAAAAAAAAAA';

export const SignTransaction: FC = () => {
  const { address } = useWalletState();
  const signTransaction = useSignTransaction();
  const { selectedNetwork } = useNetwork();
  const [signedTransaction, setSignedTransaction] = useState<string | undefined>();
  const [xdr, setXdr] = useState<string>('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | undefined>();

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
        const errorMessage =
          result.error.code === -4 ? 'The user rejected this request.' : result.error.message;
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
          onClick={() => {
            setXdr(EXAMPLE_TESTNET_XDR);
          }}
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
