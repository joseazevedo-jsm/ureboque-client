import * as Notifications from 'expo-notifications';
import { Platform, AppState } from 'react-native';
import Logger from '../utils/Logger';

// Configure notification handler
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
  }),
});

class NotificationService {
  constructor() {
    this.permissionGranted = false;
  }

  // Request notification permissions
  async requestPermissions() {
    try {
      // Check if the native module is available
      if (!Notifications.getPermissionsAsync) {
        console.warn('Expo notifications module not available - native module may need to be rebuilt');
        this.permissionGranted = false;
        return false;
      }

      const { status: existingStatus } = await Notifications.getPermissionsAsync();
      let finalStatus = existingStatus;
      
      if (existingStatus !== 'granted') {
        const { status } = await Notifications.requestPermissionsAsync();
        finalStatus = status;
      }
      
      this.permissionGranted = finalStatus === 'granted';
      
      if (Platform.OS === 'android') {
        await Notifications.setNotificationChannelAsync('driver-messages', {
          name: 'Driver Messages',
          importance: Notifications.AndroidImportance.HIGH,
          vibrationPattern: [0, 250, 250, 250],
          lightColor: '#0089FF',
        });
      }
      
      return this.permissionGranted;
     } catch (error) {
       Logger.error(this.componentName, 'Error requesting notification permissions', { error });
       // If this is the ExpoPushTokenManager error, provide helpful guidance
       if (error.message && error.message.includes('ExpoPushTokenManager')) {
        Logger.error(this.componentName, 'Native module ExpoPushTokenManager not found. You may need to rebuild your development client with: npx expo run:android or npx expo run:ios');
       }
       this.permissionGranted = false;
       return false;
     }
  }

  // Schedule a local notification
  async scheduleNotification({ title, body, data = {} }) {
    if (!this.permissionGranted) {
      Logger.warn(this.componentName, 'Notification permissions not granted');
      return;
    }

    try {
      // Check if the native module is available before attempting to schedule
      if (!Notifications.scheduleNotificationAsync) {
        Logger.warn(this.componentName, 'Expo notifications module not available for scheduling');
        return;
      }

      await Notifications.scheduleNotificationAsync({
        content: {
          title,
          body,
          data,
          sound: true,
        },
        trigger: null, // Show immediately
      });
    } catch (error) {
      Logger.error(this.componentName, 'Error scheduling notification', { error });
      if (error.message && error.message.includes('ExpoPushTokenManager')) {
        Logger.error(this.componentName, 'Native module ExpoPushTokenManager not found. You may need to rebuild your development client.');
      }
    }
  }

  // Show notification for driver message
  async showDriverMessageNotification(messageCount = 1) {
    // Only show notification if app is in background or inactive
    const appState = AppState.currentState;
    if (appState === 'active') {
      Logger.debug(this.componentName, 'App is active, skipping notification');
      return;
    }

    const title = 'Ureboque';
    const body = messageCount === 1 
      ? 'Voce recebeu uma nova mensagem do motorista '
      : `You have ${messageCount} new messages from your driver`;
    
    await this.scheduleNotification({
      title,
      body,
      data: { type: 'driver_message', count: messageCount }
    });
  }

  // Cancel all notifications
  async cancelAllNotifications() {
    try {
      await Notifications.cancelAllScheduledNotificationsAsync();
    } catch (error) {
      Logger.error(this.componentName, 'Error canceling notifications', { error });
    }
  }
}

export default new NotificationService();