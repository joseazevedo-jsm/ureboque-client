import React, { createContext, useContext, useState, useEffect, useRef, useCallback, useMemo } from 'react';
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
  const isConnectingRef = useRef(false);
  const mountedRef = useRef(true);
  const authGenerationRef = useRef(0);
  const currentTokenRef = useRef(userToken);
  const authenticatedRef = useRef(isAuthenticated);
  const connectedTokenRef = useRef(null);

  useEffect(() => {
    currentTokenRef.current = userToken;
    authenticatedRef.current = isAuthenticated;
    authGenerationRef.current += 1;
  }, [userToken, isAuthenticated]);

  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
      SocketService.disconnect();
    };
  }, []);

  const connectSocket = useCallback(async (token) => {
    if (isConnectingRef.current) {
      logger.warn('Socket connection already in progress, skipping duplicate call');
      return;
    }
    isConnectingRef.current = true;
    const connectionGeneration = authGenerationRef.current;
    const timer = logger.startTimer('socket_connection');
    logger.info('Attempting socket connection');
    
    // Add Sentry breadcrumb for connection attempt
    sentryService.addSocketEvent('connection_attempt', {
      hasToken: !!token,
      timestamp: Date.now()
    });
    
    try {
      const socketConnection = await SocketService.connect(token);
      if (!mountedRef.current ||
          connectionGeneration !== authGenerationRef.current ||
          currentTokenRef.current !== token ||
          !authenticatedRef.current) {
        SocketService.disconnect();
        return;
      }
      setSocket(socketConnection);
      connectedTokenRef.current = token;
      // isConnected is driven by the socket's own connect/disconnect events
      // (wired in the effect below) — io() returns this object before the
      // handshake completes, so assuming success here would report "connected"
      // while the socket is still mid-handshake or has already failed.
      setIsConnected(!!socketConnection?.connected);

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
      if (mountedRef.current) setIsConnected(false);
      logger.logStateChange('isConnected', null, false, 'connection_failed');
    } finally {
      isConnectingRef.current = false;
    }
  }, [logger]);

  const disconnectSocket = useCallback(() => {
    logger.info('Disconnecting socket');
    
    // Add Sentry breadcrumb for disconnection
    sentryService.addSocketEvent('disconnection_attempt');
    
    try {
      SocketService.disconnect();
      if (mountedRef.current) {
        setSocket(null);
        setIsConnected(false);
      }
      connectedTokenRef.current = null;
      
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
  }, [logger]);

  // Track the socket's actual connection lifecycle — not just whether the
  // object exists — so isConnected reflects reality across drops/reconnects,
  // not only the initial handshake.
  useEffect(() => {
    if (!socket) return;

    const onConnect = () => {
      logger.debug('Socket connect event');
      if (mountedRef.current) setIsConnected(true);
    };
    const onDisconnect = (reason) => {
      logger.warn('Socket disconnect event', { reason });
      if (mountedRef.current) setIsConnected(false);
    };
    const onConnectError = (error) => {
      logger.warn('Socket connect_error event', { message: error?.message });
      if (mountedRef.current) setIsConnected(false);
    };

    socket.on('connect', onConnect);
    socket.on('disconnect', onDisconnect);
    socket.on('connect_error', onConnectError);
    if (socket.connected) onConnect();

    return () => {
      socket.off('connect', onConnect);
      socket.off('disconnect', onDisconnect);
      socket.off('connect_error', onConnectError);
    };
  }, [socket]);

  // Connect socket when user logs in
  useEffect(() => {
    if (isAuthenticated && userToken && socket && connectedTokenRef.current !== userToken) {
      logger.info('Auth token changed - reconnecting socket');
      disconnectSocket();
      return;
    }
    if (isAuthenticated && userToken && !socket) {
      logger.debug('Auth state changed - connecting socket', { isAuthenticated, hasToken: !!userToken });
      connectSocket(userToken);
    }
  }, [isAuthenticated, userToken, socket, connectSocket, disconnectSocket, logger]);

  // Disconnect socket when user logs out
  useEffect(() => {
    if (!isAuthenticated && socket) {
      logger.debug('User logged out - disconnecting socket');
      disconnectSocket();
    }
  }, [isAuthenticated]);

  const value = useMemo(() => ({
    socket,
    isConnected,
    connectSocket,
    disconnectSocket,
  }), [socket, isConnected, connectSocket, disconnectSocket]);

  return <SocketContext.Provider value={value}>{children}</SocketContext.Provider>;
};
