import { type FC, useCallback, useState } from 'react';
import { useWalletState } from '../contexts/WalletContext';
import { useSignMessage } from '../hooks/useSignMessage';
import { dataTestIds } from '../test';
import { Button } from './Button';

export const SignMessage: FC = () => {
  const { address } = useWalletState();
  const signMessage = useSignMessage();
  const [signedMessage, setSignedMessage] = useState<string | null>(null);
  const [message, setMessage] = useState<string>('Hello, Stellar!');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  /**
   * Handle sign message button click.
   */
  const handleSignMessage = useCallback(async () => {
    if (!address) {
      throw new Error('Wallet not connected');
    }

    setLoading(true);
    setError(null);
    try {
      const result = await signMessage(message, { address });
      if (result.error) {
        setError(result.error.message);
        return;
      }
      setSignedMessage(result.signedMessage ?? null);
    } finally {
      setLoading(false);
    }
  }, [address, signMessage, message]);

  return (
    <div data-testid={dataTestIds.testPage.signMessage.id}>
      <div style={{ marginBottom: '1rem' }}>
        <label htmlFor="message">Message:</label>
        <input
          data-testid={dataTestIds.testPage.signMessage.message}
          type="text"
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          style={{ width: '90%', padding: '0.5rem', marginTop: '0.5rem' }}
        />
      </div>
      <Button
        data-testid={dataTestIds.testPage.signMessage.signMessage}
        onClick={handleSignMessage}
        disabled={loading}
        loading={loading}
      >
        Sign Message
      </Button>
      {error && <p style={{ color: '#b71c1c', fontStyle: 'italic' }}>{error}</p>}
      {signedMessage && (
        <>
          <p>Signed Message:</p>
          <pre
            data-testid={dataTestIds.testPage.signMessage.signedMessage}
            style={{ wordWrap: 'break-word', whiteSpace: 'pre-wrap' }}
            className="signedTransactions"
          >
            {signedMessage}
          </pre>
        </>
      )}
    </div>
  );
};
