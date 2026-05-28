import { StrKey } from '@stellar/stellar-sdk';
import { type ChangeEvent, type FC, useCallback, useState } from 'react';
import { DEFAULT_RECIPIENT, USDC_ISSUERS } from '../config';
import { useNetwork } from '../contexts/NetworkContext';
import { useWalletState } from '../contexts/WalletContext';
import { useTransferToken } from '../hooks/useTransferToken';
import { dataTestIds } from '../test';
import { Button } from './Button';
import { TransactionHash } from './TransactionHash';

export const SendUsdc: FC = () => {
  const { address } = useWalletState();
  const { selectedNetwork } = useNetwork();
  const { transfer, loading } = useTransferToken();
  const [toAddress, setToAddress] = useState<string>(DEFAULT_RECIPIENT);
  const [amount, setAmount] = useState<string>('1');
  const [transactionHash, setTransactionHash] = useState<string | undefined>();
  const [error, setError] = useState<string | undefined>();

  /**
   * Handle recipient address change.
   */
  const handleAddressChange = useCallback((event: ChangeEvent<HTMLInputElement>) => {
    setToAddress(event.target.value);
  }, []);

  /**
   * Handle amount change.
   */
  const handleAmountChange = useCallback((event: ChangeEvent<HTMLInputElement>) => {
    setAmount(event.target.value);
  }, []);

  /**
   * Send USDC transaction.
   */
  const handleSend = useCallback(async () => {
    setError(undefined);
    setTransactionHash(undefined);

    if (!address) {
      setError('Wallet not connected');
      return;
    }

    const recipientAddress = toAddress.trim();

    if (!recipientAddress) {
      setError('Recipient address is required');
      return;
    }

    if (!StrKey.isValidEd25519PublicKey(recipientAddress)) {
      setError('Recipient address is invalid');
      return;
    }

    if (!amount || Number.parseFloat(amount) <= 0) {
      setError('Amount must be greater than 0');
      return;
    }

    try {
      const usdcIssuer = USDC_ISSUERS[selectedNetwork];

      if (!usdcIssuer) {
        setError(`USDC not supported on network ${selectedNetwork}`);
        return;
      }

      const result = await transfer({
        tokenCode: 'USDC',
        tokenIssuer: usdcIssuer,
        recipientAddress,
        amount,
      });

      if (result.error) {
        setError(result.error.message);
      } else if (result.hash) {
        setTransactionHash(result.hash);
        setAmount('1');
      }
    } catch (e) {
      const message = e instanceof Error ? e.message : String(e);
      setError(message);
    }
  }, [address, selectedNetwork, toAddress, amount, transfer]);

  return (
    <div data-testid={dataTestIds.testPage.sendUsdc.id}>
      <div style={{ marginBottom: '1rem' }}>
        <label htmlFor="recipient">Recipient Address:</label>
        <input
          data-testid={dataTestIds.testPage.sendUsdc.recipient}
          id="recipient"
          type="text"
          value={toAddress}
          onChange={handleAddressChange}
          placeholder="G..."
          style={{ width: '90%', padding: '0.5rem', marginTop: '0.5rem' }}
        />
      </div>

      <div style={{ marginBottom: '1rem' }}>
        <label htmlFor="amount">Amount (USDC):</label>
        <input
          data-testid={dataTestIds.testPage.sendUsdc.amount}
          id="amount"
          type="number"
          value={amount}
          onChange={handleAmountChange}
          min="0"
          step="0.000001"
          style={{ width: '90%', padding: '0.5rem', marginTop: '0.5rem' }}
        />
      </div>

      <Button data-testid={dataTestIds.testPage.sendUsdc.sendUsdc} onClick={handleSend} disabled={loading || !address}>
        {loading ? 'Sending...' : 'Send USDC'}
      </Button>

      {error && (
        <div style={{ color: 'red', marginTop: '1rem' }}>
          <strong>Error:</strong> {error}
        </div>
      )}

      {transactionHash && <TransactionHash hash={transactionHash} testId={dataTestIds.testPage.sendUsdc.hash} />}
    </div>
  );
};
