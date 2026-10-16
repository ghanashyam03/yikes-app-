import { createContext, useContext } from 'react';

export interface ConnectivityContextValue {
  isConnected: boolean;
  setIsConnected: (connected: boolean) => void;
  checkConnection: () => Promise<boolean>;
}

export const ConnectivityContext = createContext<ConnectivityContextValue>({
  isConnected: true,
  setIsConnected: () => {},
  checkConnection: async () => true,
});

export function useConnectivity(): ConnectivityContextValue {
  return useContext(ConnectivityContext);
}
