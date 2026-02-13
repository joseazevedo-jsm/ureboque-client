import { useContext, useState } from "react";
import { useTextSearchQuery } from "../../../../models/places/useTextSearchQuery";
import { useDebounce } from "use-debounce";
import { useRef } from "react";
import { useEffect } from "react";
import { UserContext } from "../../../../context/UserContext";
export const useDestinationModal = (
  externalIsCurrLocation,
  externalActiveInputIndex,
  externalOrigin,
  externalDestination
) => {
  const { user } = useContext(UserContext);

  const [data, setData] = useState([]);

  // Use external isCurrLocation from parent (passed via inputCurr prop)
  // When null/undefined/false, "Localização atual" should be shown in list
  const isCurrLocation = externalIsCurrLocation;
  const [inputIndex, setInputIndex] = useState();

  useEffect(() => {
    const savedPlaces = user?.saved_places ? user.saved_places.map((item) => ({
      place_id: item._id,
      name: item.place.name,
      geometry: {
        location: {
          lat: item.place.coordinates.latitude,
          lng: item.place.coordinates.longitude,
        },
      },
      formatted_address: item.place.description,
    })) : [];

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
    // Keep internal input values empty so the external address shows as a placeholder
    // unless the user has explicitly typed something.
  }, [externalOrigin]);

  useEffect(() => {
    // Keep internal input values empty so the external address shows as a placeholder
    // unless the user has explicitly typed something.
  }, [externalDestination]);
  const textInputOriginRef = useRef(null);
  const textInputDestinationRef = useRef(null);

  const activeInputValue = activeInput === "origin" ? originInputValue : destinationInputValue;
  const debounceActiveInputValue = useDebounce(activeInputValue, 500);

  const { responseData, setResponseData } = useTextSearchQuery(
    debounceActiveInputValue[0] || ""
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
    setResponseData();
  }

  return {
    models: {
      originInputValue,
      origin: originInputValue,
      destinationInputValue,
      destination: destinationInputValue,
      activeInput,
      queryResponseData: responseData?.results || data,
      places: responseData?.results || data,
      queryResponseDataSave: responseData?.results,
      data,
      textInputOriginRef,
      textInputDestinationRef,
      inputIndex
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
