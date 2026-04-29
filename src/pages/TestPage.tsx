import type { FC } from 'react';
import { Header } from '../components/Header';
import { SendUsdc } from '../components/SendUsdc';
import { SignAuthEntry } from '../components/SignAuthEntry';
import { SignMessage } from '../components/SignMessage';
import { SignTransaction } from '../components/SignTransaction';
import { Test } from '../components/Test';

export const TestPage: FC = () => {
  return (
    <div style={{ padding: '1rem' }}>
      <div
        style={{
          marginBottom: '2rem',
        }}
      >
        <Header />
      </div>
      <div className="grid">
        <Test key="signMessage" title="Sign Message">
          <SignMessage />
        </Test>
        <Test key="sendUsdc" title="Send USDC">
          <SendUsdc />
        </Test>
        <Test key="signTransaction" title="Sign Transaction">
          <SignTransaction />
        </Test>
        <Test key="signAuthEntry" title="Sign Auth Entry (Soroban)">
          <SignAuthEntry />
        </Test>
      </div>
    </div>
  );
};
