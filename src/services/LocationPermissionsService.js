import {useEffect} from 'react';
import * as Location from 'expo-location';
import { useLogger } from '../hooks/useLogger';

export const LocationPermissionsService = () => {
  const logger = useLogger('LocationPermissionsService');
  
  useEffect(() => {
    (async () => {
      // First check if we already have permissions
      let {status} = await Location.getForegroundPermissionsAsync();
      
      if (status !== 'granted') {
        logger.info('Location permission not granted, requesting...');
        // Only request if we don't have permission
        let requestResult = await Location.requestForegroundPermissionsAsync();
        if (requestResult.status !== 'granted') {
          logger.warn('Permission to access location was denied');
          return;
        }
        logger.info('Location permission granted');
      } else {
        logger.info('Location permission already granted');
      }
    })();
  }, []);

  return null;
};