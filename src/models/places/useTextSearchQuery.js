import axios from "axios";
import { useEffect, useState } from "react";
import { useUserLocation } from "../../context/UserLocationStateContext";
import { useLogger } from "../../hooks/useLogger";

export const useTextSearchQuery = (searchQuery) => {
  const logger = useLogger('useTextSearchQuery');
  const googleMapsApiKey = process.env.EXPO_PUBLIC_GOOGLE_MAPS_API_KEY;
  
  const [responseData, setResponseData] = useState(null);
  // A failed lookup previously left the list simply empty, which reads as
  // "no such place" rather than "the search could not run".
  const [searchFailed, setSearchFailed] = useState(false);
  const userLocation = useUserLocation();
  const latitude = Number(userLocation?.latitude);
  const longitude = Number(userLocation?.longitude);
  const hasValidLocation = Number.isFinite(latitude) && Number.isFinite(longitude);
  const locationKey = hasValidLocation
    ? `${latitude.toFixed(3)},${longitude.toFixed(3)}`
    : 'none';

  // Places API (New) with a field mask: the legacy textsearch endpoint always
  // returned contact and atmosphere fields, which Google bills as extra SKUs.
  const requestUrl = "https://places.googleapis.com/v1/places:searchText";
  const fieldMask =
    "places.id,places.displayName,places.formattedAddress,places.location";

  useEffect(() => {
    let debounceTimer = null;
    let controller = null;
    let active = true;
    if (
      searchQuery &&
      searchQuery !== ""
    ) {
      if (!googleMapsApiKey) {
        logger.warn('Google Maps API key missing; skipping text search');
        setResponseData(null);
        setSearchFailed(true);
        return;
      }

      debounceTimer = setTimeout(() => {
        controller = new AbortController();
        (async () => {
          try {
            const body = { textQuery: searchQuery };
            if (hasValidLocation) {
              body.locationBias = {
                circle: { center: { latitude, longitude }, radius: 50000 },
              };
            }

            const { data } = await axios.post(requestUrl, body, {
              signal: controller.signal,
              headers: {
                "X-Goog-Api-Key": googleMapsApiKey,
                "X-Goog-FieldMask": fieldMask,
              },
            });
            // Keep the legacy result shape the search screens already read.
            const results = (data?.places || []).map((place) => ({
              place_id: place.id,
              name: place.displayName?.text,
              formatted_address: place.formattedAddress,
              geometry: {
                location: {
                  lat: place.location?.latitude,
                  lng: place.location?.longitude,
                },
              },
            }));
            if (active) {
              setResponseData({ results });
              setSearchFailed(false);
            }
          } catch (error) {
            if (error?.code !== 'ERR_CANCELED' && error?.name !== 'CanceledError') {
              logger.error('Text search query failed', error);
              if (active) setSearchFailed(true);
            }
          }
        })();
      }, 350);
    } else {
      setResponseData(null);
      setSearchFailed(false);
    }

    return () => {
      active = false;
      if (debounceTimer) clearTimeout(debounceTimer);
      controller?.abort();
    };
  }, [googleMapsApiKey, searchQuery, locationKey]);

  return { responseData, setResponseData, searchFailed };
};
