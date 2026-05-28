import { Asset, Horizon, Operation, TransactionBuilder } from '@stellar/stellar-sdk';
import { useCallback, useState } from 'react';
import { STELLAR_NETWORKS } from '../config';
import { useNetwork } from '../contexts/NetworkContext';
import { useWalletState } from '../contexts/WalletContext';
import { useSignTransaction } from './useSignTransaction';

const TRANSACTION_TIMEOUT_SECONDS = 5 * 60;
const STROOPS_PER_UNIT = 10_000_000n;

export interface TransferTokenResult {
  hash?: string;
  error?: { message: string; code?: number };
}

export interface TransferTokenParams {
  tokenCode: string;
  tokenIssuer: string;
  recipientAddress: string;
  amount: string;
}

type AssetBalanceLine = Horizon.HorizonApi.BalanceLineAsset;

const isAssetBalanceLine = (balance: Horizon.HorizonApi.BalanceLine): balance is AssetBalanceLine => {
  return 'asset_code' in balance && 'asset_issuer' in balance;
};

const findAssetBalanceLine = (account: Horizon.AccountResponse, asset: Asset): AssetBalanceLine | undefined => {
  return account.balances.find(
    (balance): balance is AssetBalanceLine =>
      isAssetBalanceLine(balance) &&
      balance.asset_code === asset.getCode() &&
      balance.asset_issuer === asset.getIssuer(),
  );
};

const toAssetUnits = (amount: string): bigint => {
  const normalizedAmount = amount.trim();

  if (!/^(?:\d+|\d*\.\d+)$/.test(normalizedAmount)) {
    throw new Error('Amount must be a positive number with at most 7 decimal places');
  }

  const [wholeAmount, fractionalAmount = ''] = normalizedAmount.split('.');

  if (fractionalAmount.length > 7) {
    throw new Error('Amount must be a positive number with at most 7 decimal places');
  }

  const units = BigInt(wholeAmount || '0') * STROOPS_PER_UNIT + BigInt(fractionalAmount.padEnd(7, '0') || '0');

  if (units <= 0n) {
    throw new Error('Amount must be greater than 0');
  }

  return units;
};

const getHorizonResponseData = (error: unknown): unknown => {
  const getResponse = (error as { getResponse?: () => unknown }).getResponse;
  const response =
    typeof getResponse === 'function' ? getResponse.call(error) : (error as { response?: unknown }).response;

  return (response as { data?: unknown } | undefined)?.data ?? response;
};

const describeTransactionCode = (code: string | undefined): string | undefined => {
  switch (code) {
    case 'tx_bad_auth':
      return 'the wallet did not provide the required signature';
    case 'tx_bad_seq':
      return 'the account sequence number changed; retry the transfer';
    case 'tx_insufficient_balance':
      return 'the source account does not have enough XLM to pay the fee or reserve';
    case 'tx_no_source_account':
      return 'the source account does not exist on this network';
    case 'tx_too_late':
      return 'the transaction expired before it was submitted; retry the transfer';
    default:
      return undefined;
  }
};

const describeOperationCode = (code: string | undefined, tokenCode: string): string | undefined => {
  switch (code) {
    case 'op_no_destination':
      return 'the recipient account does not exist on this network';
    case 'op_no_trust':
      return `the recipient account does not have a ${tokenCode} trustline`;
    case 'op_not_authorized':
      return `the ${tokenCode} trustline is not authorized`;
    case 'op_underfunded':
      return `the source account does not have enough ${tokenCode}`;
    case 'op_line_full':
      return `the recipient ${tokenCode} trustline limit is too low`;
    default:
      return undefined;
  }
};

const formatHorizonSubmitError = (error: unknown, tokenCode: string): string => {
  const responseData = getHorizonResponseData(error) as
    | {
        title?: string;
        details?: string;
        status?: number;
        extras?: {
          result_codes?: {
            transaction?: string;
            operations?: string[];
          };
        };
      }
    | undefined;

  const resultCodes = responseData?.extras?.result_codes;

  if (resultCodes) {
    const transactionDescription = describeTransactionCode(resultCodes.transaction);
    const operationDescriptions = resultCodes.operations
      ?.map((code) => describeOperationCode(code, tokenCode) ?? code)
      .filter(Boolean);
    const descriptions = [transactionDescription, ...(operationDescriptions ?? [])].filter(Boolean);
    const codes = [
      resultCodes.transaction,
      ...(resultCodes.operations?.map((code, index) => `op${index + 1}: ${code}`) ?? []),
    ]
      .filter(Boolean)
      .join(', ');

    if (descriptions.length > 0) {
      return `Transaction failed: ${descriptions.join('; ')} (${codes})`;
    }

    return `Transaction failed with Stellar result codes: ${codes}`;
  }

  if (responseData?.details) {
    return responseData.details;
  }

  return error instanceof Error ? error.message : String(error);
};

const loadAccountOrThrow = async (
  server: Horizon.Server,
  accountAddress: string,
  notFoundMessage: string,
): Promise<Horizon.AccountResponse> => {
  try {
    return await server.loadAccount(accountAddress);
  } catch (err) {
    const error = err as { status?: number; response?: { status?: number } };
    if (error.status === 404 || error.response?.status === 404) {
      throw new Error(notFoundMessage);
    }
    throw err;
  }
};

/**
 * Hook to transfer any token on Stellar
 */
export function useTransferToken() {
  const { address } = useWalletState();
  const { selectedNetwork } = useNetwork();
  const signTransaction = useSignTransaction();
  const [loading, setLoading] = useState(false);

  const transfer = useCallback(
    async (params: TransferTokenParams): Promise<TransferTokenResult> => {
      if (!address) {
        throw new Error('Wallet not connected');
      }

      setLoading(true);
      try {
        const networkConfig = STELLAR_NETWORKS[selectedNetwork];
        const networkPassphrase = networkConfig.networkPassphrase as string;
        const horizonUrl = networkConfig.horizonUrl as string;

        const server = new Horizon.Server(horizonUrl, { allowHttp: true });
        const asset = new Asset(params.tokenCode, params.tokenIssuer);
        const amountUnits = toAssetUnits(params.amount);

        const sourceAccount = await loadAccountOrThrow(
          server,
          address,
          `Account not found on ${networkConfig.name}. Make sure your wallet is funded on this network.`,
        );

        const sourceIsIssuer = address === params.tokenIssuer;
        if (!sourceIsIssuer) {
          const sourceBalance = findAssetBalanceLine(sourceAccount, asset);

          if (!sourceBalance) {
            throw new Error(
              `Connected account does not have a ${params.tokenCode} trustline on ${networkConfig.name}. Add the trustline and fund it before sending.`,
            );
          }

          if (!sourceBalance.is_authorized) {
            throw new Error(`Connected account ${params.tokenCode} trustline is not authorized.`);
          }

          if (toAssetUnits(sourceBalance.balance) < amountUnits) {
            throw new Error(
              `Insufficient ${params.tokenCode} balance: available ${sourceBalance.balance}, trying to send ${params.amount}.`,
            );
          }
        }

        const recipientIsIssuer = params.recipientAddress === params.tokenIssuer;
        if (!recipientIsIssuer) {
          const recipientAccount = await loadAccountOrThrow(
            server,
            params.recipientAddress,
            `Recipient account not found on ${networkConfig.name}. The recipient must be funded before it can receive ${params.tokenCode}.`,
          );
          const recipientBalance = findAssetBalanceLine(recipientAccount, asset);

          if (!recipientBalance) {
            throw new Error(
              `Recipient account does not have a ${params.tokenCode} trustline for issuer ${params.tokenIssuer}. Add the trustline before sending.`,
            );
          }

          if (!recipientBalance.is_authorized) {
            throw new Error(`Recipient ${params.tokenCode} trustline is not authorized.`);
          }
        }

        // Build the payment transaction
        const txBuilder = new TransactionBuilder(sourceAccount, {
          fee: '100',
          networkPassphrase,
        });

        txBuilder.addOperation(
          Operation.payment({
            destination: params.recipientAddress,
            asset,
            amount: params.amount,
          }),
        );

        const transaction = txBuilder.setTimeout(TRANSACTION_TIMEOUT_SECONDS).build();
        const xdr = transaction.toXDR();

        // Sign the transaction
        const signResult = await signTransaction(xdr, {
          networkPassphrase,
          address,
        });

        if (signResult.error || !signResult.signedTxXdr) {
          return {
            error: signResult.error || { message: 'Failed to sign transaction' },
          };
        }

        // Submit the transaction
        const submittedTx = TransactionBuilder.fromXDR(signResult.signedTxXdr, networkPassphrase);
        let response;
        try {
          response = await server.submitTransaction(submittedTx);
        } catch (err) {
          throw new Error(formatHorizonSubmitError(err, params.tokenCode));
        }

        return {
          hash: response.hash,
        };
      } catch (e) {
        const error = e instanceof Error ? e : new Error(String(e));
        console.error('Error transferring token:', error);
        return {
          error: {
            message: error.message,
            code: -1,
          },
        };
      } finally {
        setLoading(false);
      }
    },
    [address, selectedNetwork, signTransaction],
  );

  return {
    transfer,
    loading,
  };
}
