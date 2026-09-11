import React, { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
import * as Location from 'expo-location';
import { Linking, AppState } from 'react-native';
import { useLogger } from '../hooks/useLogger';
import { useAlert } from './AlertContext';

// Shared location-permission/services state — previously local to a
// side-effect-only component, so nothing else in the app (e.g. MapScreen's
// GPS precision policy) could react to a permission being revoked mid-trip
// or to the app coming back from Settings.
const LocationAccessContext = createContext(null);

export const useLocationAccess = () => {
  const context = useContext(LocationAccessContext);
  if (!context) {
    throw new Error('useLocationAccess must be used within a LocationAccessProvider');
  }
  return context;
};

export const LocationAccessProvider = ({ children }) => {
  const logger = useLogger('LocationAccessContext');
  const { showAlert } = useAlert();
  const [access, setAccess] = useState({ granted: false, servicesEnabled: false });
  const [isChecking, setIsChecking] = useState(true);
  const permissionDeniedRef = useRef(false);
  const gpsAlertShownRef = useRef(false);
  const permissionAlertShownRef = useRef(false);
  const checkingRef = useRef(false);
  const retryTimeoutRef = useRef(null);
  const mountedRef = useRef(true);

  const isLocationReady = access.granted && access.servicesEnabled;

  const showMandatoryGPSAlert = useCallback(() => {
    showAlert({
      type: 'warning',
      title: 'GPS Obrigatório',
      message: 'O GPS está desativado. Pode continuar e escolher os pontos manualmente no mapa, ou ativar o GPS nas definições para uma experiência melhor.',
      buttons: [
        { text: 'Configurações', onPress: () => Linking.openSettings() },
        { text: 'Continuar sem GPS', style: 'cancel' },
      ],
    });
  }, [showAlert]);

  const showMandatoryPermissionAlert = useCallback(() => {
    showAlert({
      type: 'warning',
      title: 'Permissão de Localização',
      message: 'Sem acesso à localização não conseguimos centrar o mapa na sua posição, mas pode continuar e escolher os pontos manualmente. Pode conceder a permissão nas definições a qualquer momento.',
      buttons: [
        { text: 'Configurações', onPress: () => Linking.openSettings() },
        { text: 'Continuar sem GPS', style: 'cancel' },
      ],
    });
  }, [showAlert]);

  const checkLocationServices = useCallback(async () => {
    if (!mountedRef.current || checkingRef.current) return false;
    checkingRef.current = true;
    setIsChecking(true);
    try {
      const isGPSEnabled = await Location.hasServicesEnabledAsync();
      logger.info('GPS services status', { enabled: isGPSEnabled });

      if (!isGPSEnabled) {
        logger.warn('GPS services are disabled');
        if (!mountedRef.current) return false;
        setAccess((prev) => ({ ...prev, servicesEnabled: false }));
        if (!gpsAlertShownRef.current) {
          gpsAlertShownRef.current = true;
          showMandatoryGPSAlert();
        }
        return false;
      }
      gpsAlertShownRef.current = false;

      let { status, canAskAgain } = await Location.getForegroundPermissionsAsync();
      logger.info('Current location permission status', { status, canAskAgain });

      if (status !== 'granted') {
        if (!canAskAgain || permissionDeniedRef.current) {
          logger.warn('Location permission denied');
          if (!mountedRef.current) return false;
          setAccess({ granted: false, servicesEnabled: true });
           if (!permissionAlertShownRef.current) {
             permissionAlertShownRef.current = true;
             showMandatoryPermissionAlert();
           }
          return false;
        }

        logger.info('Location permission not granted, requesting...');
        let requestResult = await Location.requestForegroundPermissionsAsync();
        logger.info('Permission request result', { status: requestResult.status });

        if (requestResult.status !== 'granted') {
          logger.warn('Permission to access location was denied');
          if (!mountedRef.current) return false;
          permissionDeniedRef.current = true;
          setAccess({ granted: false, servicesEnabled: true });
          if (!permissionAlertShownRef.current) {
            permissionAlertShownRef.current = true;
            showMandatoryPermissionAlert();
          }
          return false;
        }

        permissionDeniedRef.current = false;
        permissionAlertShownRef.current = false;
      } else {
        permissionDeniedRef.current = false;
        permissionAlertShownRef.current = false;
      }

      logger.info('Location services ready');
      if (!mountedRef.current) return false;
      setAccess({ granted: true, servicesEnabled: true });
      return true;
    } catch (error) {
      logger.error('Error checking location services', error);
      if (mountedRef.current) setAccess({ granted: false, servicesEnabled: false });
      return false;
    } finally {
      checkingRef.current = false;
      if (mountedRef.current) setIsChecking(false);
    }
  }, [logger, showMandatoryGPSAlert, showMandatoryPermissionAlert]);

  useEffect(() => {
    mountedRef.current = true;
    checkLocationServices();
    return () => {
      mountedRef.current = false;
      checkingRef.current = false;
    };
  }, [checkLocationServices]);

  // Re-check on EVERY foreground return, not only while not-yet-ready — a
  // permission or GPS toggle revoked mid-session (Settings, OS GPS switch)
  // must be caught, not just the first-run denial.
  useEffect(() => {
    const handleAppStateChange = (nextAppState) => {
      if (nextAppState !== 'active') return;
      if (retryTimeoutRef.current) clearTimeout(retryTimeoutRef.current);
      // Small delay so the OS has settled after returning from Settings.
      retryTimeoutRef.current = setTimeout(() => {
        retryTimeoutRef.current = null;
        checkLocationServices();
      }, 1000);
    };

    const subscription = AppState.addEventListener('change', handleAppStateChange);
    return () => {
      subscription?.remove();
      if (retryTimeoutRef.current) {
        clearTimeout(retryTimeoutRef.current);
        retryTimeoutRef.current = null;
      }
    };
  }, [checkLocationServices]);

  const value = useMemo(() => ({
    granted: access.granted,
    servicesEnabled: access.servicesEnabled,
    isLocationReady,
    isChecking,
    refreshLocationAccess: checkLocationServices,
  }), [access.granted, access.servicesEnabled, isLocationReady, isChecking, checkLocationServices]);

  return (
    <LocationAccessContext.Provider value={value}>
      {children}
    </LocationAccessContext.Provider>
  );
};
