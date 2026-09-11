import React, { useContext, createContext, useState, useCallback, useMemo, useRef } from 'react';
import { useLogger } from '../hooks/useLogger';
import sentryService from '../services/SentryService';

const UserLocationStateContext = createContext(null);
const UserLocationValueContext = createContext(null);
const UserLocationActionsContext = createContext(null);
const MIN_LOCATION_DISTANCE_M = 20;
const MAX_LOCATION_AGE_MS = 5000;

const distanceInMeters = (a, b) => {
  if (!a || !b) return Infinity;
  const lat1 = Number(a.latitude) * Math.PI / 180;
  const lat2 = Number(b.latitude) * Math.PI / 180;
  const dLat = lat2 - lat1;
  const dLon = (Number(b.longitude) - Number(a.longitude)) * Math.PI / 180;
  const h = Math.sin(dLat / 2) ** 2 + Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLon / 2) ** 2;
  return 6371000 * 2 * Math.atan2(Math.sqrt(h), Math.sqrt(1 - h));
};

export const UserLocationStateContextProvider = ({ children }) => {
  const logger = useLogger('UserLocationStateContext', { enableLifecycleLogging: true });
  
  const useUserLocationStateContextValue = () => {
    const [userLocation, setUserLocation] = useState();
    const previousLocationRef = useRef(null);
    const lastPublishedLocationRef = useRef(null);
    const lastPublishedAtRef = useRef(0);
    const lastTelemetryLogRef = useRef(0);

    const loggedSetUserLocation = useCallback((location) => {
      const previousLocation = previousLocationRef.current;
      const now = Date.now();
      const shouldLogTelemetry = !location || now - lastTelemetryLogRef.current >= 30000;

      if (shouldLogTelemetry) {
        lastTelemetryLogRef.current = now;
        logger.info('User location updated', {
          hadPreviousLocation: !!previousLocation,
          hasNewLocation: !!location,
          accuracy: location?.accuracy,
          timestamp: location?.timestamp,
          type: 'location_update'
        });

        logger.logStateChange(
          'userLocation',
          previousLocation ? 'has_location' : 'no_location',
          location ? 'has_location' : 'no_location',
          location ? 'location_updated' : 'location_cleared'
        );

        try {
          if (location) {
            sentryService.setLocation({
              latitude: location.latitude,
              longitude: location.longitude,
              accuracy: location.accuracy,
              timestamp: location.timestamp || now
            });
            sentryService.addUserAction('location_updated', {
              accuracy: location.accuracy,
              hasCoordinates: Number.isFinite(Number(location.latitude)) &&
                Number.isFinite(Number(location.longitude)),
              provider: location.provider || 'unknown',
              locationAge: location.timestamp ? (now - location.timestamp) : 0
            });
          } else {
            sentryService.setContext('location', null);
            sentryService.addUserAction('location_cleared');
          }
        } catch (error) {
          logger.logError(error, { operation: 'sentry_location_update' });
        }
      }
      
      previousLocationRef.current = location;
      if (location) {
        const now = Date.now();
        const lastPublished = lastPublishedLocationRef.current;
        if (lastPublished &&
            now - lastPublishedAtRef.current < MAX_LOCATION_AGE_MS &&
            distanceInMeters(lastPublished, location) < MIN_LOCATION_DISTANCE_M) {
          return;
        }
        lastPublishedLocationRef.current = location;
        lastPublishedAtRef.current = now;
      } else {
        lastPublishedLocationRef.current = null;
        lastPublishedAtRef.current = 0;
      }
      setUserLocation(location);
    }, [logger]);

    return useMemo(() => ({ userLocation, setUserLocation: loggedSetUserLocation }), [userLocation, loggedSetUserLocation]);
  };

  const userLocationStateContextValue = useUserLocationStateContextValue();

  const value = useMemo(() => ({ userLocation: userLocationStateContextValue.userLocation }), [userLocationStateContextValue.userLocation]);
  const actions = useMemo(() => ({ setUserLocation: userLocationStateContextValue.setUserLocation }), [userLocationStateContextValue.setUserLocation]);
  return (
    <UserLocationActionsContext.Provider value={actions}>
      <UserLocationValueContext.Provider value={value}>
        <UserLocationStateContext.Provider value={userLocationStateContextValue}>
          {children}
        </UserLocationStateContext.Provider>
      </UserLocationValueContext.Provider>
    </UserLocationActionsContext.Provider>
  );
};

export const useUserLocation = () => {
  const context = useContext(UserLocationValueContext);
  if (!context) throw new Error('useUserLocation must be used inside UserLocationStateContextProvider');
  return context.userLocation;
};

export const useUserLocationActions = () => {
  const context = useContext(UserLocationActionsContext);
  if (!context) throw new Error('useUserLocationActions must be used inside UserLocationStateContextProvider');
  return context;
};

export const useUserLocationStateContext = () => {
  const context = useContext(UserLocationStateContext);

  if (!context) {
    throw new Error(
      'useUserLocationStateContext must be used inside UserLocationStateContextProvider',
    );
  }

  return context;
};
