import React, { createContext, useContext, useState, useEffect } from 'react';
import SocketService from '../services/SocketService';
import { useAuth } from './AuthContext';

const SocketContext = createContext();

export const useSocket = () => {
  const context = useContext(SocketContext);
  if (!context) {
    throw new Error('useSocket must be used within a SocketProvider');
  }
  return context;
};

export const SocketProvider = ({ children }) => {
  const { userToken, isAuthenticated } = useAuth();
  const [socket, setSocket] = useState(null);
  const [isConnected, setIsConnected] = useState(false);

  const connectSocket = async (token) => {
    try {
      const socketConnection = await SocketService.connect(token);
      setSocket(socketConnection);
      setIsConnected(true);
    } catch (error) {
      console.error('Failed to connect socket:', error);
      setIsConnected(false);
    }
  };

  const disconnectSocket = () => {
    SocketService.disconnect();
    setSocket(null);
    setIsConnected(false);
  };

  // Connect socket when user logs in
  useEffect(() => {
    if (isAuthenticated && userToken && !socket) {
      connectSocket(userToken);
    }
  }, [isAuthenticated, userToken]);

  // Disconnect socket when user logs out
  useEffect(() => {
    if (!isAuthenticated && socket) {
      disconnectSocket();
    }
  }, [isAuthenticated]);

  const value = {
    socket,
    isConnected,
    connectSocket,
    disconnectSocket,
  };

  return <SocketContext.Provider value={value}>{children}</SocketContext.Provider>;
};