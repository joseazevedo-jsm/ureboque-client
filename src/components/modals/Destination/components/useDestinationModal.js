import { useContext, useState } from "react";
import { useTextSearchQuery } from "../../../../models/places/useTextSearchQuery";
import { useRef } from "react";
import { useEffect } from "react";
import { UserContext } from "../../../../context/UserContext";
// Haversine distance in km between two lat/lng points.
const distanceKm = (from, to) => {
  const fromLatitude = Number(from?.latitude);
  const fromLongitude = Number(from?.longitude);
  const toLatitude = Number(to?.lat);
  const toLongitude = Number(to?.lng);
  if (!Number.isFinite(fromLatitude) || !Number.isFinite(fromLongitude) ||
      !Number.isFinite(toLatitude) || !Number.isFinite(toLongitude)) return null;
  const R = 6371;
  const dLat = ((toLatitude - fromLatitude) * Math.PI) / 180;
  const dLng = ((toLongitude - fromLongitude) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((fromLatitude * Math.PI) / 180) *
      Math.cos((toLatitude * Math.PI) / 180) *
      Math.sin(dLng / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
};

export const useDestinationModal = (
  externalIsCurrLocation,
  externalActiveInputIndex,
  externalOrigin,
  externalDestination,
  userLocation
) => {
  const { user } = useContext(UserContext);

  const [data, setData] = useState([]);

  // Use external isCurrLocation from parent (passed via inputCurr prop)
  // When null/undefined/false, "Localização atual" should be shown in list
  const isCurrLocation = externalIsCurrLocation;
  const [inputIndex, setInputIndex] = useState();

  useEffect(() => {
    const savedPlaces = (user?.saved_places || [])
      .map((item) => ({
        ...item,
        normalizedCoordinates: {
          latitude: Number(item?.place?.coordinates?.latitude),
          longitude: Number(item?.place?.coordinates?.longitude),
        },
      }))
      .filter((item) => Number.isFinite(item.normalizedCoordinates.latitude) && Number.isFinite(item.normalizedCoordinates.longitude))
      .map((item) => ({
        place_id: item._id,
        name: item.place.name || 'Local guardado',
        geometry: {
          location: {
            lat: item.normalizedCoordinates.latitude,
            lng: item.normalizedCoordinates.longitude,
          },
        },
        formatted_address: item.place.description,
      }));

    setData(savedPlaces);
  }, [user?.saved_places]);

  const [originInputValue, setOriginInputValue] = useState("");
  const [destinationInputValue, setDestinationInputValue] = useState("");
  const [activeInput, setActiveInput] = useState(externalActiveInputIndex === 0 ? "origin" : "destination"); // "origin" or "destination"

  useEffect(() => {
    if (externalActiveInputIndex !== undefined && externalActiveInputIndex !== null) {
      setActiveInput(externalActiveInputIndex === 0 ? "origin" : "destination");
    }
  }, [externalActiveInputIndex]);

  useEffect(() => {
    // The parent owns the selected address. Clear stale search text when that
    // address changes so the new value is visible through the placeholder.
    setOriginInputValue("");
  }, [externalOrigin]);

  useEffect(() => {
    // See the origin effect above: a map/favourite selection must replace any
    // text left from the previous destination search.
    setDestinationInputValue("");
  }, [externalDestination]);
  const textInputOriginRef = useRef(null);
  const textInputDestinationRef = useRef(null);

  const activeInputValue = activeInput === "origin" ? originInputValue : destinationInputValue;

  const { responseData, setResponseData, searchFailed } = useTextSearchQuery(
    activeInputValue || ""
  );

  const handleOriginInputValueChange = (text) => {
    setOriginInputValue(text);
  };

  const handleDestinationInputValueChange = (text) => {
    setDestinationInputValue(text);
  };

  const handleOriginFocus = () => {
    setActiveInput("origin");
  };

  const handleDestinationFocus = () => {
    setActiveInput("destination");
  };
  const handleInputTextChange = (onFocus) => {
    setDestinationInputValue("");
    onFocus(1);
  }; // check this later

  const handleOnIsCurrLocation = (val) => {
    // No-op: isCurrLocation is now controlled by parent via externalIsCurrLocation
    // The parent's state will be updated by handlePressItemPress in useMapScreen
  }

  const handleOnSelectInputIndex = (index) => {
    setInputIndex(index);
  }

  const handleSetResponseData = (data) => {
    setResponseData(data);
  }

  const rawPlaces = responseData?.results || data;
  const placesWithDistance = rawPlaces.map((item) => ({
    ...item,
    distanceKm: distanceKm(userLocation, item.geometry?.location),
  }));
  const mapOptionItem = {
    place_id: -1,
    name: "Definir localização no mapa",
    isMapOption: true,
  };
  const places = [mapOptionItem, ...placesWithDistance];

  return {
    models: {
      originInputValue,
      origin: originInputValue,
      destinationInputValue,
      destination: destinationInputValue,
      activeInput,
      queryResponseData: responseData?.results || data,
      places,
      queryResponseDataSave: responseData?.results,
      data,
      textInputOriginRef,
      textInputDestinationRef,
      inputIndex,
      searchFailed: searchFailed && !!(activeInputValue || "").trim(),
    },
    operations: {
      handleOriginInputValueChange,
      handleOriginChange: handleOriginInputValueChange,
      handleDestinationInputValueChange,
      handleDestinationChange: handleDestinationInputValueChange,
      handleOriginFocus,
      handleDestinationFocus,
      handleInputTextChange,
      handleOnIsCurrLocation,
      handleOnSelectInputIndex,
      handleSetResponseData
    },
  };
};
