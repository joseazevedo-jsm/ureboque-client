import { useContext, useEffect, useRef } from "react";
import { useState } from "react";
import { useSelector, useDispatch } from 'react-redux';
import { saveUserFavoriteAddress, removeUserFavoriteAddress, updateUserFavoriteAddress } from "../../../../store/slices/userSlice";
import Geocoder from "react-native-geocoding";

export const useSavedPlacesModal = () => {
  const dispatch = useDispatch();
  const user = useSelector((state) => state.user.user);
  const { userLocation } = useSelector((state) => state.location);
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
    console.log("Loading saved places - user data changed");
    
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
  }, [user?.id, user?.saved_places]);

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
    dispatch(removeUserFavoriteAddress({ userId: user.id, placeId }));
  };

  const handleAddFavouriteButtonPress = () => {
    return () => {
      console.log("handleAddFavouriteButtonPress called");
      
      // Reset form data to ensure clean state
      setName("");
      setInstructions("");
      setAddress("");
      setNameFAV("");
      setCoordinates(null);
      
      // Set type and button state
      setType("NOVO");
      setButton(false);
      
      // Ensure addressModalVisible is set to true
      console.log("Setting addressModalVisible to true");
      setAddressModalVisible(true);
    }
  };

  const callbackModal = () => {
    setAddressModalVisible(true);
  };

  const addCoords = (coords) => {
    setCoordinates(coords);
  };

  const handleSaveFavouriteButtonPress = async (callback, type) => {
    try {
      // Ensure user exists before proceeding
      if (!user || !user.id) {
        console.error('User not found or not logged in');
        throw new Error('User not found or not logged in');
      }
      
      // Validate coordinates are available before proceeding
      const coords = callback?.place?.coordinates || callback?.coordinates || coordinates;
      
      if (!coords || (!coords.latitude && !coords.longitude)) {
        console.error('Error: Missing coordinates data', coords);
        throw new Error('Missing coordinates data');
      }
      
      // Make sure we have a name
      const placeName = name || nameFAV || 'New Place';
      
      // Use the description from the nested place if available
      const description = callback?.place?.description || callback?.city || address || 'No description';
      
      // Create a place object matching the expected database schema structure
      // The schema expects: saved_places: [{ place: { name, coordinates, etc } }]
      let place = {
        place: {
          name: placeName,
          description: description,
          coordinates: coords,
          instructions: instructions || '',
        }
      };
      
      // Use dispatch with try/catch
      let result;
      switch (type) {
        case "NOVO":
          result = await dispatch(saveUserFavoriteAddress({ 
            userId: user.id, 
            place 
          })).unwrap();
          break;
        case "EDITAR":
          result = await dispatch(updateUserFavoriteAddress({ 
            userId: user.id, 
            place, 
            placeId 
          })).unwrap();
          break;
        default:
          throw new Error(`Invalid operation type: ${type}`);
      }
      
      return true;
    } catch (error) {
      console.error('Error saving/updating place:', error);
      // Re-throw error for the calling component to handle
      throw error;
    }
  };
  const handeBackButtonPress = () => {
    console.log("handeBackButtonPress called in useSavedPlacesModal");
    
    // Reset form data
    setAddress("");
    setName("");
    setInstructions("");
    setNameFAV("");
    setCoordinates(null);
    
    // Close modal
    console.log("Setting addressModalVisible to false");
    setAddressModalVisible(false);
  };

  const handleLocationPress = () => {
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
    
      // Create a new callbackAddress object with the necessary data
      const callbackData = {
        coordinates: coords,
        city: formatted_address,
        pos: 0 // Assuming default position
      };
    
      // Dismiss the bottom sheet
      bottomsheet.current.dismiss();   
      
      return callbackData;
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
        console.error('Error: Could not determine user location');
        Alert.alert('Error', 'Could not determine your location. Please try again.');
        return;
      }

      const response = await Geocoder.from(userLocation.latitude, userLocation.longitude);
      
      const address = response.results[0]?.formatted_address;
      const name = response.results[0]?.address_components[0]?.long_name;

      if (!address) {
        console.error('Error: Could not determine address from coordinates');
        Alert.alert('Error', 'Could not determine your address. Please try again.');
        return;
      }

      const newCoords = {
        latitude: userLocation.latitude,
        longitude: userLocation.longitude,
      };
      
      setCoordinates(newCoords);
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
      coordinates,
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
