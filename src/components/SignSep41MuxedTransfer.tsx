import {
  Address,
  Contract,
  Horizon,
  StrKey,
  TransactionBuilder,
  encodeMuxedContractAddress,
  nativeToScVal,
} from '@stellar/stellar-sdk';
import { type ChangeEvent, type FC, useCallback, useMemo, useState } from 'react';
import { DEFAULT_SEP41_CONTRACT_ID, STELLAR_NETWORKS } from '../config';
import { useNetwork } from '../contexts/NetworkContext';
import { useWalletState } from '../contexts/WalletContext';
import { useSignTransaction } from '../hooks/useSignTransaction';
import { dataTestIds } from '../test';
import { Button } from './Button';

const isHorizonNotFoundError = (error: unknown): boolean => {
  const horizonError = error as { response?: { status?: number }; status?: number };
  return horizonError.status === 404 || horizonError.response?.status === 404;
};

/**
 * Builds and signs a SEP-41 `transfer` invoke whose `to` is a CAP-84 muxed
 * contract address (`W…`). Sign-only — does not submit — so MetaMask confirmation
 * / XDR parsing can be exercised without needing a live Protocol 30 network.
 */
export const SignSep41MuxedTransfer: FC = () => {
  const { address } = useWalletState();
  const { selectedNetwork } = useNetwork();
  const signTransaction = useSignTransaction();
  const [contractId, setContractId] = useState(DEFAULT_SEP41_CONTRACT_ID);
  const [muxId, setMuxId] = useState('42');
  const [amount, setAmount] = useState('1');
  const [xdr, setXdr] = useState('');
  const [muxedDestination, setMuxedDestination] = useState<string | undefined>();
  const [signedTransaction, setSignedTransaction] = useState<string | undefined>();
  const [loadingBuild, setLoadingBuild] = useState(false);
  const [loadingSign, setLoadingSign] = useState(false);
  const [error, setError] = useState<string | undefined>();

  const networkConfig = STELLAR_NETWORKS[selectedNetwork];

  const previewMuxedDestination = useMemo(() => {
    const trimmedContract = contractId.trim();
    const trimmedMuxId = muxId.trim();
    if (!StrKey.isValidContract(trimmedContract) || !/^\d+$/u.test(trimmedMuxId)) {
      return undefined;
    }
    try {
      return encodeMuxedContractAddress(trimmedContract, trimmedMuxId);
    } catch {
      return undefined;
    }
  }, [contractId, muxId]);

  const handleContractChange = useCallback((event: ChangeEvent<HTMLInputElement>) => {
    setContractId(event.target.value);
  }, []);

  const handleMuxIdChange = useCallback((event: ChangeEvent<HTMLInputElement>) => {
    setMuxId(event.target.value);
  }, []);

  const handleAmountChange = useCallback((event: ChangeEvent<HTMLInputElement>) => {
    setAmount(event.target.value);
  }, []);

  const buildExampleXdr = useCallback(async () => {
    if (!address) {
      setError('Connect a Stellar account before building a SEP-41 transfer.');
      return;
    }

    const trimmedContract = contractId.trim();
    const trimmedMuxId = muxId.trim();
    const amountValue = amount.trim();

    setError(undefined);
    setSignedTransaction(undefined);
    setXdr('');
    setMuxedDestination(undefined);
    setLoadingBuild(true);

    try {
      if (!StrKey.isValidContract(trimmedContract)) {
        throw new Error('Contract id must be a valid C… strkey.');
      }
      if (!/^\d+$/u.test(trimmedMuxId)) {
        throw new Error('Mux id must be a non-negative decimal integer.');
      }
      if (!/^\d+$/u.test(amountValue) || BigInt(amountValue) <= 0n) {
        throw new Error('Amount must be a positive integer in the token smallest unit (i128).');
      }

      const destination = encodeMuxedContractAddress(trimmedContract, trimmedMuxId);
      const server = new Horizon.Server(networkConfig.horizonUrl, { allowHttp: true });
      const sourceAccount = await server.loadAccount(address);
      const contract = new Contract(trimmedContract);
      const transaction = new TransactionBuilder(sourceAccount, {
        fee: '100',
        networkPassphrase: networkConfig.networkPassphrase,
      })
        .addOperation(
          contract.call(
            'transfer',
            new Address(address).toScVal(),
            new Address(destination).toScVal(),
            nativeToScVal(BigInt(amountValue), { type: 'i128' }),
          ),
        )
        .setTimeout(30)
        .build();

      setMuxedDestination(destination);
      setXdr(transaction.toXDR());
    } catch (err) {
      const message = isHorizonNotFoundError(err)
        ? `Connected account ${address} is not funded on ${networkConfig.name}. Fund it on this network before building a SEP-41 transfer.`
        : err instanceof Error
          ? err.message
          : 'Failed to build SEP-41 muxed transfer';
      console.error('Build SEP-41 muxed transfer error:', message);
      setError(message);
    } finally {
      setLoadingBuild(false);
    }
  }, [address, amount, contractId, muxId, networkConfig]);

  const signOnly = useCallback(async () => {
    if (!address || !xdr) {
      setError('Wallet not connected or XDR missing');
      return;
    }

    setError(undefined);
    setSignedTransaction(undefined);
    setLoadingSign(true);
    try {
      const result = await signTransaction(xdr, {
        networkPassphrase: networkConfig.networkPassphrase,
        address,
      });
      if (result.error) {
        const errorMessage = result.error.code === -4 ? 'The user rejected this request.' : result.error.message;
        console.error('Sign SEP-41 muxed transfer error:', errorMessage);
        setError(errorMessage);
        return;
      }
      setSignedTransaction(result.signedTxXdr);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Unknown signing error';
      console.error('Error signing SEP-41 muxed transfer:', message);
      setError(message);
    } finally {
      setLoadingSign(false);
    }
  }, [address, networkConfig.networkPassphrase, signTransaction, xdr]);

  return (
    <div data-testid={dataTestIds.testPage.signSep41MuxedTransfer.id}>
      <p style={{ fontSize: '0.875rem', color: '#666', marginBottom: '1rem' }}>
        Builds a SEP-41 <code>transfer(from, to, amount)</code> with <code>to = W…</code> (CAP-84 muxed contract), then
        signs it. Use this to verify MetaMask confirmation accepts muxed-contract destinations. Sign-only — does not
        submit.
      </p>

      <div style={{ marginBottom: '1rem' }}>
        <label htmlFor="sep41-contract">SEP-41 contract (C…):</label>
        <input
          data-testid={dataTestIds.testPage.signSep41MuxedTransfer.contractId}
          id="sep41-contract"
          type="text"
          value={contractId}
          onChange={handleContractChange}
          placeholder="C..."
          style={{ width: '90%', padding: '0.5rem', marginTop: '0.5rem' }}
        />
      </div>

      <div style={{ marginBottom: '1rem' }}>
        <label htmlFor="sep41-mux-id">Mux id:</label>
        <input
          data-testid={dataTestIds.testPage.signSep41MuxedTransfer.muxId}
          id="sep41-mux-id"
          type="text"
          value={muxId}
          onChange={handleMuxIdChange}
          placeholder="42"
          style={{ width: '90%', padding: '0.5rem', marginTop: '0.5rem' }}
        />
      </div>

      <div style={{ marginBottom: '1rem' }}>
        <label htmlFor="sep41-amount">Amount (token smallest unit, i128):</label>
        <input
          data-testid={dataTestIds.testPage.signSep41MuxedTransfer.amount}
          id="sep41-amount"
          type="text"
          value={amount}
          onChange={handleAmountChange}
          placeholder="1"
          style={{ width: '90%', padding: '0.5rem', marginTop: '0.5rem' }}
        />
      </div>

      <div style={{ marginBottom: '1rem', fontSize: '0.875rem', color: '#666' }}>
        <strong>Network:</strong> {networkConfig.name}
        <br />
        <strong>Preview W…:</strong>{' '}
        <span data-testid={dataTestIds.testPage.signSep41MuxedTransfer.previewDestination}>
          {previewMuxedDestination ?? '—'}
        </span>
      </div>

      <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap', marginBottom: '0.5rem' }}>
        <Button
          data-testid={dataTestIds.testPage.signSep41MuxedTransfer.buildXdr}
          onClick={buildExampleXdr}
          disabled={!address}
          loading={loadingBuild}
          style={{ fontSize: '0.875rem' }}
        >
          Build SEP-41 W… XDR
        </Button>
        <Button
          data-testid={dataTestIds.testPage.signSep41MuxedTransfer.signTransaction}
          onClick={signOnly}
          disabled={!address || !xdr}
          loading={loadingSign}
        >
          Sign Transaction
        </Button>
      </div>

      {muxedDestination && (
        <p style={{ fontSize: '0.875rem' }}>
          <strong>Built to:</strong>{' '}
          <code data-testid={dataTestIds.testPage.signSep41MuxedTransfer.builtDestination}>{muxedDestination}</code>
        </p>
      )}

      {xdr && (
        <div style={{ marginBottom: '1rem' }}>
          <label htmlFor="sep41-xdr">Transaction XDR:</label>
          <textarea
            data-testid={dataTestIds.testPage.signSep41MuxedTransfer.xdr}
            id="sep41-xdr"
            value={xdr}
            readOnly
            rows={4}
            style={{ width: '90%', padding: '0.5rem', marginTop: '0.5rem', resize: 'vertical' }}
          />
        </div>
      )}

      {error && <p style={{ color: '#b71c1c', fontStyle: 'italic' }}>{error}</p>}

      {signedTransaction && (
        <>
          <h3>Signed transaction</h3>
          <pre
            data-testid={dataTestIds.testPage.signSep41MuxedTransfer.signedTransaction}
            className="signedTransactions"
          >
            {signedTransaction}
          </pre>
        </>
      )}
    </div>
  );
};
