import { useState, useCallback, useSyncExternalStore, useRef, useEffect } from 'react';
import api from '../services/APIService';
import ErrorService from '../services/ErrorService';
import { useLogger } from './useLogger';
import { DRIVER_SEARCH_RADIUS_M } from '../constants/config';

let driverLocationSnapshot = null;
const driverLocationListeners = new Set();

// When the last position arrived, tracked separately from the snapshot so that
// re-stamping it on a duplicate packet does not change the snapshot's identity
// (which would re-render the marker for no visual reason).
let driverLocationReceivedAt = 0;

const subscribeDriverLocation = (listener) => {
  driverLocationListeners.add(listener);
  return () => driverLocationListeners.delete(listener);
};

export const getDriverLocationReceivedAt = () => driverLocationReceivedAt;

export const setDriverLocation = (location) => {
  if (!location) {
    driverLocationReceivedAt = 0;
    if (driverLocationSnapshot !== null) {
      driverLocationSnapshot = null;
      driverLocationListeners.forEach((listener) => listener());
    }
    return;
  }

  // Any packet, including one repeating the current position, proves the driver
  // is still reporting.
  driverLocationReceivedAt = Date.now();

  if (driverLocationSnapshot &&
      location.latitude === driverLocationSnapshot.latitude &&
      location.longitude === driverLocationSnapshot.longitude &&
      location.heading === driverLocationSnapshot.heading) {
    return;
  }
  driverLocationSnapshot = location;
  driverLocationListeners.forEach((listener) => listener());
};

export const useDriverLocation = () => useSyncExternalStore(
  subscribeDriverLocation,
  () => driverLocationSnapshot,
  () => null,
);

// A driver marker that stops moving is ambiguous: parked, or crashed/offline
// with a position that is no longer true. Age the last packet so the map can
// say which. Polled rather than pushed — silence is exactly the case to detect.
export const useDriverLocationStale = (staleAfterMs = 60000, tickMs = 10000) => {
  const [isStale, setIsStale] = useState(false);

  useEffect(() => {
    const check = () => {
      const receivedAt = getDriverLocationReceivedAt();
      setIsStale(receivedAt > 0 && Date.now() - receivedAt > staleAfterMs);
    };
    check();
    const timer = setInterval(check, tickMs);
    return () => clearInterval(timer);
  }, [staleAfterMs, tickMs]);

  return isStale;
};

export const useMapDrivers = ({ userLocation, tripService, tripServiceRef: externalTripServiceRef }) => {
  const logger = useLogger('useMapDrivers');
  const [carsAround, setCarsAround] = useState([]);
  const [isLoadingDrivers, setIsLoadingDrivers] = useState(false);
  const mountedRef = useRef(true);
  const requestGenerationRef = useRef(0);
  const localTripServiceRef = useRef(tripService);
  const tripServiceRef = externalTripServiceRef || localTripServiceRef;

  useEffect(() => {
    tripServiceRef.current = tripService;
    requestGenerationRef.current += 1;
    if (tripService) setCarsAround([]);
  }, [tripService]);

  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
      requestGenerationRef.current += 1;
      setDriverLocation(null);
    };
  }, []);

  const getNearbyDrivers = useCallback(async () => {
    const latitude = Number(userLocation?.latitude);
    const longitude = Number(userLocation?.longitude);
    if (!mountedRef.current || isLoadingDrivers || tripService ||
        !Number.isFinite(latitude) || !Number.isFinite(longitude)) return;

    setIsLoadingDrivers(true);
    const requestGeneration = requestGenerationRef.current;
    try {
      const resp = await api.get('/drivers/nearby', {
        params: {
          latitude,
          longitude,
          maxDistance: DRIVER_SEARCH_RADIUS_M,
        },
      });
      if (!Array.isArray(resp.data) || requestGeneration !== requestGenerationRef.current || tripServiceRef.current) return;
      logger.info('Nearby drivers found', { count: resp.data?.length });
      const nearbyDrivers = resp.data
        .map((d) => ({
          latitude: Number(d?.location?.latitude),
          longitude: Number(d?.location?.longitude),
          color: d.driver?.car?.color,
        }))
        .filter((d) => Number.isFinite(d.latitude) && Number.isFinite(d.longitude));
      if (mountedRef.current && requestGeneration === requestGenerationRef.current && !tripServiceRef.current) {
        setCarsAround(nearbyDrivers);
      }
    } catch (error) {
      // A background 20s poll failing must never interrupt the user with a
      // modal alert — that would repeat every cycle on a degraded network.
      // Log it; the map simply keeps showing the last-known nearby cars.
      ErrorService.handleAPIError(error, false);
    } finally {
      if (mountedRef.current) setIsLoadingDrivers(false);
    }
  }, [isLoadingDrivers, tripService, userLocation]);

  const clearCarsAround = useCallback(() => setCarsAround([]), []);

  return {
    carsAround,
    isLoadingDrivers,
    setDriverLocation,
    getNearbyDrivers,
    clearCarsAround,
  };
};
