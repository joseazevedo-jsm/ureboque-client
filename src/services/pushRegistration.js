import * as Notifications from 'expo-notifications';
import Constants from 'expo-constants';
import { Platform } from 'react-native';

// Sends this phone's Expo push token to the API, so scheduled-tow updates
// reach the app while it is closed. Without Firebase credentials in the build
// no token can be issued; that is not an error, the app just gets no pushes.
let registeredToken = null;

export const registerPushToken = async (api) => {
  try {
    let { status } = await Notifications.getPermissionsAsync();
    if (status !== 'granted') ({ status } = await Notifications.requestPermissionsAsync());
    if (status !== 'granted') return null;
    if (Platform.OS === 'android') {
      // The API sends to this channel.
      await Notifications.setNotificationChannelAsync('default', {
        name: 'Reboques', importance: Notifications.AndroidImportance.HIGH,
      });
    }
    const projectId = Constants.expoConfig?.extra?.eas?.projectId;
    const { data: token } = await Notifications.getExpoPushTokenAsync(projectId ? { projectId } : undefined);
    await api.put('/notifications/push-token', { token });
    registeredToken = token;
    return token;
  } catch (error) {
    return null;
  }
};

// Called on logout, while the session token still authorizes the request.
export const unregisterPushToken = async (api) => {
  const token = registeredToken;
  registeredToken = null;
  if (!token) return;
  try {
    await api.delete('/notifications/push-token', { data: { token } });
  } catch (error) {
    // The API also moves a token to whoever signs in on the device next.
  }
};
