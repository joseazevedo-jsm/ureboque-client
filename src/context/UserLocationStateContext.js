import React, { useContext, createContext, useState } from 'react';
import { useLogger } from '../hooks/useLogger';

const UserLocationStateContext = createContext(null);

export const UserLocationStateContextProvider = ({ children }) => {
  const logger = useLogger('UserLocationStateContext', { enableLifecycleLogging: true });
  
  const useUserLocationStateContextValue = () => {
    const [userLocation, setUserLocation] = useState();

    const loggedSetUserLocation = (location) => {
      const previousLocation = userLocation;
      
      logger.info('User location updated', {
        previousLocation: previousLocation ? {
          latitude: previousLocation.latitude,
          longitude: previousLocation.longitude,
          accuracy: previousLocation.accuracy
        } : null,
        newLocation: location ? {
          latitude: location.latitude,
          longitude: location.longitude,
          accuracy: location.accuracy,
          timestamp: location.timestamp
        } : null,
        type: 'location_update'
      });
      
      logger.logStateChange(
        'userLocation', 
        previousLocation ? 'has_location' : 'no_location',
        location ? 'has_location' : 'no_location',
        location ? 'location_updated' : 'location_cleared'
      );
      
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
