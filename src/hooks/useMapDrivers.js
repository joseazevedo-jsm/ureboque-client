import { useState, useCallback } from 'react';
import api from '../services/APIService';
import ErrorService from '../services/ErrorService';
import { useLogger } from './useLogger';
import { DRIVER_SEARCH_RADIUS_M } from '../constants/config';

export const useMapDrivers = ({ userLocation, tripService }) => {
  const logger = useLogger('useMapDrivers');
  const [carsAround, setCarsAround] = useState([]);
  const [isLoadingDrivers, setIsLoadingDrivers] = useState(false);
  const [driverLocation, setDriverLocation] = useState(null);

  const getNearbyDrivers = useCallback(async () => {
    if (isLoadingDrivers || tripService) return;

    setIsLoadingDrivers(true);
    try {
      const resp = await api.get('/drivers/nearby', {
        params: {
          latitude: userLocation?.latitude,
          longitude: userLocation?.longitude,
          maxDistance: DRIVER_SEARCH_RADIUS_M,
        },
      });
      logger.info('Nearby drivers found', { count: resp.data?.length });
      const nearbyDrivers = resp.data.map((d) => ({
        latitude: d.location.latitude,
        longitude: d.location.longitude,
        color: d.driver?.car?.color,
      }));
      setCarsAround(nearbyDrivers);
    } catch (error) {
      ErrorService.handleAPIError(error);
    } finally {
      setIsLoadingDrivers(false);
    }
  }, [isLoadingDrivers, tripService, userLocation]);

  const clearCarsAround = useCallback(() => setCarsAround([]), []);

  return {
    carsAround,
    isLoadingDrivers,
    driverLocation,
    setDriverLocation,
    getNearbyDrivers,
    clearCarsAround,
  };
};
