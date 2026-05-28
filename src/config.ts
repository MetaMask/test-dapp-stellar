/**
 * Stellar network configurations.
 */
export const STELLAR_NETWORKS = {
  pubnet: {
    name: 'Public Network (Mainnet)',
    networkPassphrase: 'Public Global Stellar Network ; September 2015',
    horizonUrl: 'https://horizon.stellar.org',
  },
  testnet: {
    name: 'Testnet',
    networkPassphrase: 'Test SDF Network ; September 2015',
    horizonUrl: 'https://horizon-testnet.stellar.org',
  },
  futurenet: {
    name: 'Futurenet',
    networkPassphrase: 'Test SDF Future Network ; October 2022',
    horizonUrl: 'https://horizon-futurenet.stellar.org',
  },
} as const;

export type NetworkKey = keyof typeof STELLAR_NETWORKS;

/**
 * USDC asset issuer public keys on Stellar networks.
 */
export const USDC_ISSUERS: Partial<Record<NetworkKey, string>> = {
  pubnet: 'GA5ZSEJYB37JRC5AVCIA5MOP4RHTM335X2KGX3IHOJAPP5RE34K4KZVN',
  testnet: 'GBBD47IF6LWK7P7MDEVSCWR7DPUWV3NY3DTQEVFL4NAT4AQH3ZLLFLA5',
};

/**
 * The default network to use in the tests.
 */
export const DEFAULT_NETWORK: NetworkKey = 'testnet';

/**
 * Get the default network key.
 */
export const getDefaultNetworkKey = (): NetworkKey => DEFAULT_NETWORK;

/**
 * Default recipient address for testing transactions.
 * Can be overridden with VITE_DEFAULT_RECIPIENT environment variable.
 */
export const DEFAULT_RECIPIENT =
  (import.meta.env.VITE_DEFAULT_RECIPIENT as string | undefined) ??
  'GAAZI4TCR3TY5OJHCTJC2A4QSY6CJWJH5IAJTGKIN2ER7LBNVKOCCWN';
