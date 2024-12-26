import { useContext, useEffect } from "react";
import { useRef } from "react";
import { useState } from "react";
import { UserContext } from "../../../../context/UserContext";
import Geocoder from "react-native-geocoding";
import { useUserLocationStateContext } from "../../../../context/UserLocationStateContext";

export const useSavedPlacesModal = () => {
  const { user, saveUserFavouriteAddress, removeUserFavouriteAddress, updateUserFavouriteAddress } = useContext(UserContext);
  const { userLocation } = useUserLocationStateContext();
  const bottomSheetModalAddAddress = useRef(null);
  const [edit, setEdit] = useState();
  const [addressModalVisible, setAddressModalVisible] = useState(false);
  const [type, setType] = useState("");
  const [button, setButton] = useState(false);
  const [address, setAddress] = useState("");
  const [placeId, setPlaceId] = useState("");
  const [name, setName] = useState("");
  const [nameFAV, setNameFAV] = useState("");
  const [description, setDescription] = useState("");
  const [instructions, setInstructions] = useState("");
  const [savedPlaces, setSavedPlaces] = useState([]);
  const [coordinates, setCoordinates] = useState();

  useEffect(() => {
    const addHouse = {
      _id: "casa",
      place: {
        name: "Adicionar Casa",
      },
    };

    const addWork = {
      _id: "trab",
      place: {
        name: "Adicionar Trabalho",
      },
    };

    const data = [...(user?.saved_places || [])];
    if (user && user.saved_places) {
      if (!data.some((obj) => obj.place.name === "Trabalho"))
        data.unshift(addWork);
      if (!data.some((obj) => obj.place.name === "Casa"))
        data.unshift(addHouse);

      setSavedPlaces(data);
    }

    //Verificar melhor
  }, [user]);

  const handleEditPress = () => {
    setEdit(true);
  };
  const handleAddressEditButtonPress = (place, placeId) => {
    return () => {
      console.log("edit place", place, placeId);
      setName(place.name);
      setDescription(place.description);
      setAddress(place.description);
      setInstructions(place.instructions);
      setPlaceId(placeId);
      setCoordinates(place.coordinates);
      setType("EDITAR");
      setButton(true);
      setAddressModalVisible(true);
    };
  };

  const handleDeleteFavouriteButtonPress = (placeId) => {
    console.log("delete place", placeId);
    removeUserFavouriteAddress(placeId);
  };

  const handleAddFavouriteButtonPress = () => {
    return () => {
      setType("NOVO");
      setButton(false);
      setAddressModalVisible(true);
    }
  };

  const callbackModal = () => {
    setAddressModalVisible(true);
  };

  const addCoords = (coords) => {
    setCoordinates(coords);
  };

  const handleSaveFavouriteButtonPress = (callback, type) => {
    console.log("nameFAV and name", nameFAV, name);
       let place = {
        place: {
          name: name || nameFAV,
          description: address,
          coordinates: coordinates,
          instructions: instructions,
        },
      };

      if (callback && callback.coordinates && callback.city) {
        place.place.coordinates = callback.coordinates;
        place.place.description = callback.city;
      }

      switch (type) {
        case "NOVO":
          console.log("Saving new place", place);
          saveUserFavouriteAddress(place);
          break;
        case "EDITAR":
          console.log("Updating existing place", place);
          updateUserFavouriteAddress(place, placeId);
          break;
        default:
          console.log("Invalid type");
          break;
      }
  };
  const handeBackButtonPress = () => {
    setAddress("");
    setAddressModalVisible(false);
  };

  const handleLocationPress = () => {
    console.log(bottomSheetModalAddAddress.current);
    bottomSheetModalAddAddress.current.present();
  };

  const handlePressItemPress = (
    coords,
    formatted_address,
    bottomsheet,
    name
  ) => {
    return () => {
      // Set the coordinates, address, and nameFAV
      setCoordinates(coords);
      setAddress(formatted_address);
      setNameFAV(name);
    
      // Dismiss the bottom sheet
      bottomsheet.current.dismiss();   
    };
  };

  const handleNameChangeText = (text) => {
    setName(text);
    console.log(text);
  };

  const handleInstructionsChangeText = (text) => {
    setInstructions(text);
    console.log(text);
  };

  const handleCurrentLocationPress = async () => {
    try {
      if (!userLocation?.latitude || !userLocation?.longitude) {
        Alert.alert('Error', 'Could not determine your location. Please try again.');
        return;
      }

      const response = await Geocoder.from(userLocation.latitude, userLocation.longitude);
      const address = response.results[0]?.formatted_address;
      const name = response.results[0]?.address_components[0]?.long_name;

      if (!address) {
        Alert.alert('Error', 'Could not determine your address. Please try again.');
        return;
      }

      setCoordinates({
        latitude: userLocation.latitude,
        longitude: userLocation.longitude,
      });
      setAddress(address);
      setNameFAV(name);


    } catch (error) {
      console.error('Error handling current location:', error);
      Alert.alert('Error', 'Something went wrong. Please try again.');
    }
  };

  return {
    models: {
      edit,
      type,
      button,
      address,
      name,
      placeId,
      description,
      instructions,
      savedPlaces,
      addressModalVisible,
      bottomSheetModalAddAddress,
    },
    operations: {
      handleEditPress,
      setAddressModalVisible,
      handleAddressEditButtonPress,
      handleDeleteFavouriteButtonPress,
      handeBackButtonPress,
      handleAddFavouriteButtonPress,
      handleLocationPress,
      handlePressItemPress,
      handleSaveFavouriteButtonPress,
      handleNameChangeText,
      handleInstructionsChangeText,
      handleCurrentLocationPress,
      callbackModal,
      addCoords,
    },
  };
};

//  {
//   id: 3,
//   place: {
//     name: "Praça dos Correios - Golf 2",
//     coordinates: {
//       latitude: 10,
//       longitude: 10,
//     },
//     description: "Kilamba Kiaxi, Belas, Luanda...",
//   },
// },
// {
//   id: 4,
//   place: {
//     name: "Universidade Óscar Ribas",
//     coordinates: {
//       latitude: 10,
//       longitude: 10,
//     },
//     description: "Kilamba Kiaxi, Belas, Luanda...",
//   },
// },
// {
//   id: 5,
//   place: {
//     name: "Oficina",
//     coordinates: {
//       latitude: 10,
//       longitude: 10,
//     },
//     description: "Kilamba Kiaxi, Belas, Luanda...",
//   },
// },
// {
//   id: 6,
//   place: {
//     name: "Oficina B",
//     coordinates: {
//       latitude: 10,
//       longitude: 10,
//     },
//     description: "Kilamba Kiaxi, Belas, Luanda...",
//   },
// },
// {
//   id: 7,
//   place: {
//     name: "Oficina C",
//     coordinates: {
//       latitude: 10,
//       longitude: 10,
//     },
//     description: "Kilamba Kiaxi, Belas, Luanda...",
//   },
// },
// {
//   id: 8,
//   place: {
//     name: "Oficina D",
//     coordinates: {
//       latitude: 10,
//       longitude: 10,
//     },
//     description: "Kilamba Kiaxi, Belas, Luanda...",
//   },
// },
