import { useContext, useEffect, useRef, useState } from "react";
import { useUserLocationStateContext } from "../../context/UserLocationStateContext";
import { scale } from "react-native-size-matters";
import { useCallback } from "react";
import { UserContext } from "../../context/UserContext";
import axios from "axios";
import Geocoder from "react-native-geocoding";
import { Alert } from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { set } from "react-native-reanimated";

const IP = process.env.EXPO_PUBLIC_UREBOQUE_API; //attt ao apagar

Geocoder.init("AIzaSyBqPFzMJ7TgohKLMZ8Q0Z1iRVmk63OWWpk");

const LATITUDE_DELTA = 0.0022;
const LONGITUDE_DELTA = 0.005;

export const useMapScreen = () => {
  const mapRef = useRef(null);
  const bottomSheetModalRef = useRef(null);
  const bottomSheetModalRef2 = useRef(null);
  const bottomSheetModalRef3 = useRef(null);
  const bottomSheetModalRef4 = useRef(null);
  const bottomSheetModalRef5 = useRef(null);
  const bottomSheetModalRef6 = useRef(null);
  const bottomSheetModalRef7 = useRef(null);
  const bottomSheetModalRef8 = useRef(null);
  const bottomSheetModalRefDetails = useRef(null);
  const bottomSheetModalDragMarker = useRef(null);
  const markerAnimated = useRef(null);

  const [modalVisible, setModalVisible] = useState(false);
  const [modalSavedPlacesVisible, setModalSavedPlacesVisible] = useState(false);
  const [modalCancelVisible, setModalCancelVisible] = useState(false);
  const [modalPreCancelVisible, setModalPreCancelVisible] = useState(false);
  const [modalChatVisible, setModalChatVisible] = useState(false);
  const [mapMarkers, setMapMarkers] = useState([]);
  const [mapDirections, setMapDirections] = useState(null);
  const [typeCar, setTypeCar] = useState("Turismo");
  const [ridePrice, setRidePrice] = useState("25,300");
  const [brand, setBrand] = useState("Toyota");
  const [model, setModel] = useState("Corolla");
  const [license, setLicense] = useState("LD-SOM");
  const [color, setColor] = useState("Preto");

  const {
    socket,
    user,
    fetchUserById,
    removeDiscount,
    serviceStatus,
    setServiceStatus,
    prices,
    fetchPrices
  } = useContext(UserContext);
  const [service, setService] = useState(null);
  const [driver, setDriver] = useState(null);
  const [driverConnected, setDriverConnected] = useState(false);
  const [favPlaces, setFavPlaces] = useState([]);
  const [tripDuration, setTripDuration] = useState(null);
  const [modalConfirmationVisible, setModalConfirmationVisible] =
    useState(null);
  const [detailsInfo, setDetailsInfo] = useState();
  const [markerVisible, setMarkerVisible] = useState();
  const [inputLocationObject, setInputLocationObject] = useState();
  const [markerCity, setMarkerCity] = useState();
  const [originCity, setOriginCity] = useState();
  const [destinationCity, setDestinationCity] = useState();
  const [originCoords, setOriginCoords] = useState();
  const [destinationCoords, setDestinationCoords] = useState();
  const [isCurrLocation, setIsCurrLocation] = useState();
  const [driverLocation, setDriverLocation] = useState();
  const [carsAround, setCarsAround] = useState([]);
  const { userLocation, setUserLocation } = useUserLocationStateContext();
  const [questions, setQuestions] = useState([
    { key: 0, question: "O motorista não vem" },
    { key: 1, question: "O motorista se recusou a conduzir" },
    { key: 2, question: "O motorista está muito longe" },
    { key: 3, question: "Quero modificar o destino " },
    { key: 4, question: "Ponto de partida incorreto" },
    { key: 5, question: "Outro" },
  ]);

  // const carsAround = [
  //   { latitude: -26.207487, longitude: 28.236226 },
  //   { latitude: -26.202616, longitude: 28.227718 },
  //   { latitude: -26.202424, longitude: 28.236612 },
  //   { latitude: -26.208565, longitude: 28.237191 },
  //   { latitude: -26.203598, longitude: 28.239509 },
  //   { latitude: 37.4263889, longitude: -122.0805556 },
  //   { latitude: 37.4142059, longitude: -122.0772066 },
  //   { latitude: 37.422, longitude: -122.0840575 },
  // ];

  // const getNearbyDrivers = async () => {
  //   // Make an API request to fetch nearby drivers
  //   // Update the nearbyDrivers state with the response data
  //   // For example:
  //   try {
  //     // console.log("getNearbyDrivers", userLocation?.longitude, userLocation?.latitude);
  //     const params = {
  //       latitude: userLocation?.latitude,
  //       longitude: userLocation?.longitude,
  //       maxDistance: 5000,
  //     };
  //     const resp = await axios.get(`${IP}/drivers/nearby`, {
  //       params: params,
  //     });

  //     const nearbyDrivers = resp.data.map((driver) => ({
  //       latitude: driver.location.coordinates[1], // Assuming latitude is the second element
  //       longitude: driver.location.coordinates[0], // Assuming longitude is the first element
  //     }));

  //     console.log(nearbyDrivers);
  //     setCarsAround(nearbyDrivers);
  //   } catch (error) {
  //     console.error(error);
  //   }
  // };

  // useEffect(() => {
  //   // Set up a timer to call getNearbyDrivers every 20 seconds
  //   const intervalId = setInterval(() => {
  //     getNearbyDrivers();
  //   }, 20000);

  //   // Clean up the interval when the component unmounts
  //   return () => {
  //     clearInterval(intervalId);
  //   };
  // }, [userLocation?.longitude && userLocation?.latitude]);

  const [isSearchingNearby, setIsSearchingNearby] = useState(false);
  const getNearbyDrivers = async () => {
    try {
      if (isSearchingNearby) return;
      // console.log("isSearchingNearby", isSearchingNearby);
      // console.log("getNearbyDrivers", userLocation?.longitude, userLocation?.latitude);
      const params = {
        latitude: userLocation?.latitude,
        longitude: userLocation?.longitude,
        maxDistance: 5000,
      };
      const resp = await axios.get(`${IP}/drivers/nearby`, {
        params: params,
      });

      console.log("NEARBY", resp.data);

      const nearbyDrivers = resp.data.map((driver) => ({
        latitude: driver.location.coordinates[1],
        longitude: driver.location.coordinates[0],
      }));

      console.log("A PROCURAR... ", nearbyDrivers);
      setCarsAround(nearbyDrivers); //nearbyDrivers
      setIsSearchingNearby(true);

      if (!service) {
        // Continue searching if a service doesn't exist
        setTimeout(getNearbyDrivers, 20000);
      }

      console.log("PROCURA CONCLUIDA... ");
    } catch (error) {
      console.error(error);
      if (!service) {
        // Retry after a delay if a service doesn't exist
        setTimeout(getNearbyDrivers, 20000);
      }
    }
  };

  useEffect(() => {
    if (!service && userLocation && !isSearchingNearby) {
      getNearbyDrivers();
    }

    return () => {
      setIsSearchingNearby(true);
    };
  }, [userLocation, isSearchingNearby]);

  const isRouteVisible = mapMarkers.length === 2;

  useEffect(() => {
    bottomSheetModalRef.current.present();
  }, []);

  useEffect(() => {
    const addFavouriteCard = {
      _id: "fav",
      place: {
        name: "Adicionar Favorito",
        description: "",
      },
    };
    const data = [...(user?.saved_places || [])];
    if (!data.includes(addFavouriteCard)) data.push(addFavouriteCard);

    setFavPlaces(data);
  }, [user?.saved_places]);

  useEffect(() => {
    if (mapDirections?.coordinates) {
      mapRef.current?.fitToCoordinates(mapDirections?.coordinates, {
        edgePadding: {
          bottom: scale(250),
          top: scale(50),
          left: scale(20),
          right: scale(20),
        },
      });
    }
  }, [mapDirections?.coordinates]);

  const centerToUserLocation = useCallback(() => {
    if (userLocation && !driver) {
      // when user moves it centers
      mapRef.current?.animateToRegion({
        latitude: userLocation.latitude,
        longitude: userLocation.longitude,
        latitudeDelta: LATITUDE_DELTA,
        longitudeDelta: LONGITUDE_DELTA,
      });
      console.log(userLocation?.latitude, userLocation?.longitude);
    }
  }, [userLocation?.latitude, userLocation?.longitude]);

  useEffect(() => {
    centerToUserLocation();
  }, [centerToUserLocation]);

  const handleUserLocationChange = ({ nativeEvent: { coordinate } }) => {
    if (coordinate && !modalVisible && !isRouteVisible) {
      setUserLocation(coordinate);
    }
  };

  const closeDestinationModal = () => {
    setModalVisible(false);
    bottomSheetModalRef.current.present();
  };

  const closeSavedPlacesModal = () => {
    setModalSavedPlacesVisible(false);
  };

  const closeConfirmationModal = () => {
    resetToInitialState();
  };

  const closeCancelModal = () => {
    setModalCancelVisible(false);
  };
  const closePreCancelModal = () => {
    setModalPreCancelVisible(false);
  };

  const handleMapSearchBarPress = () => {
    getAddressFromCoordinates(userLocation?.latitude, userLocation?.longitude);
    setOriginCity(markerCity);
    setOriginCoords({
      latitude: userLocation?.latitude,
      longitude: userLocation?.longitude,
    });
    if (markerCity) {
      setModalVisible(true);
      setIsCurrLocation({
        latitude: userLocation?.latitude,
        longitude: userLocation?.longitude,
      });
    }
  };

  const handlePreCancelButtonPress = () => {
    setModalPreCancelVisible(true);
  };

  const handleAddFavouriteButtonPress = () => {
    setModalSavedPlacesVisible(true);
  };

  const handleOnFavouriteButtonPress = (item) => {
    return () => {
      setOriginCity(item.place.name);
      setOriginCoords({
        latitude: item.place.coordinates.latitude,
        longitude: item.place.coordinates.longitude,
      });
      setModalVisible(true);
      setInputLocationObject(true);
      setIsCurrLocation();
    };
  };

  const handleBackButtonPress = () => {
    // when user goes back it restart the menu it should go back to previous men

    if (isRouteVisible) {
      setMapMarkers([]);
      setOriginCity();
      setDestinationCity();
      setOriginCoords();
      setDestinationCoords();
      setMapDirections();
      centerToUserLocation();
      bottomSheetModalRef.current.present();
      bottomSheetModalRef2.current.dismiss();
      bottomSheetModalRef3.current.dismiss();
      bottomSheetModalRef4.current.dismiss();
    }
  };

  const handleBackDetailsButtonPress = () => {
    const { bottomSheet } = detailsInfo;
    if (detailsInfo) {
      setDetailsInfo();
      bottomSheetModalRefDetails.current.dismiss();
      bottomSheet.current.present();
    }
  };

  const handlePressItemPress = (coords, address, inputRef) => {
    // if (userLocation) {
    //   console.log("AQUI",userLocation);
    //   const { latitude, longitude } = userLocation;
    //   setMapMarkers([{ latitude, longitude }, coords]);
    //   setModalVisible(false);
    //   bottomSheetModalRef.current.dismiss();
    //   bottomSheetModalRef2.current.present();
    // }
    if (inputLocationObject === 0) {
      console.log("orign ", coords);
      setOriginCoords(coords);
      setOriginCity(address);
      setIsCurrLocation();
      inputRef.current.focus();
      console.log(inputLocationObject, coords, address);
    } else if (inputLocationObject === 1) {
      console.log("dest ", coords);
      console.log(inputLocationObject, coords, address);

      if (address === "CurrLocation") {
        coords = {
          latitude: userLocation?.latitude,
          longitude: userLocation?.longitude,
        };

        address = markerCity;
      }
      // setDestinationCoords(coords);
      fetchPrices();
      setDestinationCity(address);
      // console.log("AQUI", type);
      setMapMarkers([originCoords, coords]);
      setModalVisible(false);
      bottomSheetModalRef.current.dismiss();
      bottomSheetModalRef2.current.present();
    }
  };

  const handlePressSelectTypeRoad = (type) => {
    setTypeCar(type);
  };

  const handleMapDirectionsReady = (routeInfo) => {
    console.log(routeInfo.coordinates);
    setMapDirections(routeInfo);
    setTripDuration(routeInfo?.duration);
  };

  const handleMarkerDragPress = () => {
    return () => {
      console.log("AQUI");
      setModalVisible(false);
      setMarkerVisible(true);
      bottomSheetModalRef.current.dismiss();
      bottomSheetModalDragMarker.current.present();
    };
  };

  const handleMarkerDragSavedPlaces = () => {
    console.log("AQUI");
    setNewSavedPlaceAddress({ pos: 1, city: "", callback: false });
    setModalSavedPlacesVisible(false);
    setMarkerVisible(true);
    bottomSheetModalRef2.current.dismiss();
    bottomSheetModalDragMarker.current.present();
  };

  const handleMarkerDragEnd = ({ latitude, longitude }) => {
    getAddressFromCoordinates(latitude, longitude);
    console.log("AQUI 2", latitude, longitude, newSavedPlaceAddress);

    if (newSavedPlaceAddress.pos > 0) {
      setNewSavedPlaceAddress({
        pos: newSavedPlaceAddress.pos,
        city: "",
        coordinates: { latitude, longitude },
        callback: false,
      });
    } else if (inputLocationObject === 0) {
      setOriginCoords({ latitude, longitude });
    } else if (inputLocationObject === 1) {
      fetchPrices();
      setDestinationCoords({ latitude, longitude });
    }
  };

  const getAddressFromCoordinates = async (lat, lng) => {
    try {
      const response = await Geocoder.from(lat, lng);
      const address = response.results[0]?.address_components[1]?.long_name;
      // console.log(response.results[0]);
      setMarkerCity(address);
    } catch (error) {
      console.log("Error fetching address:", error);
    }
  };

  const [newSavedPlaceAddress, setNewSavedPlaceAddress] = useState({
    pos: 0,
    city: "",
  });

  const handleConfirmDraggablePress = () => {
    if (newSavedPlaceAddress.pos > 0) {
      setModalSavedPlacesVisible(true);
      setNewSavedPlaceAddress({
        pos: newSavedPlaceAddress.pos,
        city: markerCity,
        coordinates: newSavedPlaceAddress.coordinates,
        callback: true,
      });
      setMarkerVisible(false);
      bottomSheetModalDragMarker.current.dismiss();
      return;
    }

    setModalVisible(true);
    if (inputLocationObject === 0) {
      console.log(inputLocationObject, originCoords);
      setOriginCity(markerCity);
      if (destinationCity != null) {
        setMapMarkers([originCoords, destinationCoords]);
        setModalVisible(false);
        bottomSheetModalRef.current.dismiss();
        bottomSheetModalRef2.current.present();
      }
    } else if (inputLocationObject === 1) {
      console.log(inputLocationObject, destinationCoords);
      setDestinationCity(markerCity);
      if (originCity != null) {
        setMapMarkers([originCoords, destinationCoords]);
        setModalVisible(false);
        bottomSheetModalRef.current.dismiss();
        bottomSheetModalRef2.current.present();
      }
    }
    setMarkerVisible(false);
    bottomSheetModalDragMarker.current.dismiss();

    // const { latitude, longitude } = userLocation;
    // setMapMarkers([{ latitude, longitude }, markerCoordinate]);
    // bottomSheetModalDragMarker.current.dismiss();
    // bottomSheetModalRef2.current.present();
  };

  const handleLocationTextInputFocus = (value) => {
    console.log(value);
    setInputLocationObject(value);
  };

  const handleTypeCarPress = (type, price) => {
    return () => {
      console.log(type, price);
      setTypeCar(type);
      setRidePrice(price);
      bottomSheetModalRef2.current.dismiss();
      bottomSheetModalRef3.current.present();
    };
  };

  const handleConfirmButtonPress = () => {
    bottomSheetModalRef3.current.dismiss();
    bottomSheetModalRef4.current.present();
  };

  const handleBrandInputValueChange = (brand) => {
    setBrand(brand);
  };

  const handleModelInputValueChange = (model) => {
    setModel(model);
  };

  const handleLicenseInputValueChange = (license) => {
    setLicense(license);
  };

  const handleColorInputValueChange = (color) => {
    setColor(color);
  };

  /**** PROGRESS BAR
   */
  const [timer, setTimer] = useState(180); // 3 minutes in seconds
  const [isActive, setIsActive] = useState(false);

  useEffect(() => {
    let interval = null;

    if (isActive) {
      interval = setInterval(() => {
        setTimer((prevTimer) => prevTimer - 1);
      }, 1000);
    } else if (!isActive && timer !== 0) {
      clearInterval(interval);
    }

    if (timer === 0) {
      // Timer has reached 0, perform any action you need here
      console.log("Timer has reached 0!");
      clearInterval(interval);

      if (driver) return;

      const complaints = {
        title: "TimeOver",
        description: "Waiting time finish",
        idUser: user.id,
      };

      onConfirmCancelTrip({
        complaints,
      });

      Alert.alert("Não há um motorista disponível");
    }

    return () => clearInterval(interval);
  }, [isActive, timer, service, user, driver]);

  const startTimer = () => {
    setIsActive(true);
  };

  const resetTimer = () => {
    setIsActive(false);
    setTimer(180);
  };

  const formatTime = (time) => {
    const minutes = Math.floor(time / 60);
    const seconds = time % 60;

    return `${minutes.toString().padStart(2, "0")}:${seconds
      .toString()
      .padStart(2, "0")}`;
  };

  const calculateProgress = () => {
    return 1 - timer / 180; // Calculate the progress as a decimal value
  };

  /****  SERVER TRIGGERS
   * CLIENT
   * DRIVER
   */

  const animateMarker = (newLatitude, newLongitude, animationDuration) => {
    const destination = {
      latitude: newLatitude,
      longitude: newLongitude,
    };

    markerAnimated.current?.animateMarkerToCoordinate(
      destination,
      animationDuration
    );
  };

  const simulateMovement = (newLatitude, newLongitude) => {
    animateMarker(newLatitude, newLongitude, 7000);

    // Call the function again after a delay
    setTimeout(simulateMovement, 7000);
  };

  useEffect(() => {
    // Handle events from the server

    const handleBestDriver = (data) => {
      try {
        console.log("bestDriver event:", data);
        // handleDriverAccept(data.location, data.atual);
      } catch (error) {
        console.error("Error handling bestDriver event:", error);
      }
    };

    const handleNoDriver = (data) => {
      try {
        const { idUser } = data;
        if (idUser === user.id) {
          console.log("noDriver event:");
          Alert.alert("Não há um motorista disponível");
        }
      } catch (error) {
        console.error("Error handling noDriver event:", error);
      }
    };

    const handleDriverConnected = (data) => {
      try {
        console.log("driverConnected event:", data);
        if (data && data.location && data.service && data.service.pickup) {
          setDriverConnected(true);
          handleDriverConnect(data.location, data.service.pickup);
          setDriver(data.driver);
          setDriverLocation(data.location);
        }
      } catch (error) {
        console.error("Error handling driverConnected event:", error);
      }
    };

    const handleServiceAccepted = (data) => {
      try {
        console.log("serviceAccepted event:", data);
        handleDriverAccepted(data);
      } catch (error) {
        console.error("Error handling serviceAccepted event:", error);
      }
    };

    const handleDriverDeclined = (data) => {
      try {
        console.log("driverDeclined event:", data);
        const { idUser, idService, userLocation } = data;
        const { longitude, latitude } = userLocation;
        socket.emit("chooseBestDriver", {
          idUser,
          idService,
          userLocation: [longitude, latitude],
        });
      } catch (error) {
        console.error("Error handling driverDeclined event:", error);
      }
    };

    const handleDriverLocation = (data) => {
      try {
        console.log("driverLocation event:", data);
        if (data && data.service && data.location) {
          const { service, location } = data;

          switch (service.status) {
            case 1: {
              setDriverLocation(location);
              // markerAnimated.current.animateMarkerToCoordinate(
              //   location,7000
              // )
              setMapMarkers([location, service.pickupLocation]);

              if (serviceStatus) {
                console.log("AQUI");
                setServiceStatus(null);
              }

              simulateMovement(location.longitude, location.longitude, 10000);
              const distance = getDistanceInKm(
                service.pickupLocation,
                location
              );
              if (distance < 0.3) {
                setMapDirections();
                bottomSheetModalRef6.current.dismiss();
                bottomSheetModalRef7.current.present();
              }
              break;
            }
            case 2: {
              setDriverLocation(location);
              setMapMarkers([location, service.dropoffLocation]);
              break;
            }
            default:
              break;
          }
        }
      } catch (error) {
        console.error("Error handling driverLocation event:", error);
      }
    };

    const handleServiceStarted = (data) => {
      try {
        if (data && data.status === "in-progress") {
          bottomSheetModalRef7.current.dismiss();
          bottomSheetModalRef8.current.present();
        }
      } catch (error) {
        console.error("Error handling serviceStarted event:", error);
      }
    };

    const handleServiceEnded = (data) => {
      try {
        if (data && data.status === "completed") {
          bottomSheetModalRef8.current.dismiss();
          setModalConfirmationVisible(true);

          console.log("Trip completed:", user);
        }
      } catch (error) {
        console.error("Error handling serviceEnded event:", error);
      }
    };

    const handleServiceCancelled = (data) => {
      try {
        
        console.log("serviceCancelled event:", data);
        // Handle the service cancellation here
        Alert.alert("Serviço cancelado", "O motorista cancelou o serviço",
          [
            {
              text: "OK",
              onPress: () => {
                resetToInitialState();
              },
            },
          ]);
      } catch (error) {
        console.error("Error handling serviceCancelled event:", error);
      }
    };

    socket.on("bestDriver", handleBestDriver);
    socket.on("driverConnected", handleDriverConnected);
    socket.on("driverLocation", handleDriverLocation);
    socket.on("serviceAccepted", handleServiceAccepted);
    socket.on("serviceDeclined", handleDriverDeclined);
    socket.on("serviceStarted", handleServiceStarted);
    socket.on("serviceEnded", handleServiceEnded);
    socket.on("serviceCancelled", handleServiceCancelled);
    socket.on("noDriver", handleNoDriver);
    return () => {
      // Clean up the socket connection
      socket.disconnect();
    };
  }, []);

  const handleDriverConnect = (driverLocation, coords) => {
    console.log("MAPMARKERS: ", coords);
    setMapMarkers([driverLocation, coords]);
  };

  const handleDriverAccepted = async (data) => {
    try {
      bottomSheetModalRef5.current.dismiss();
      bottomSheetModalRef6.current.present();
      // await AsyncStorage.setItem("appState", {
      //   status: "in-progress",
      //   service: { data },
      // });
    } catch (error) {
      console.error("Error saving app state: ", error);
    }
  };

  const handleConfirmPaymentPress = (payment_type) => {
    return async () => {
      if (!socket.connected) {
        console.warn("Socket is not connected. Unable to emit data.");
        Alert.alert("Não há conexão com o servidor.");
        return;
      }

      console.log("Confirm Payment");
      console.log(typeCar);

      bottomSheetModalRef4.current.dismiss();
      bottomSheetModalRef5.current.present();
      setCarsAround([]);
      startTimer();

      try {
        const requestData = {
          user: user.id,
          locations: [
            {
              name: originCity,
              coordinates: {
                latitude: mapMarkers[0].latitude,
                longitude: mapMarkers[0].longitude,
              },
            },
            {
              name: destinationCity,
              coordinates: {
                latitude: mapMarkers[1].latitude,
                longitude: mapMarkers[1].longitude,
              },
            },
          ],
          status: "requested",
          user_car_details: `${brand} ${model}, ${color}, ${license}`,
          payment: {
            value: ridePrice,
            method: payment_type,
            discount: user.discount?.active ? user.discount.percentage : null,
          },
          type_car: typeCar,
        };

        //maybe alter here
        const resp = await axios.post(`${IP}/service/`, requestData);
        console.log("Request successful:", resp.data);
        setService(resp.data);

        //console.log("SERVICO",service)
        const data = {
          idService: resp.data._id,
          userLocation: [mapMarkers[0].longitude, mapMarkers[0].latitude],
          user: user._id,
        };

        socket.emit("chooseBestDriver", data);

        return resp.data;
      } catch (error) {
        console.error("An error occurred:", error.message);
        return null;
      }
    };
  };

  const handleDetailsForm = (bottomSheet) => {
    console.log(detailsInfo);
    setDetailsInfo({ bottomSheet: bottomSheet });
    bottomSheet.current.dismiss();
    bottomSheetModalRefDetails.current.present();
  };

  /** DISTANCE
   */
  const getDistanceInKm = (pickup, drop) => {
    const { lat1, lon1 } = { lat1: pickup.latitude, lon1: pickup.longitude };
    const { lat2, lon2 } = { lat2: drop.latitude, lon2: drop.longitude };

    const earthRadius = 6371; // Radius of the Earth in kilometers
    const dLat = toRadians(lat2 - lat1);
    const dLon = toRadians(lon2 - lon1);

    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(toRadians(lat1)) *
        Math.cos(toRadians(lat2)) *
        Math.sin(dLon / 2) *
        Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    const distance = earthRadius * c;

    return distance;
  };

  function toRadians(degrees) {
    return (degrees * Math.PI) / 180;
  }

  /**
   * BOTTOM SHEET
   */

  const endTrip = () => {
    setModalConfirmationVisible(true);
  };

  const onConfirmCancelTrip = (complaints) => {
    if (service) {
      socket.emit("serviceCancel", { idService: service._id, complaints });
      bottomSheetModalRef6.current.dismiss();
      bottomSheetModalRef5.current.dismiss();
      setService();
      setMapDirections();
      setMapMarkers([]);
      setDriverLocation();
      bottomSheetModalRef.current.present();
    }
  };

  const handleCancelTrip = (question) => {
    const complaints = {
      title: "Cancelled by user",
      description: question,
      idUser: user.id,
    };
    console.log("cancel", complaints);
    onConfirmCancelTrip(complaints);
  };

  const handleMessageDriver = () => {
    setModalChatVisible(true);
  };

  const closeChatModel = () => {
    setModalChatVisible(false);
  };

  const handlePressQuestion = (question) => {
    handleCancelTrip(question);
    handleCancelAlert();
  };

  useEffect(() => {
    console.log("SERVICE STATUS", serviceStatus);
    if (
      !serviceStatus ||
      serviceStatus?.service?.status === "nodriver" ||
      serviceStatus?.service?.status === "cancelled"
    )
      return;
    const { service, car } = serviceStatus;
    const status = service.status;
    console.log("STATUS", status);
    const room = `service-request-${serviceStatus.service._id}`;
    setDriver({
      id: service.driver._id,
      driverId: service.driver._id,
      name: `${service.driver.details.name} ${service.driver.details.surname}`,
      photo: service.driver.user_photo_url,
      status: service.driver.status,
      rating: service.driver.rating,
      numServices: service.driver.numServices,
      car: {
        name: `${car.brand} ${car.model} ${car.color}`,
        licensePlate: car.licensePlate,
      },
    });
    setOriginCity(service.locations[0].name);
    setDestinationCity(service.locations[1].name);
    switch (status) {
      case "in-progress":
        console.log("Socket connected!", room);
        socket.emit("join", room);
        bottomSheetModalRef.current.dismiss();
        bottomSheetModalRef8.current.present();
        setService(service);
        break;

      case "assigned":
        console.log("Socket connected!", room);
        socket.emit("join", room);
        bottomSheetModalRef.current.dismiss();
        bottomSheetModalRef6.current.present();
        setService(service);
        break;

      case "completed":
        // Handle completed status here
        // Add your code for completed status
        setRidePrice(service.payment.value);
        setService(service);
        setModalConfirmationVisible(true);

        break;

      default:
        break;
    }
  }, [serviceStatus]);

  const handleCancelAlert = () => {
    Alert.alert(
      "VIAGEM CANCELADA",
      "O motivo de cancelamento foi levado em consideração!",
      [
        {
          text: "OK",
          style: "cancel",
          onPress: () => {
            setModalPreCancelVisible(false);
            setModalCancelVisible(false);
          },
        },
      ],
      {
        cancelable: false,
      }
    );
  };

  const handlePressCancel = () => {
    setModalCancelVisible(true);
  };

  const resetToInitialState = () => {
    bottomSheetModalRef?.current.present();
    bottomSheetModalRef2?.current.dismiss();
    bottomSheetModalRef3?.current.dismiss();
    bottomSheetModalRef4?.current.dismiss();
    bottomSheetModalRef5?.current.dismiss();
    bottomSheetModalRef6?.current.dismiss();
    bottomSheetModalRef7?.current.dismiss();
    bottomSheetModalRef8?.current.dismiss();
    bottomSheetModalRefDetails?.current.dismiss();
    bottomSheetModalDragMarker?.current.dismiss();

    setModalVisible(false);
    setModalSavedPlacesVisible(false);
    setModalCancelVisible(false);
    setModalPreCancelVisible(false);
    setModalChatVisible(false);
    setMapMarkers([]);
    setMapDirections();
    setTypeCar("Turismo");
    setRidePrice("25,300");
    setService();
    setDriver();
    setDriverConnected(false);
    setTripDuration();
    setModalConfirmationVisible(false);
    setDetailsInfo();
    setMarkerVisible();
    setInputLocationObject();
    setMarkerCity();
    setOriginCity();
    setDestinationCity();
    setOriginCoords();
    setDestinationCoords();
    setIsCurrLocation();
    setDriverLocation();
    setCarsAround([]);
  };

  return {
    models: {
      user,
      userLocation,
      prices,
      service,
      driver,
      mapRef,
      markerAnimated,
      modalVisible,
      modalCancelVisible,
      modalSavedPlacesVisible,
      modalConfirmationVisible,
      modalChatVisible,
      modalPreCancelVisible,
      mapMarkers,
      markerVisible,
      markerCity,
      originCity,
      destinationCity,
      inputLocationObject,
      mapDirections,
      tripDuration,
      favPlaces,
      bottomSheetModalRef,
      bottomSheetModalRef2,
      bottomSheetModalRef3,
      bottomSheetModalRef4,
      bottomSheetModalRef5,
      bottomSheetModalRef6,
      bottomSheetModalRef7,
      bottomSheetModalRef8,
      bottomSheetModalRefDetails,
      bottomSheetModalDragMarker,
      typeCar,
      ridePrice,
      isRouteVisible,
      brand,
      model,
      license,
      color,
      carsAround,
      timer,
      isActive,
      detailsInfo,
      driverConnected,
      isCurrLocation,
      driverLocation,
      questions,
      newSavedPlaceAddress,
    },
    operations: {
      handleUserLocationChange,
      handleMapSearchBarPress,
      handlePreCancelButtonPress,
      handleAddFavouriteButtonPress,
      handleOnFavouriteButtonPress,
      closeDestinationModal,
      closeCancelModal,
      closeSavedPlacesModal,
      closeConfirmationModal,
      closeChatModel,
      closePreCancelModal,
      handlePressItemPress,
      handlePressSelectTypeRoad,
      handleMapDirectionsReady,
      handleMarkerDragPress,
      handleMarkerDragSavedPlaces,
      handleMarkerDragEnd,
      handleConfirmDraggablePress,
      handleLocationTextInputFocus,
      handleBackButtonPress,
      handleTypeCarPress,
      handleBrandInputValueChange,
      handleModelInputValueChange,
      handleLicenseInputValueChange,
      handleColorInputValueChange,
      handleConfirmButtonPress,
      handleConfirmPaymentPress,
      handleMessageDriver,
      handleCancelTrip,
      startTimer,
      resetTimer,
      formatTime,
      calculateProgress,
      handleDetailsForm,
      handleBackDetailsButtonPress,
      endTrip,
      handlePressQuestion,
      handlePressCancel,
      resetToInitialState,
    },
  };
};
