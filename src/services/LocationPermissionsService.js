import { useEffect, useRef, useState } from 'react';
import * as Location from 'expo-location';
import { Linking, AppState } from 'react-native';
import { useLogger } from '../hooks/useLogger';
import { useAlert } from '../context/AlertContext';

export const LocationPermissionsService = () => {
  const logger = useLogger('LocationPermissionsService');
  const { showAlert } = useAlert();
  const [isLocationReady, setIsLocationReady] = useState(false);
  const permissionDeniedRef = useRef(false);
  const checkingRef = useRef(false);

  const showMandatoryGPSAlert = () => {
    showAlert({
      type: 'warning',
      title: 'GPS Obrigatório',
      message: 'Este aplicativo não pode funcionar sem o GPS ativado. Por favor, ative o GPS nas configurações.',
      buttons: [
        {
          text: 'Configurações',
          onPress: () => {
            Linking.openSettings();
          },
        },
      ],
      cancelable: false
    });
  };

  const showMandatoryPermissionAlert = () => {
    showAlert({
      type: 'warning',
      title: 'Permissão Obrigatória',
      message: 'Este aplicativo precisa de acesso à localização para funcionar. Por favor, conceda a permissão nas configurações.',
      buttons: [
        {
          text: 'Configurações',
          onPress: () => {
            Linking.openSettings();
          },
        },
      ],
      cancelable: false
    });
  };

  const checkLocationServices = async () => {
    if (checkingRef.current) {
      return false;
    }

    checkingRef.current = true;
    try {
      // Check if GPS/location services are enabled
      const isGPSEnabled = await Location.hasServicesEnabledAsync();
      logger.info('GPS services status', { enabled: isGPSEnabled });

      if (!isGPSEnabled) {
        logger.warn('GPS services are disabled - showing mandatory alert');
        showMandatoryGPSAlert();
        setIsLocationReady(false);
        return false;
      }

      // Check current permission status
      let { status, canAskAgain } = await Location.getForegroundPermissionsAsync();
      logger.info('Current location permission status', { status, canAskAgain });

      if (status !== 'granted') {
        if (!canAskAgain || permissionDeniedRef.current) {
          logger.warn('Location permission denied - showing mandatory alert');
          showMandatoryPermissionAlert();
          setIsLocationReady(false);
          return false;
        }

        logger.info('Location permission not granted, requesting...');

        // Request permission
        let requestResult = await Location.requestForegroundPermissionsAsync();
        logger.info('Permission request result', { status: requestResult.status });

        if (requestResult.status !== 'granted') {
          logger.warn('Permission to access location was denied - showing mandatory alert');
          permissionDeniedRef.current = true;
          showMandatoryPermissionAlert();
          setIsLocationReady(false);
          return false;
        }

        permissionDeniedRef.current = false;
        logger.info('Location permission granted');
      } else {
        permissionDeniedRef.current = false;
        logger.info('Location permission already granted');
      }

      logger.info('Location services ready');
      setIsLocationReady(true);
      return true;
    } catch (error) {
      logger.error('Error setting up location services', error);
      setIsLocationReady(false);
      return false;
    } finally {
      checkingRef.current = false;
    }
  };

  useEffect(() => {
    checkLocationServices();
  }, []);

  // Re-check when app becomes active (user returns from settings)
  useEffect(() => {
    const handleAppStateChange = (nextAppState) => {
      if (nextAppState === 'active' && !isLocationReady) {
        // Small delay to ensure system has updated after returning from settings
        setTimeout(() => {
          checkLocationServices();
        }, 1000);
      }
    };

    const subscription = AppState.addEventListener('change', handleAppStateChange);
    return () => subscription?.remove();
  }, [isLocationReady]);

  return null;
};
