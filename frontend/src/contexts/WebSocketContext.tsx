import { createContext, useContext } from 'react';

interface WebSocketContextType {
  isConnected: boolean;
}

export const WebSocketContext = createContext<WebSocketContextType>({
  isConnected: false,
});

export function useWebSocketStatus() {
  return useContext(WebSocketContext);
}
