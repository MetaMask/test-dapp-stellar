import { useEffect, useRef } from 'react';
import { useWalletState } from '../contexts/WalletContext';

/**
 * Attempts to restore a previous SEP-0043 session on mount.
 * Call once from a top-level component (e.g. AppContent).
 */
export function useAutoReconnect() {
  const { mode, adapter, setAddress, setConnected } = useWalletState();
  const hasAttempted = useRef(false);

  useEffect(() => {
    if (mode !== 'sep043' || !adapter || hasAttempted.current) {
      return;
    }

    hasAttempted.current = true;

    const restore = async () => {
      const { isConnected } = await adapter.isConnected();
      if (!isConnected) {
        return;
      }
      const { address, error } = await adapter.getAddress();
      if (!error && address) {
        setAddress(address);
        setConnected(true);
      }
    };

    void restore();
  }, [mode, adapter, setAddress, setConnected]);
}
