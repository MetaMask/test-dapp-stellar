import type { FC } from 'react';

interface TransactionHashProps {
  hash: string;
  testId: string;
}

export const TransactionHash: FC<TransactionHashProps> = ({ hash, testId }) => {
  return (
    <>
      <h3>Transaction Hash</h3>
      <pre data-testid={testId} className="signedTransactions">
        {hash}
      </pre>
      <a href={`https://stellar.expert/explorer/public/tx/${hash}`} target="_blank" rel="noopener noreferrer">
        View on Stellar Expert
      </a>
    </>
  );
};
