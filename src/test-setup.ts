import { vi } from 'vitest';

/**
 * Mock CommonJS modules that cause ESM/CJS interop issues in Vitest.
 * FreighterModule tries to import named exports from @stellar/freighter-api (CommonJS),
 * which fails in ESM context. We mock the entire wallet kit modules to avoid this.
 */
vi.mock('@creit.tech/stellar-wallets-kit/modules/freighter', () => ({
  FreighterModule: vi.fn(function (this: { productId: string }) {
    this.productId = 'freighter';
  }),
}));

vi.mock('@creit.tech/stellar-wallets-kit/modules/lobstr', () => ({
  LobstrModule: vi.fn(function (this: { productId: string }) {
    this.productId = 'lobstr';
  }),
}));

vi.mock('@creit.tech/stellar-wallets-kit/modules/wallet-connect', () => ({
  WalletConnectModule: vi.fn(function (this: { productId: string }) {
    this.productId = 'wallet-connect';
  }),
}));

vi.mock('@creit.tech/stellar-wallets-kit/types', () => ({
  KitEventType: {
    STATE_UPDATED: 'STATE_UPDATED',
    WALLET_SELECTED: 'WALLET_SELECTED',
    DISCONNECT: 'DISCONNECT',
  },
}));

vi.mock('@creit.tech/stellar-wallets-kit/sdk', () => {
  const eventListeners = new Map<string, Array<(event: any) => void>>();

  return {
    StellarWalletsKit: {
      init: vi.fn(() => {}),
      on: vi.fn((event: string, callback: (event: any) => void) => {
        if (!eventListeners.has(event)) {
          eventListeners.set(event, []);
        }
        eventListeners.get(event)!.push(callback);
        return () => {
          const callbacks = eventListeners.get(event)!;
          const idx = callbacks.indexOf(callback);
          if (idx !== -1) {
            callbacks.splice(idx, 1);
          }
        };
      }),
      setWallet: vi.fn(() => {}),
      getWallet: vi.fn(() => null),
      fetchAddress: vi.fn(async () => ({ address: null })),
      setNetwork: vi.fn(() => {}),
      getNetwork: vi.fn(() => 'public'),
      signTransaction: vi.fn(),
      signMessage: vi.fn(),
      signAuthEntry: vi.fn(),
    },
  };
});

/**
 * Vitest setup — Node v25 provides a native globalThis.localStorage that
 * is non-functional without --localstorage-file. SWK reads localStorage
 * at import time, so we must polyfill before any modules load.
 */
if (typeof globalThis.localStorage?.getItem !== 'function') {
  const store = new Map<string, string>();
  Object.defineProperty(globalThis, 'localStorage', {
    value: {
      getItem: (key: string) => store.get(key) ?? null,
      setItem: (key: string, value: string) => store.set(key, value),
      removeItem: (key: string) => {
        store.delete(key);
      },
      clear: () => store.clear(),
      get length() {
        return store.size;
      },
      key: (index: number) => [...store.keys()][index] ?? null,
    },
    writable: true,
    configurable: true,
  });
}
