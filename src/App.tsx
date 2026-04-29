import type { FC } from 'react';
import { NetworkProvider } from './contexts/NetworkContext';
import { WalletProvider } from './contexts/WalletContext';
import { TestPage } from './pages/TestPage';

const AppInner: FC = () => {
  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'flex-start',
        height: '100vh',
        width: '100vw',
        padding: '1rem',
        boxSizing: 'border-box',
      }}
    >
      <div
        style={{
          width: '100%',
          maxWidth: '1600px',
          margin: '0 auto',
          textAlign: 'center',
        }}
      >
        <TestPage />
      </div>
    </div>
  );
};

export const App: FC = () => {
  return (
    <NetworkProvider>
      <WalletProvider>
        <AppInner />
      </WalletProvider>
    </NetworkProvider>
  );
};
