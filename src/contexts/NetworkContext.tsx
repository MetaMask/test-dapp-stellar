import { type ReactNode, createContext, useCallback, useContext, useEffect, useState } from 'react';
import { DEFAULT_NETWORK, type NetworkKey, STELLAR_NETWORKS } from '../config';

interface NetworkContextType {
  selectedNetwork: NetworkKey;
  setSelectedNetwork: (network: NetworkKey) => void;
}

const NetworkContext = createContext<NetworkContextType | undefined>(undefined);

export const useNetwork = (): NetworkContextType => {
  const context = useContext(NetworkContext);
  if (!context) {
    throw new Error('useNetwork must be used within a NetworkProvider');
  }
  return context;
};

export const NetworkProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const getInitialNetwork = (): NetworkKey => {
    try {
      const saved = localStorage.getItem('stellar.selectedNetwork');
      if (saved && saved in STELLAR_NETWORKS) {
        return saved as NetworkKey;
      }
    } catch (error) {
      console.warn('Failed to read network from localStorage:', error);
    }
    return DEFAULT_NETWORK;
  };

  const [selectedNetwork, setSelectedNetworkState] = useState<NetworkKey>(getInitialNetwork);

  const setSelectedNetwork = useCallback((network: NetworkKey): void => {
    setSelectedNetworkState(network);
  }, []);

  useEffect(() => {
    try {
      localStorage.setItem('stellar.selectedNetwork', selectedNetwork);
    } catch (error) {
      console.warn('Failed to save network to localStorage:', error);
    }
  }, [selectedNetwork]);

  return <NetworkContext.Provider value={{ selectedNetwork, setSelectedNetwork }}>{children}</NetworkContext.Provider>;
};
