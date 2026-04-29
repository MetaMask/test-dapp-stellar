import { type FC, useCallback, useState } from 'react';
import { STELLAR_NETWORKS } from '../config';
import { useNetwork } from '../contexts/NetworkContext';
import { useWalletState } from '../contexts/WalletContext';
import { useSignAuthEntry } from '../hooks/useSignAuthEntry';
import { dataTestIds } from '../test';
import { Button } from './Button';

export const SignAuthEntry: FC = () => {
  const { address } = useWalletState();
  const signAuthEntry = useSignAuthEntry();
  const { selectedNetwork } = useNetwork();
  const [signedAuthEntry, setSignedAuthEntry] = useState<string | undefined>();
  const [authEntry, setAuthEntry] = useState<string>('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  /**
   * Sign the auth entry using the active wallet.
   */
  const signOnly = useCallback(async () => {
    if (!address || !authEntry) {
      throw new Error('Wallet not connected or auth entry missing');
    }

    setLoading(true);
    setError(null);
    try {
      const result = await signAuthEntry(authEntry, {
        networkPassphrase: STELLAR_NETWORKS[selectedNetwork].networkPassphrase,
        address,
      });
      if (result.error) {
        setError(result.error.message);
        return;
      }
      setSignedAuthEntry(result.signedAuthEntry ?? undefined);
    } catch (err) {
      console.error('Error signing auth entry:', err);
      throw err;
    } finally {
      setLoading(false);
    }
  }, [address, signAuthEntry, authEntry, selectedNetwork]);

  return (
    <div data-testid={dataTestIds.testPage.signAuthEntry.id}>
      <div style={{ marginBottom: '1rem' }}>
        <label htmlFor="authEntry">Auth Entry XDR:</label>
        <textarea
          data-testid={dataTestIds.testPage.signAuthEntry.authEntry}
          id="authEntry"
          value={authEntry}
          onChange={(e) => setAuthEntry(e.target.value)}
          rows={4}
          style={{ width: '90%', padding: '0.5rem', marginTop: '0.5rem', resize: 'vertical' }}
          placeholder="Paste your base64-encoded Soroban auth entry XDR here..."
        />
      </div>

      <div style={{ marginBottom: '1rem', fontSize: '0.875rem', color: '#666' }}>
        <strong>Network:</strong> {STELLAR_NETWORKS[selectedNetwork].name}
        <br />
        <strong>Passphrase:</strong> {STELLAR_NETWORKS[selectedNetwork].networkPassphrase}
      </div>

      <Button
        data-testid={dataTestIds.testPage.signAuthEntry.signAuthEntry}
        onClick={signOnly}
        disabled={!address || !authEntry}
        loading={loading}
      >
        Sign Auth Entry
      </Button>

      {error && <p style={{ color: '#b71c1c', fontStyle: 'italic' }}>{error}</p>}

      {signedAuthEntry && (
        <>
          <h3>Signed auth entry</h3>
          <pre data-testid={dataTestIds.testPage.signAuthEntry.signedAuthEntry} className="signedTransactions">
            {signedAuthEntry}
          </pre>
        </>
      )}
    </div>
  );
};
