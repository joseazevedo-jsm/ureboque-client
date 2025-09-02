import axios from "axios";
import { useEffect, useState } from "react";
import { useUserLocationStateContext } from "../../context/UserLocationStateContext";
import { useLogger } from "../../hooks/useLogger";

export const useTextSearchQuery = (searchQuery) => {
  const logger = useLogger('useTextSearchQuery');
  
  const [responseData, setResponseData] = useState(null);
  const { userLocation } = useUserLocationStateContext();

  const requestUrl =
    "https://maps.googleapis.com/maps/api/place/textsearch/json";

  useEffect(() => {
    if (searchQuery && searchQuery !== "") {
      (async () => {
        try {
          const { data } = await axios(requestUrl, {
            params: {
              query: searchQuery,
              location: `${userLocation.latitude},${userLocation.longitude}`,
              key: "AIzaSyBqPFzMJ7TgohKLMZ8Q0Z1iRVmk63OWWpk",
            },
          });
          setResponseData(data);
        } catch (error) {
          logger.error('Text search query failed', error);
        }
      })();
    } else {
      setResponseData();
    }
  }, [searchQuery,userLocation?.latitude, userLocation?.longitude]);

  return { responseData, setResponseData };
};
