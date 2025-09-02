import {useEffect} from 'react';
import * as Location from 'expo-location';
import { useLogger } from '../hooks/useLogger';

export const LocationPermissionsService = () => {
  const logger = useLogger('LocationPermissionsService');
  
  useEffect(() => {
    (async () => {
      let {status} = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        logger.warn('Permission to access location was denied');
        return;
      }
    })();
  }, []);

  return null;
};