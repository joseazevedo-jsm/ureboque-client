import { useState, useCallback, useRef } from 'react';
import { useLogger } from './useLogger';
import { DISTANCE_CACHE_MAX } from '../constants/config';

function toRadians(degrees) {
  return (degrees * Math.PI) / 180;
}

export const useMapRouting = () => {
  const logger = useLogger('useMapRouting');
  const [directions, setDirections] = useState(null);
  const [routeCoordinates, setRouteCoordinates] = useState([]);
  const [currentRoute, setCurrentRoute] = useState([]);
  const distanceCache = useRef(new Map());
  const lastDirectionsKeyRef = useRef(null);

  const getDistanceInKm = useCallback((pickup, drop) => {
    const pickupLatitude = Number(pickup?.latitude);
    const pickupLongitude = Number(pickup?.longitude);
    const dropLatitude = Number(drop?.latitude);
    const dropLongitude = Number(drop?.longitude);
    if (!Number.isFinite(pickupLatitude) || !Number.isFinite(pickupLongitude) ||
        !Number.isFinite(dropLatitude) || !Number.isFinite(dropLongitude)) {
      return Infinity;
    }
    const key = `${pickupLatitude.toFixed(6)},${pickupLongitude.toFixed(6)}-${dropLatitude.toFixed(6)},${dropLongitude.toFixed(6)}`;
    if (distanceCache.current.has(key)) return distanceCache.current.get(key);

    const dLat = toRadians(dropLatitude - pickupLatitude);
    const dLon = toRadians(dropLongitude - pickupLongitude);
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(toRadians(pickupLatitude)) *
      Math.cos(toRadians(dropLatitude)) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
    const distance = 6371 * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

    distanceCache.current.set(key, distance);
    if (distanceCache.current.size > DISTANCE_CACHE_MAX) {
      distanceCache.current.delete(distanceCache.current.keys().next().value);
    }
    return distance;
  }, []);

  const getSlicedRoute = useCallback((currentLocation, coordinates) => {
    if (!currentLocation || !coordinates || coordinates.length < 2) return coordinates;
    const validCoordinates = coordinates.filter((point) =>
      Number.isFinite(Number(point?.latitude)) && Number.isFinite(Number(point?.longitude))
    );
    if (validCoordinates.length < 2) return [];

    let closestIndex = 0;
    let minDistance = Infinity;
    // Search the complete route. Limiting this to the first 50 points makes
    // the marker jump backwards after a long trip has passed that segment.
    const searchRange = validCoordinates.length;

    for (let i = 0; i < searchRange; i++) {
      const dist = getDistanceInKm(currentLocation, validCoordinates[i]);
      if (dist < minDistance) {
        minDistance = dist;
        closestIndex = i;
      }
    }

    return [currentLocation, ...validCoordinates.slice(closestIndex)];
  }, [getDistanceInKm]);

  const handleMapDirectionsReady = useCallback((routeInfo) => {
    logger.info('Directions ready', { duration: routeInfo?.duration });
    if (Array.isArray(routeInfo?.coordinates) && routeInfo.coordinates.length >= 2) {
      const first = routeInfo.coordinates[0];
      const last = routeInfo.coordinates[routeInfo.coordinates.length - 1];
      if (!Number.isFinite(Number(first?.latitude)) || !Number.isFinite(Number(first?.longitude)) ||
          !Number.isFinite(Number(last?.latitude)) || !Number.isFinite(Number(last?.longitude))) {
        return routeInfo?.duration ?? null;
      }
      const routeKey = `${first.latitude},${first.longitude}:${last.latitude},${last.longitude}`;
      if (lastDirectionsKeyRef.current === routeKey) return routeInfo?.duration ?? null;
      lastDirectionsKeyRef.current = routeKey;
      setDirections(routeInfo);
      setRouteCoordinates(routeInfo.coordinates);
      setCurrentRoute(routeInfo.coordinates);
    }
    return routeInfo?.duration ?? null;
  }, []);

  const updateCurrentRoute = useCallback((newRoute) => setCurrentRoute(newRoute), []);

  const clearRoute = useCallback(() => {
    lastDirectionsKeyRef.current = null;
    setDirections(null);
    setRouteCoordinates([]);
    setCurrentRoute([]);
  }, []);

  return {
    directions,
    routeCoordinates,
    currentRoute,
    setDirections,
    updateCurrentRoute,
    clearRoute,
    getDistanceInKm,
    getSlicedRoute,
    handleMapDirectionsReady,
  };
};
