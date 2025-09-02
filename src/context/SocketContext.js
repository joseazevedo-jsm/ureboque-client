import React, { createContext, useContext, useState, useEffect } from 'react';
import SocketService from '../services/SocketService';
import { useAuth } from './AuthContext';
import { useLogger } from '../hooks/useLogger';

const SocketContext = createContext();

export const useSocket = () => {
  const context = useContext(SocketContext);
  if (!context) {
    throw new Error('useSocket must be used within a SocketProvider');
  }
  return context;
};

export const SocketProvider = ({ children }) => {
  const logger = useLogger('SocketContext', { enableLifecycleLogging: true });
  const { userToken, isAuthenticated } = useAuth();
  const [socket, setSocket] = useState(null);
  const [isConnected, setIsConnected] = useState(false);

  const connectSocket = async (token) => {
    const timer = logger.startTimer('socket_connection');
    logger.info('Attempting socket connection');
    
    try {
      const socketConnection = await SocketService.connect(token);
      setSocket(socketConnection);
      setIsConnected(true);
      
      logger.info('Socket connection successful', { duration: timer.end() });
      logger.logStateChange('isConnected', false, true, 'connection_established');
    } catch (error) {
      logger.logError(error, { operation: 'socket_connection', duration: timer.end() });
      setIsConnected(false);
      logger.logStateChange('isConnected', null, false, 'connection_failed');
    }
  };

  const disconnectSocket = () => {
    logger.info('Disconnecting socket');
    
    SocketService.disconnect();
    setSocket(null);
    setIsConnected(false);
    
    logger.info('Socket disconnected successfully');
    logger.logStateChange('isConnected', true, false, 'manual_disconnect');
  };

  // Connect socket when user logs in
  useEffect(() => {
    if (isAuthenticated && userToken && !socket) {
      logger.debug('Auth state changed - connecting socket', { isAuthenticated, hasToken: !!userToken });
      connectSocket(userToken);
    }
  }, [isAuthenticated, userToken]);

  // Disconnect socket when user logs out
  useEffect(() => {
    if (!isAuthenticated && socket) {
      logger.debug('User logged out - disconnecting socket');
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