import React, { useContext, createContext, useState } from 'react';
import { useLogger } from '../hooks/useLogger';
import sentryService from '../services/SentryService';

const UserLocationStateContext = createContext(null);

export const UserLocationStateContextProvider = ({ children }) => {
  const logger = useLogger('UserLocationStateContext', { enableLifecycleLogging: true });
  
  const useUserLocationStateContextValue = () => {
    const [userLocation, setUserLocation] = useState();

    const loggedSetUserLocation = (location) => {
      const previousLocation = userLocation;
      
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
      
      // Update Sentry location context
      try {
        if (location) {
          sentryService.setLocation({
            latitude: location.latitude,
            longitude: location.longitude,
            accuracy: location.accuracy,
            timestamp: location.timestamp || Date.now()
          });
          
          // Add breadcrumb for location update
          sentryService.addUserAction('location_updated', {
            accuracy: location.accuracy,
            hasCoordinates: !!(location.latitude && location.longitude),
            provider: location.provider || 'unknown',
            locationAge: location.timestamp ? (Date.now() - location.timestamp) : 0
          });
        } else {
          // Location cleared
          sentryService.setContext('location', null);
          sentryService.addUserAction('location_cleared');
        }
      } catch (error) {
        logger.logError(error, { operation: 'sentry_location_update' });
      }
      
      setUserLocation(location);
    };

    return { userLocation, setUserLocation: loggedSetUserLocation };
  };

  const userLocationStateContextValue = useUserLocationStateContextValue();

  return (
    <UserLocationStateContext.Provider value={userLocationStateContextValue}>
      {children}
    </UserLocationStateContext.Provider>
  );
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
