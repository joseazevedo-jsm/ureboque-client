import { useState, useCallback, useMemo, useRef, useEffect } from 'react';
import Geocoder from 'react-native-geocoding';
import { useLogger } from './useLogger';
import { GEOCODE_CACHE_MAX } from '../constants/config';

const googleMapsApiKey = process.env.EXPO_PUBLIC_GOOGLE_MAPS_API_KEY;

if (googleMapsApiKey) {
  Geocoder.init(googleMapsApiKey);
}

const getAddressComponent = (components, type) =>
  components.find((component) => component.types?.includes(type))?.long_name;

// Reverse-geocode labels must describe the point under the pin. Returning the
// locality first made every position inside a city display the same label (for
// example, "Sevilla"), even though Google had returned a street-level result.
const formatReverseGeocodeAddress = (result) => {
  if (!result) return null;

  const components = result.address_components || [];
  const route = getAddressComponent(components, 'route');
  const streetNumber = getAddressComponent(components, 'street_number');
  const locality = getAddressComponent(components, 'locality')
    || getAddressComponent(components, 'postal_town')
    || getAddressComponent(components, 'administrative_area_level_2');

  if (route) {
    const street = streetNumber ? `${route} ${streetNumber}` : route;
    return locality && locality !== street ? `${street}, ${locality}` : street;
  }

  // Places without a mapped road (car parks, venues, rural points) are still
  // better represented by Google's full result than by a city-only label.
  return result.formatted_address || locality || null;
};

export const useMapGeocoding = () => {
  const logger = useLogger('useMapGeocoding');
  const [markerCity, setMarkerCity] = useState(null);
  const geocodeCache = useMemo(() => new Map(), []);
  const inFlightGeocodes = useRef(new Map());
  const mountedRef = useRef(true);
  const requestSequenceRef = useRef(0);

  useEffect(() => {
    mountedRef.current = true;
    return () => { mountedRef.current = false; };
  }, []);

  const getAddressFromCoordinates = useCallback(async (lat, lng) => {
    const sequence = ++requestSequenceRef.current;
    const latitude = Number(lat);
    const longitude = Number(lng);
    if (!Number.isFinite(latitude) || !Number.isFinite(longitude) ||
        latitude < -90 || latitude > 90 || longitude < -180 || longitude > 180) {
      logger.warn('getAddressFromCoordinates called with invalid coordinates', { lat, lng });
      return null;
    }
    if (!googleMapsApiKey) {
      logger.warn('Google Maps API key missing; skipping reverse geocoding');
      return null;
    }

    const key = `${latitude.toFixed(6)},${longitude.toFixed(6)}`;

    if (geocodeCache.has(key)) {
      const cached = geocodeCache.get(key);
      if (mountedRef.current && sequence === requestSequenceRef.current) setMarkerCity(cached);
      return cached;
    }

    if (inFlightGeocodes.current.has(key)) {
      const address = await inFlightGeocodes.current.get(key);
      if (mountedRef.current && sequence === requestSequenceRef.current) setMarkerCity(address);
      return address;
    }

    const request = Geocoder.from(latitude, longitude)
      .then((response) => {
        const result = response.results?.[0];
        return formatReverseGeocodeAddress(result);
      })
      .then((address) => {
        if (address) {
          geocodeCache.set(key, address);
          if (geocodeCache.size > GEOCODE_CACHE_MAX) {
            geocodeCache.delete(geocodeCache.keys().next().value);
          }
        }
        return address;
      })
      .catch((error) => {
        logger.error('Error fetching address', error);
        return null;
      })
      .finally(() => inFlightGeocodes.current.delete(key));

    inFlightGeocodes.current.set(key, request);
    const address = await request;
    if (mountedRef.current && sequence === requestSequenceRef.current) setMarkerCity(address);
    return address;
  }, [geocodeCache]);

  return { markerCity, setMarkerCity, getAddressFromCoordinates };
};
