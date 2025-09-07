import React, { createContext, useContext, useState, useEffect } from 'react';
import NotificationService from '../services/NotificationService';
import { useLogger } from '../hooks/useLogger';
import { AppState } from 'react-native';
import * as Notifications from 'expo-notifications';

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

  // Initialize notification permissions and response handling on mount
  useEffect(() => {
    let subscription = null;
    
    try {
      // Request permissions
      NotificationService.requestPermissions()
        .then(granted => {
          setNotificationPermissions(granted);
          logger.info('Notification permissions requested', { granted });
        })
        .catch(error => {
          logger.error('Failed to request notification permissions', error);
          // Set permissions to false on error to prevent further notification attempts
          setNotificationPermissions(false);
        });

      // Handle notification responses (when user taps notification)
      subscription = Notifications.addNotificationResponseReceivedListener(response => {
        const data = response.notification.request.content.data;
        if (data?.type === 'driver_message') {
          logger.info('User tapped driver message notification', { data });
          // Navigation to chat would be handled by the main navigation system
          // You can add navigation logic here if needed
        }
      });
    } catch (error) {
      logger.error('Failed to initialize notifications', error);
      // Graceful degradation - disable notifications but keep app working
      setNotificationPermissions(false);
    }

    return () => {
      if (subscription) {
        subscription.remove();
      }
    };
  }, [logger]);

  // Handle incoming messages for notifications
  const handleIncomingMessages = (messages, user, chatModalOpen = false) => {
    if (!messages || messages.length === 0) return;

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

      // Show notification if app is in background
      if (notificationPermissions) {
        NotificationService.showDriverMessageNotification(driverMessages.length)
          .catch(error => logger.error('Failed to show notification', error));
      }
    }
  };

  // Reset unread count (when chat opens)
  const resetUnreadCount = () => {
    logger.info('Resetting unread message count');
    setUnreadMessageCount(0);
  };

  // Increment unread count manually
  const incrementUnreadCount = (count = 1) => {
    setUnreadMessageCount(prev => prev + count);
  };

  const contextValue = {
    // State
    unreadMessageCount,
    notificationPermissions,
    
    // Actions
    handleIncomingMessages,
    resetUnreadCount,
    incrementUnreadCount,
    setUnreadMessageCount,
  };

  return (
    <NotificationContext.Provider value={contextValue}>
      {children}
    </NotificationContext.Provider>
  );
};