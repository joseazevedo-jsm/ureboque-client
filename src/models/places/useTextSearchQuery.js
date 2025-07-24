import axios from "axios";
import { useEffect, useState } from "react";
import { useSelector } from 'react-redux';

export const useTextSearchQuery = (searchQuery) => {
  const [responseData, setResponseData] = useState(null);
  const { userLocation } = useSelector((state) => state.location);

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
          console.log(error);
        }
      })();
    } else {
      setResponseData();
    }
  }, [searchQuery,userLocation?.latitude, userLocation?.longitude]);

  return { responseData, setResponseData };
};
