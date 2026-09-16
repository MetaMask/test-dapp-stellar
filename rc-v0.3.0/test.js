"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.dataTestIds = void 0;
function pathifyObject(obj) {
    function inner(obj, path = '') {
        const result = {};
        for (const key in obj) {
            const fullPath = (path ? `${path}.${key}` : key).toLowerCase();
            if (obj[key] === true) {
                result[key] = fullPath;
            }
            else if (typeof obj[key] === 'object' && obj[key] !== null) {
                result[key] = inner(obj[key], fullPath);
            }
            else {
                result[key] = obj[key];
            }
        }
        return result;
    }
    return inner(obj);
}
/**
 * The list of test ids to access elements in the e2e tests.
 */
exports.dataTestIds = pathifyObject({
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
});
