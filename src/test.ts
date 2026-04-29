type Pathify<T, Prefix extends string = ''> = {
  [K in keyof T]: T[K] extends true
    ? `${Prefix extends '' ? '' : `${Prefix}.`}${Extract<K, string>}`
    : T[K] extends object
      ? Pathify<T[K], `${Prefix extends '' ? '' : `${Prefix}.`}${Extract<K, string>}`>
      : never;
};

function pathifyObject<T>(obj: T): Pathify<T> {
  function inner(obj: any, path = ''): any {
    const result: any = {};
    for (const key in obj) {
      const fullPath = (path ? `${path}.${key}` : key).toLowerCase();
      if (obj[key] === true) {
        result[key] = fullPath;
      } else if (typeof obj[key] === 'object' && obj[key] !== null) {
        result[key] = inner(obj[key], fullPath);
      } else {
        result[key] = obj[key];
      }
    }
    return result;
  }

  return inner(obj) as Pathify<T>;
}

/**
 * The list of test ids to access elements in the e2e tests.
 */
export const dataTestIds = pathifyObject({
  testPage: {
    header: {
      id: true,
      network: true,
      connect: true,
      disconnect: true,
      account: true,
      connectionStatus: true,
      walletModeToggle: true,
    },
    signMessage: {
      id: true,
      message: true,
      signMessage: true,
      signedMessage: true,
    },
    signTransaction: {
      id: true,
      xdr: true,
      loadExampleXdr: true,
      signTransaction: true,
      signedTransaction: true,
    },
    signAuthEntry: {
      id: true,
      authEntry: true,
      signAuthEntry: true,
      signedAuthEntry: true,
    },
    sendUsdc: {
      id: true,
      recipient: true,
      amount: true,
      sendUsdc: true,
      hash: true,
    },
  },
} as const);
