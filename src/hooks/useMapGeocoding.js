import { useState, useCallback, useMemo } from 'react';
import Geocoder from 'react-native-geocoding';
import { useLogger } from './useLogger';
import { GEOCODE_CACHE_MAX } from '../constants/config';

Geocoder.init(process.env.EXPO_PUBLIC_GOOGLE_MAPS_API_KEY);

export const useMapGeocoding = () => {
  const logger = useLogger('useMapGeocoding');
  const [markerCity, setMarkerCity] = useState(null);
  const geocodeCache = useMemo(() => new Map(), []);

  const getAddressFromCoordinates = useCallback(async (lat, lng) => {
    if (lat == null || lng == null) {
      logger.warn('getAddressFromCoordinates called with invalid coordinates', { lat, lng });
      return null;
    }
    const key = `${lat.toFixed(6)},${lng.toFixed(6)}`;

    if (geocodeCache.has(key)) {
      const cached = geocodeCache.get(key);
      setMarkerCity(cached);
      return cached;
    }

    try {
      const response = await Geocoder.from(lat, lng);
      const address = response.results[0]?.address_components[1]?.long_name;
      geocodeCache.set(key, address);
      if (geocodeCache.size > GEOCODE_CACHE_MAX) {
        geocodeCache.delete(geocodeCache.keys().next().value);
      }
      setMarkerCity(address);
      return address;
    } catch (error) {
      logger.error('Error fetching address', error);
      return null;
    }
  }, [geocodeCache]);

  return { markerCity, setMarkerCity, getAddressFromCoordinates };
};
