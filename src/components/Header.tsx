import { type FC, useCallback } from 'react';
import { type NetworkKey, STELLAR_NETWORKS } from '../config';
import { useNetwork } from '../contexts/NetworkContext';
import type { WalletMode } from '../contexts/WalletModeContext';
import { useWalletMode } from '../contexts/WalletModeContext';
import { useConnect } from '../hooks/useConnect';
import { dataTestIds } from '../test';
import { Account } from './Account';
import { Button } from './Button';

const MODE_LABELS: Record<WalletMode, string> = {
  sep043: 'SEP-0043',
  'kit-module': 'SWK',
};

/**
 * Header component.
 */
export const Header: FC = () => {
  const { address, connected, connecting, connect, disconnect, mode: activeMode } = useConnect();
  const { selectedNetwork, setSelectedNetwork } = useNetwork();
  const { mode, setMode } = useWalletMode();

  const handleNetworkChange = useCallback(
    (event: React.ChangeEvent<HTMLSelectElement>) => {
      setSelectedNetwork(event.target.value as NetworkKey);
    },
    [setSelectedNetwork],
  );

  const handleToggle = useCallback(() => {
    setMode(mode === 'sep043' ? 'kit-module' : 'sep043');
  }, [mode, setMode]);

  const isKitModule = mode === 'kit-module';

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

      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.5rem' }}>
        <strong>Adapter Mode:</strong>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <span
            style={{
              fontSize: '0.75rem',
              fontWeight: isKitModule ? 400 : 600,
              color: isKitModule ? '#999' : '#512da8',
              transition: 'color 0.2s',
            }}
          >
            {MODE_LABELS.sep043}
          </span>
          <button
            data-testid={dataTestIds.testPage.header.walletModeToggle}
            onClick={handleToggle}
            aria-pressed={isKitModule}
            type="button"
            aria-label={`Adapter mode: currently using ${isKitModule ? 'Stellar Wallets Kit' : 'SEP-0043 direct'}`}
            style={{
              position: 'relative',
              width: '44px',
              height: '24px',
              backgroundColor: isKitModule ? '#512da8' : '#ccc',
              borderRadius: '12px',
              border: 'none',
              cursor: 'pointer',
              padding: 0,
              flexShrink: 0,
              transition: 'background-color 0.2s ease',
            }}
          >
            <span
              style={{
                position: 'absolute',
                top: '2px',
                left: isKitModule ? '22px' : '2px',
                width: '20px',
                height: '20px',
                backgroundColor: 'white',
                borderRadius: '50%',
                transition: 'left 0.2s ease',
                boxShadow: '0 1px 3px rgba(0,0,0,0.35)',
              }}
            />
          </button>
          <span
            style={{
              fontSize: '0.75rem',
              fontWeight: isKitModule ? 600 : 400,
              color: isKitModule ? '#512da8' : '#999',
              transition: 'color 0.2s',
            }}
          >
            {MODE_LABELS['kit-module']}
          </span>
        </div>
      </div>

      <div style={{ display: 'flex', justifyContent: 'center' }}>
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
            {connecting ? 'Connecting...' : activeMode === 'sep043' ? 'Connect MetaMask' : 'Connect Wallet'}
          </Button>
        )}
      </div>
    </div>
  );
};
