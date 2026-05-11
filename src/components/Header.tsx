import { type FC, useCallback } from 'react';
import { type NetworkKey, STELLAR_NETWORKS } from '../config';
import { useNetwork } from '../contexts/NetworkContext';
import { useConnect } from '../hooks/useConnect';
import { dataTestIds } from '../test';
import { Account } from './Account';
import { Button } from './Button';

export const Header: FC = () => {
  const { address, connected, connecting, error, connect, disconnect } = useConnect();
  const { selectedNetwork, setSelectedNetwork } = useNetwork();

  const handleNetworkChange = useCallback(
    (event: React.ChangeEvent<HTMLSelectElement>) => {
      setSelectedNetwork(event.target.value as NetworkKey);
    },
    [setSelectedNetwork],
  );

  return (
    <div
      data-testid={dataTestIds.testPage.header.id}
      style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))',
        gap: '1rem',
        marginBottom: '1rem',
        alignItems: 'start',
      }}
    >
      <div style={{ wordWrap: 'break-word' }}>
        <strong>Network:</strong>
        <select
          data-testid={dataTestIds.testPage.header.network}
          value={selectedNetwork}
          onChange={handleNetworkChange}
          style={{
            width: '100%',
            padding: '0.5rem',
            marginTop: '0.5rem',
            border: '1px solid #ccc',
            borderRadius: '4px',
          }}
        >
          {Object.entries(STELLAR_NETWORKS).map(([key, network]) => (
            <option key={key} value={key}>
              {network.name}
            </option>
          ))}
        </select>
      </div>

      <div style={{ wordWrap: 'break-word' }}>
        <strong>Status:</strong>
        <div data-testid={dataTestIds.testPage.header.connectionStatus}>
          {connected ? 'Connected' : 'Not connected'}
        </div>
      </div>

      <div style={{ wordWrap: 'break-word' }}>
        <strong>Account:</strong>
        <div data-testid={dataTestIds.testPage.header.account}>{address ? <Account account={address} /> : 'N/A'}</div>
      </div>

      <div style={{ display: 'flex', justifyContent: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
        {connected ? (
          <Button
            data-testid={dataTestIds.testPage.header.disconnect}
            onClick={disconnect}
            style={{ backgroundColor: '#b71c1c', borderColor: '#b71c1c', color: 'white' }}
          >
            Disconnect
          </Button>
        ) : (
          <Button
            data-testid={dataTestIds.testPage.header.connect}
            onClick={connect}
            loading={connecting}
            disabled={connecting}
            style={{ backgroundColor: '#512da8', borderColor: '#512da8', color: 'white' }}
          >
            {connecting ? 'Connecting...' : 'Connect Wallet'}
          </Button>
        )}
      </div>

      {error && (
        <div style={{ gridColumn: '1 / -1', color: '#b71c1c', fontStyle: 'italic', wordBreak: 'break-word' }}>
          {error}
        </div>
      )}
    </div>
  );
};
