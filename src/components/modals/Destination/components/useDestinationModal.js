import { useContext, useState } from "react";
import { useTextSearchQuery } from "../../../../models/places/useTextSearchQuery";
import { useDebounce } from "use-debounce";
import { useRef } from "react";
import { useEffect } from "react";
import { UserContext } from "../../../../context/UserContext";
export const useDestinationModal = () => {
  const { user } = useContext(UserContext);

  const [data, setData] = useState([]);

  const [isCurrLocation, setIsCurrLocation] = useState(true)
  const [inputIndex, setInputIndex] = useState();

  useEffect(() => {
    const data = [
      {
        place_id: -1,
        name: "Definir localização no mapa",
      },
      {
        place_id: 0,
        name: "Localização atual",
      },
    ]
    
    const data2 = user?.saved_places ? user?.saved_places.map((item) => {
      data.push({
        place_id: item._id,
        name: item.place.name,
        geometry: {
          location: {
            lat: item.place.coordinates.latitude,
            lng: item.place.coordinates.longitude,
          },
        },
        formatted_address: item.place.description,
      });
    }) : [];

    if (data) {
      setData(data);
      // console.log(data);
    }
  }, [user?.saved_places]);

  const [destinationInputValue, setDestinationInputValue] = useState("");
  const textInputOriginRef = useRef(null);
  const textInputDestinationRef = useRef(null);
  const debounceDestinationInputValue = useDebounce(destinationInputValue, 500);

  const { responseData, setResponseData } = useTextSearchQuery(
    debounceDestinationInputValue[0] || ""
  );
  //console.log(debounceDestinationInputValue[0]);

  const handleDestinationInputValueChange = (text) => {
    setDestinationInputValue(text);
  };
  const handleInputTextChange = (onFocus) => {
      setDestinationInputValue("");
      onFocus(1);
  }; // check this later

  const handleOnIsCurrLocation = (val) => {
    setIsCurrLocation(val)
  }

  const handleOnSelectInputIndex = (index) => {
    setInputIndex(index);
  }

  const handleSetResponseData = (data) => {
    setResponseData();
  }

  return {
    models: {
      destinationInputValue,
      queryResponseData: responseData?.results || (isCurrLocation ? data.filter(item => item.place_id !== 0) : data),
      queryResponseDataSave: responseData?.results,
      data,
      textInputOriginRef,
      textInputDestinationRef,
      inputIndex
    },
    operations: {
      handleDestinationInputValueChange,
      handleInputTextChange,
      handleOnIsCurrLocation,
      handleOnSelectInputIndex,
      handleSetResponseData

    },
  };
};
