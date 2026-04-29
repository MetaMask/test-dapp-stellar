import type { FC } from 'react';
import { StellarShort } from './StellarShort';

interface AccountProps {
  account: string;
}

/**
 * Get the Stellar Expert URL for an account.
 */
const getStellarExpertUrl = (address: string): string => `https://stellar.expert/explorer/public/account/${address}`;

/**
 * Account component.
 */
export const Account: FC<AccountProps> = ({ account, ...props }) => {
  return <StellarShort {...props} content={account} stellarExpertUrl={getStellarExpertUrl(account)} />;
};
