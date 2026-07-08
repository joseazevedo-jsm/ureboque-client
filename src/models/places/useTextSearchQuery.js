import axios from "axios";
import { useEffect, useState } from "react";
import { useUserLocationStateContext } from "../../context/UserLocationStateContext";
import { useLogger } from "../../hooks/useLogger";

export const useTextSearchQuery = (searchQuery) => {
  const logger = useLogger('useTextSearchQuery');
  const googleMapsApiKey = process.env.EXPO_PUBLIC_GOOGLE_MAPS_API_KEY;
  
  const [responseData, setResponseData] = useState(null);
  const { userLocation } = useUserLocationStateContext();

  const requestUrl =
    "https://maps.googleapis.com/maps/api/place/textsearch/json";

  useEffect(() => {
    if (
      searchQuery &&
      searchQuery !== "" &&
      userLocation?.latitude != null &&
      userLocation?.longitude != null
    ) {
      if (!googleMapsApiKey) {
        logger.warn('Google Maps API key missing; skipping text search');
        setResponseData(null);
        return;
      }

      (async () => {
        try {
          const { data } = await axios(requestUrl, {
            params: {
              query: searchQuery,
              location: `${userLocation.latitude},${userLocation.longitude}`,
              key: googleMapsApiKey,
            },
          });
          setResponseData(data);
        } catch (error) {
          logger.error('Text search query failed', error);
        }
      })();
    } else {
      setResponseData(null);
    }
  }, [googleMapsApiKey, searchQuery, userLocation?.latitude, userLocation?.longitude]);

  return { responseData, setResponseData };
};
