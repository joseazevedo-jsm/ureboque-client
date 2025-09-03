import React, { createContext, useContext, useState, useEffect } from 'react';
import SocketService from '../services/SocketService';
import { useAuth } from './AuthContext';
import { useLogger } from '../hooks/useLogger';
import sentryService from '../services/SentryService';

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
    
    // Add Sentry breadcrumb for connection attempt
    sentryService.addSocketEvent('connection_attempt', {
      hasToken: !!token,
      timestamp: Date.now()
    });
    
    try {
      const socketConnection = await SocketService.connect(token);
      setSocket(socketConnection);
      setIsConnected(true);
      
      // Add Sentry breadcrumb for successful connection
      sentryService.addSocketEvent('connection_success', {
        duration: timer.end(),
        socketId: socketConnection?.id || 'unknown'
      });
      
      // Set socket connection context in Sentry
      sentryService.setContext('socket', {
        connected: true,
        connectionTime: new Date().toISOString(),
        socketId: socketConnection?.id || 'unknown'
      });
      
      logger.info('Socket connection successful', { duration: timer.end() });
      logger.logStateChange('isConnected', false, true, 'connection_established');
    } catch (error) {
      // Capture socket connection error in Sentry
      sentryService.captureError(error, {
        socket: {
          operation: 'connect',
          duration: timer.end(),
          hasToken: !!token
        }
      }, { socket_operation: 'connect' });
      
      logger.logError(error, { operation: 'socket_connection', duration: timer.end() });
      setIsConnected(false);
      logger.logStateChange('isConnected', null, false, 'connection_failed');
    }
  };

  const disconnectSocket = () => {
    logger.info('Disconnecting socket');
    
    // Add Sentry breadcrumb for disconnection
    sentryService.addSocketEvent('disconnection_attempt');
    
    try {
      SocketService.disconnect();
      setSocket(null);
      setIsConnected(false);
      
      // Update socket context in Sentry
      sentryService.setContext('socket', {
        connected: false,
        disconnectionTime: new Date().toISOString()
      });
      
      sentryService.addSocketEvent('disconnection_success');
      
      logger.info('Socket disconnected successfully');
      logger.logStateChange('isConnected', true, false, 'manual_disconnect');
    } catch (error) {
      // Capture disconnection error in Sentry
      sentryService.captureError(error, {
        socket: {
          operation: 'disconnect'
        }
      }, { socket_operation: 'disconnect' });
      
      logger.logError(error, { operation: 'socket_disconnection' });
    }
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