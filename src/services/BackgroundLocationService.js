import * as Location from 'expo-location';
import * as TaskManager from 'expo-task-manager';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { colors } from '../theme';

export const BACKGROUND_LOCATION_TASK = 'ureboque-background-location';
const LAST_BACKGROUND_LOCATION_KEY = 'ureboque:last-background-location';

// Background task name used by older app versions. Android keeps a registered
// task across updates, so it kept waking the app in a second JS runtime that
// had no handler for it — and that runtime could knock the trip sheet off the
// screen. Unregister it once so it never fires again.
const LEGACY_LOCATION_TASK = 'LOCATION_TASK';

let locationSink = null;

TaskManager.isTaskRegisteredAsync(LEGACY_LOCATION_TASK)
  .then((registered) => registered && TaskManager.unregisterTaskAsync(LEGACY_LOCATION_TASK))
  .catch(() => {});

if (!TaskManager.isTaskDefined(BACKGROUND_LOCATION_TASK)) {
  TaskManager.defineTask(BACKGROUND_LOCATION_TASK, async ({ data, error }) => {
    if (error) return;
    const location = data?.locations?.[data.locations.length - 1];
    if (!location?.coords) return;
    const snapshot = { ...location.coords, timestamp: location.timestamp };
    await AsyncStorage.setItem(LAST_BACKGROUND_LOCATION_KEY, JSON.stringify(snapshot));
    locationSink?.(snapshot);
  });
}

export const setBackgroundLocationSink = (sink) => {
  locationSink = typeof sink === 'function' ? sink : null;
};

export const getLastBackgroundLocation = async () => {
  const raw = await AsyncStorage.getItem(LAST_BACKGROUND_LOCATION_KEY);
  if (!raw) return null;
  try {
    return JSON.parse(raw);
  } catch {
    return null;
  }
};

export const startBackgroundLocation = async () => {
  const foreground = await Location.getForegroundPermissionsAsync();
  if (foreground.status !== 'granted') return false;
  const background = await Location.requestBackgroundPermissionsAsync();
  if (background.status !== 'granted') return false;
  const started = await Location.hasStartedLocationUpdatesAsync(BACKGROUND_LOCATION_TASK);
  if (!started) {
    await Location.startLocationUpdatesAsync(BACKGROUND_LOCATION_TASK, {
      accuracy: Location.Accuracy.Balanced,
      distanceInterval: 25,
      timeInterval: 10000,
      pausesUpdatesAutomatically: true,
      foregroundService: {
        notificationTitle: 'Reboque em andamento',
        notificationBody: 'A localização está a ser atualizada para acompanhar o serviço.',
        notificationColor: colors.error,
      },
    });
  }
  return true;
};

export const stopBackgroundLocation = async () => {
  if (await Location.hasStartedLocationUpdatesAsync(BACKGROUND_LOCATION_TASK)) {
    await Location.stopLocationUpdatesAsync(BACKGROUND_LOCATION_TASK);
  }
  await AsyncStorage.removeItem(LAST_BACKGROUND_LOCATION_KEY);
};
