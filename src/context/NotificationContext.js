import React, { createContext, useContext, useState, useEffect, useCallback, useMemo, useRef } from 'react';
import NotificationService from '../services/NotificationService';
import { useLogger } from '../hooks/useLogger';
import { AppState } from 'react-native';
import * as Notifications from 'expo-notifications';
import { navigate } from '../services/NavigationService';

const NotificationContext = createContext();

export const useNotification = () => {
  const context = useContext(NotificationContext);
  if (!context) {
    throw new Error('useNotification must be used within a NotificationProvider');
  }
  return context;
};

export const NotificationProvider = ({ children }) => {
  const logger = useLogger('NotificationContext');
  const [unreadMessageCount, setUnreadMessageCount] = useState(0);
  const [notificationPermissions, setNotificationPermissions] = useState(false);
  const mountedRef = useRef(true);

  // Initialize notification permissions and response handling on mount
  useEffect(() => {
    mountedRef.current = true;
    let subscription = null;
    
    try {
      // Request permissions
      NotificationService.requestPermissions()
        .then(granted => {
          if (!mountedRef.current) return;
          setNotificationPermissions(granted);
          logger.info('Notification permissions requested', { granted });
        })
        .catch(error => {
          logger.error('Failed to request notification permissions', error);
          // Set permissions to false on error to prevent further notification attempts
          if (mountedRef.current) setNotificationPermissions(false);
        });

      // Handle notification responses (when user taps notification)
      subscription = Notifications.addNotificationResponseReceivedListener(response => {
        const data = response.notification.request.content.data;
        if (data?.type === 'driver_message') {
          logger.info('User tapped driver message notification', { data });
        } else {
          logger.info('User tapped notification, navigating to Notifications screen', { data });
          navigate('Notificacoes');
        }
      });
    } catch (error) {
      logger.error('Failed to initialize notifications', error);
      // Graceful degradation - disable notifications but keep app working
      setNotificationPermissions(false);
    }

    return () => {
      mountedRef.current = false;
      if (subscription) {
        subscription.remove();
      }
    };
  }, [logger]);

  // Handle incoming messages for notifications
  const handleIncomingMessages = useCallback((messages, user, chatModalOpen = false) => {
    if (!mountedRef.current || !messages || messages.length === 0) return;

    // Only process if chat modal is closed
    if (chatModalOpen) return;

    // Filter messages from driver (not from user)
    const driverMessages = messages.filter(msg => msg.message?.sender !== user?.id);
    
    if (driverMessages.length > 0) {
      logger.info('Processing driver messages for notifications', { 
        count: driverMessages.length,
        chatOpen: chatModalOpen 
      });

      // Update unread count
      setUnreadMessageCount(prev => prev + driverMessages.length);

      // The in-app unread badge handles foreground messages. Only show a
      // system notification while the app is backgrounded.
      if (notificationPermissions && AppState.currentState !== 'active') {
        NotificationService.showDriverMessageNotification(driverMessages.length)
          .catch(error => logger.error('Failed to show notification', error));
      }
    }
  }, [notificationPermissions, logger]);

  // Reset unread count (when chat opens)
  const resetUnreadCount = useCallback(() => {
    if (!mountedRef.current) return;
    logger.info('Resetting unread message count');
    setUnreadMessageCount(0);
  }, [logger]);

  // Increment unread count manually
  const incrementUnreadCount = useCallback((count = 1) => {
    if (!mountedRef.current) return;
    setUnreadMessageCount(prev => prev + count);
  }, []);

  const setUnreadMessageCountSafe = useCallback((value) => {
    if (!mountedRef.current) return;
    setUnreadMessageCount(value);
  }, []);

  const contextValue = useMemo(() => ({
    // State
    unreadMessageCount,
    notificationPermissions,
    
    // Actions
    handleIncomingMessages,
    resetUnreadCount,
    incrementUnreadCount,
    setUnreadMessageCount: setUnreadMessageCountSafe,
  }), [unreadMessageCount, notificationPermissions, handleIncomingMessages, resetUnreadCount, incrementUnreadCount, setUnreadMessageCountSafe]);

  return (
    <NotificationContext.Provider value={contextValue}>
      {children}
    </NotificationContext.Provider>
  );
};
