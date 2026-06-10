import { useState, useCallback, useRef } from 'react';
import { useLogger } from './useLogger';
import { DISTANCE_CACHE_MAX, ROUTE_SEARCH_RANGE } from '../constants/config';

function toRadians(degrees) {
  return (degrees * Math.PI) / 180;
}

export const useMapRouting = () => {
  const logger = useLogger('useMapRouting');
  const [directions, setDirections] = useState(null);
  const [routeCoordinates, setRouteCoordinates] = useState([]);
  const [currentRoute, setCurrentRoute] = useState([]);
  const distanceCache = useRef(new Map());

  const getDistanceInKm = useCallback((pickup, drop) => {
    if (!pickup?.latitude || !pickup?.longitude || !drop?.latitude || !drop?.longitude) {
      return 0;
    }
    const key = `${pickup.latitude.toFixed(6)},${pickup.longitude.toFixed(6)}-${drop.latitude.toFixed(6)},${drop.longitude.toFixed(6)}`;
    if (distanceCache.current.has(key)) return distanceCache.current.get(key);

    const dLat = toRadians(drop.latitude - pickup.latitude);
    const dLon = toRadians(drop.longitude - pickup.longitude);
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(toRadians(pickup.latitude)) *
      Math.cos(toRadians(drop.latitude)) *
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

    let closestIndex = 0;
    let minDistance = Infinity;
    const searchRange = Math.min(coordinates.length, ROUTE_SEARCH_RANGE);

    for (let i = 0; i < searchRange; i++) {
      const dist = getDistanceInKm(currentLocation, coordinates[i]);
      if (dist < minDistance) {
        minDistance = dist;
        closestIndex = i;
      }
    }

    return [currentLocation, ...coordinates.slice(closestIndex)];
  }, [getDistanceInKm]);

  const handleMapDirectionsReady = useCallback((routeInfo) => {
    logger.info('Directions ready', { duration: routeInfo?.duration });
    if (routeInfo?.coordinates) {
      setDirections(routeInfo);
      setRouteCoordinates(routeInfo.coordinates);
      setCurrentRoute(routeInfo.coordinates);
    }
    return routeInfo?.duration ?? null;
  }, []);

  const updateCurrentRoute = useCallback((newRoute) => setCurrentRoute(newRoute), []);

  const clearRoute = useCallback(() => {
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
