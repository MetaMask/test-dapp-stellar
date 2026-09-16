type Pathify<T, Prefix extends string = ''> = {
    [K in keyof T]: T[K] extends true ? `${Prefix extends '' ? '' : `${Prefix}.`}${Extract<K, string>}` : T[K] extends object ? Pathify<T[K], `${Prefix extends '' ? '' : `${Prefix}.`}${Extract<K, string>}`> : never;
};
/**
 * The list of test ids to access elements in the e2e tests.
 */
export declare const dataTestIds: Pathify<{
    readonly testPage: {
        readonly header: {
            readonly id: true;
            readonly network: true;
            readonly connect: true;
            readonly disconnect: true;
            readonly account: true;
            readonly connectionStatus: true;
            readonly walletModeToggle: true;
        };
        readonly signMessage: {
            readonly id: true;
            readonly message: true;
            readonly signMessage: true;
            readonly signedMessage: true;
        };
        readonly signTransaction: {
            readonly id: true;
            readonly xdr: true;
            readonly loadExampleXdr: true;
            readonly signTransaction: true;
            readonly signedTransaction: true;
        };
        readonly signAuthEntry: {
            readonly id: true;
            readonly authEntry: true;
            readonly signAuthEntry: true;
            readonly signedAuthEntry: true;
        };
        readonly sendUsdc: {
            readonly id: true;
            readonly recipient: true;
            readonly amount: true;
            readonly sendUsdc: true;
            readonly hash: true;
        };
    };
}, "">;
export {};
