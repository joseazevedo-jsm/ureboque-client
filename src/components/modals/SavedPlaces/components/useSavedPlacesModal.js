import { useContext, useEffect } from "react";
import { useRef } from "react";
import { useState } from "react";
import { UserContext } from "../../../../context/UserContext";

export const useSavedPlacesModal = () => {
  const { user, saveUserFavouriteAddress } = useContext(UserContext);
  const bottomSheetModalAddAddress = useRef(null);
  const [edit, setEdit] = useState();
  const [addressModalVisible, setAddressModalVisible] = useState(false);
  const [type, setType] = useState("");
  const [button, setButton] = useState(false);
  const [address, setAddress] = useState("");
  const [name, setName] = useState("");
  const [nameFAV, setNameFAV] = useState("");
  const [description, setDescription] = useState("");
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
  }, [user?.saved_places]);

  const handleEditPress = () => {
    setEdit(true);
  };
  const handleAddressEditButtonPress = (name, address) => {
    return () => {
      setName(name);
      setDescription("...");
      setAddress(address);
      setType("EDITAR");
      setButton(true);
      setAddressModalVisible(true);
    };
  };

  const handleAddFavouriteButtonPress = () => {
    setName("");
    setDescription("");
    setAddress("");
    setType("NOVO");
    setButton(false);
    setAddressModalVisible(true);
  };

  const callbackModal = () => {
    setAddressModalVisible(true);
  };

  const addCoords = (coords) => {
    setCoordinates(coords);
  };

  const handleSaveFavouriteButtonPress = (callback,type) => {
    return () => {
      console.log("callback", name);
      let place = {
        place: {
          name: nameFAV,
          description: address,
          coordinates: coordinates,
        },
      };

      if (callback) {
        place = {
          place: {
            name: name,
            description: callback.city,
            coordinates: callback.coordinates,
          },
        };
      }

      console.log("place", place, type);
      if(type){
        if (type === "NOVO") {
          console.log("NOVO");
          saveUserFavouriteAddress(place);
        } else {
          console.log("DAR UPDATE");
        }
      }
    };
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
      // console.log("--> Coords ",coords,formatted_address);
      setCoordinates(coords);
      setAddress(formatted_address);
      setNameFAV(name);
      bottomsheet.current.dismiss();
    };
  };

  const handleNameChangeText = (text) => {
    setName(text);
    console.log(text);
  };
  return {
    models: {
      edit,
      type,
      button,
      address,
      name,
      description,
      savedPlaces,
      addressModalVisible,
      bottomSheetModalAddAddress,
    },
    operations: {
      handleEditPress,
      setAddressModalVisible,
      handleAddressEditButtonPress,
      handeBackButtonPress,
      handleAddFavouriteButtonPress,
      handleLocationPress,
      handlePressItemPress,
      handleSaveFavouriteButtonPress,
      handleNameChangeText,
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
