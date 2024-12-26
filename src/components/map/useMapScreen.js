import { useContext, useEffect, useRef, useState } from "react";
import { useUserLocationStateContext } from "../../context/UserLocationStateContext";
import { scale } from "react-native-size-matters";
import { useCallback } from "react";
import { UserContext } from "../../context/UserContext";
import axios from "axios";
import Geocoder from "react-native-geocoding";
import { Alert, Keyboard } from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { set } from "react-native-reanimated";

const IP = process.env.EXPO_PUBLIC_UREBOQUE_API; //attt ao apagar

Geocoder.init("AIzaSyBqPFzMJ7TgohKLMZ8Q0Z1iRVmk63OWWpk");

const LATITUDE_DELTA = 0.0022;
const LONGITUDE_DELTA = 0.005;
const DEFAULT_TIMER_DURATION = 180; // 3 minutes in seconds

export const useMapScreen = () => {
  // --- Refs ---
  const mapRef = useRef(null);
  const bottomSheetModalRef = useRef(null);

  // Modals
  const [modalVisible, setModalVisible] = useState(false);
  const [modalSavedPlacesVisible, setModalSavedPlacesVisible] = useState(false);
  const [modalCancelVisible, setModalCancelVisible] = useState(false);
  const [modalPreCancelVisible, setModalPreCancelVisible] = useState(false);
  const [modalChatVisible, setModalChatVisible] = useState(false);
  const [modalConfirmationVisible, setModalConfirmationVisible] =
    useState(null);

  // Bottom Sheets
  const carTypeSelectionSheetRef = useRef(null);
  const userCarInfoSheetRef = useRef(null);
  const paymentOptionsSheetRef = useRef(null);
  const rideSearchSheetRef = useRef(null);
  const tripStartedSheetRef = useRef(null);
  const driverArrivingSheetRef = useRef(null);
  const tripEndingSheetRef = useRef(null);
  const bottomSheetModalRefDetails = useRef(null);
  const bottomSheetModalDragMarker = useRef(null);
  const [activeBottomSheet, setActiveBottomSheet] = useState(null);

  // Map and Markers
  const [mapMarkers, setMapMarkers] = useState([]);
  const [mapDirections, setMapDirections] = useState(null);
  const [carsAround, setCarsAround] = useState([]);
  const [driverLocation, setDriverLocation] = useState(null);
  const [isSearchingNearby, setIsSearchingNearby] = useState(false);
  const [markerVisible, setMarkerVisible] = useState();
  const [markerCity, setMarkerCity] = useState();
  const [hasCentered, setHasCentered] = useState(false);

  // User Input
  const [originCity, setOriginCity] = useState(null);
  const [destinationCity, setDestinationCity] = useState(null);
  const [originCoords, setOriginCoords] = useState(null);
  const [destinationCoords, setDestinationCoords] = useState(null);
  const [isCurrLocation, setIsCurrLocation] = useState(null);

  // Car and Trip Details
  const [typeCar, setTypeCar] = useState("Turismo");
  const [ridePrice, setRidePrice] = useState("25,300");
  const [brand, setBrand] = useState("Toyota");
  const [model, setModel] = useState("Corolla");
  const [license, setLicense] = useState("LD-SOM");
  const [color, setColor] = useState("Preto");
  const [tripDuration, setTripDuration] = useState(null);
  const [inputLocationObject, setInputLocationObject] = useState(null);

  // Service and Driver
  const [service, setService] = useState(null);
  const [driver, setDriver] = useState(null);
  const [driverConnected, setDriverConnected] = useState(false);
  const [detailsInfo, setDetailsInfo] = useState();
  const [tripState, setTripState] = useState(null); // New state for trip status

  // Timer
  const [timer, setTimer] = useState(DEFAULT_TIMER_DURATION);
  const [isActive, setIsActive] = useState(false);

  // --- Context ---
  const {
    socket,
    user,
    fetchUserById,
    removeDiscount,
    serviceStatus,
    setServiceStatus,
    prices,
    fetchPrices,
  } = useContext(UserContext);

  const { userLocation, setUserLocation } = useUserLocationStateContext();

  // Marker for animation
  const markerAnimated = useRef(null);

  // Saved Places
  const [favPlaces, setFavPlaces] = useState([]);
  const [newSavedPlaceAddress, setNewSavedPlaceAddress] = useState({
    pos: 0,
    city: "",
  });

  // --- Derived State ---
  const isRouteVisible = mapMarkers.length === 2;

  // Cancellation Reasons
  const [questions, setQuestions] = useState([
    { key: 0, question: "O motorista não vem" },
    { key: 1, question: "O motorista se recusou a conduzir" },
    { key: 2, question: "O motorista está muito longe" },
    { key: 3, question: "Quero modificar o destino " },
    { key: 4, question: "Ponto de partida incorreto" },
    { key: 5, question: "Outro" },
  ]);

  // --- Helper Functions ---

  const getAddressFromCoordinates = async (lat, lng) => {
    try {
      const response = await Geocoder.from(lat, lng);
      const address = response.results[0]?.address_components[1]?.long_name;
      // console.log(response.results[0]);
      setMarkerCity(address);
      return address;
    } catch (error) {
      console.log("Error fetching address:", error);
    }
  };

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

  const formatDuration = (minutes) => {
    const hours = Math.floor(minutes / 60);
    const remainingMinutes = Math.floor(minutes % 60);

    if (hours > 0) {
      return `${hours} h ${remainingMinutes} mins`;
    } else {
      return `${remainingMinutes} mins`;
    }
  };

  // --- Map Manipulation Functions ---

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

  const centerToUserLocation = useCallback(() => {
    if (userLocation && !driver && !hasCentered) {
      // when user moves it centers
      mapRef.current?.animateToRegion({
        latitude: userLocation.latitude,
        longitude: userLocation.longitude,
        latitudeDelta: LATITUDE_DELTA,
        longitudeDelta: LONGITUDE_DELTA,
      });
      console.log(userLocation?.latitude, userLocation?.longitude);
      setHasCentered(true);
    }
  }, [userLocation?.latitude, userLocation?.longitude, hasCentered]);

  const handleUserLocationChange = ({ nativeEvent: { coordinate } }) => {
    if (coordinate && !modalVisible && !isRouteVisible) {
      setUserLocation(coordinate);
    }
  };

  // --- Timer Functions ---

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
  // --- Socket Event Handlers ---

  const handleSocketEvents = () => {
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
        console.log("noDriver event:");
        Alert.alert(
          "Não há um motorista disponível",
          "Tente novamente mais tarde",
          [
            {
              text: "OK",
              onPress: () => {
                backToPaymentScreen();
              },
            },
          ]
        );
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
                tripStartedSheetRef.current.dismiss();
                driverArrivingSheetRef.current.present();
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
          driverArrivingSheetRef.current.dismiss();
          tripEndingSheetRef.current.present();
          setTripState('in-progress'); // Update trip state
        }
      } catch (error) {
        console.error("Error handling serviceStarted event:", error);
      }
    };

    const handleServiceEnded = (data) => {
      try {
        if (data && data.status === "completed") {
          tripEndingSheetRef.current.dismiss();
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
        Alert.alert("Serviço cancelado", "O motorista cancelou o serviço", [
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
  };

  // --- Effect Hooks ---

  // Effect - Center map on user location initially
  useEffect(() => {
    centerToUserLocation();
  }, [centerToUserLocation]);

  // Effect - Update favorite places when user's saved places change
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

  // Effect - Fit map to route coordinates when they change
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

  // Effect - Manage the countdown timer
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

      Alert.alert(
        "Não há um motorista disponível",
        "Tente novamente mais tarde",
        [
          {
            text: "OK",
            onPress: () => {
              resetToInitialState();
            },
          },
        ]
      );
    }

    return () => clearInterval(interval);
  }, [isActive, timer, service, user, driver]);

  // Effect: Handle Socket Events - Attach/Detach listeners
  useEffect(() => {
    // Attach Socket Event listeners
    const cleanup = handleSocketEvents();

    // Cleanup function will be called when component unmounts
    return cleanup;
  }, [socket, user]);

  // Effect - Show initial bottom sheet and fetch nearby drivers
  useEffect(() => {
      bottomSheetModalRef.current.present();
  }, []);

  // Effect - Fetch nearby drivers when the component mounts and when service is null
  useEffect(() => {
    // Check if a service is not active before fetching nearby drivers
    if (!service && userLocation && !isSearchingNearby) {
      getNearbyDrivers();
    }

    return () => {
      setIsSearchingNearby(true);
    };
  }, [userLocation, isSearchingNearby]);

  // Effect - Manage service status updates
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
        color: car.color,
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
        tripEndingSheetRef.current.present();
        setService(service);
        setTripState('in-progress'); // Update trip state
        break;

      case "assigned":
        console.log("Socket connected!", room);
        socket.emit("join", room);
        bottomSheetModalRef.current.dismiss();
        tripStartedSheetRef.current.present();
        setService(service);
        setTripState('assigned'); // Update trip state
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

  // --- Data Fetching Functions ---

  const getNearbyDrivers = async () => {
    try {
      if (isSearchingNearby) return;
      const params = {
        latitude: userLocation?.latitude,
        longitude: userLocation?.longitude,
        maxDistance: 5000,
      };
      const resp = await axios.get(`${IP}/drivers/nearby`, {
        params: params,
      });

      console.log("NEARBY", resp.data);

      const nearbyDrivers = resp.data.map((driverData) => ({
        latitude: driverData.location.latitude,
        longitude: driverData.location.longitude,
        color: driverData.driver.car.color,
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

  // --- Button Press Handlers ---

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

  const handleOnFavouriteButtonPress = (item) => {
    return () => {
      setOriginCity(item.place.description);
      setOriginCoords({
        latitude: item.place.coordinates.latitude,
        longitude: item.place.coordinates.longitude,
      });
      setModalVisible(true);
      setInputLocationObject(true);
      setIsCurrLocation();
    };
  };

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
        carTypeSelectionSheetRef.current.present();
      }
    } else if (inputLocationObject === 1) {
      console.log(inputLocationObject, destinationCoords);
      setDestinationCity(markerCity);
      if (originCity != null) {
        setMapMarkers([originCoords, destinationCoords]);
        setModalVisible(false);
        bottomSheetModalRef.current.dismiss();
        carTypeSelectionSheetRef.current.present();
      }
    }
    setMarkerVisible(false);
    bottomSheetModalDragMarker.current.dismiss();
  };

  const handleTypeCarPress = (type, price) => {
    return () => {
      console.log("Type car pressed:", type, price);
      console.log("Current state:", {
        typeCar,
        ridePrice,
        carTypeSelectionSheetRef: carTypeSelectionSheetRef.current ? 'exists' : 'null',
        userCarInfoSheetRef: userCarInfoSheetRef.current ? 'exists' : 'null'
      });

      setTypeCar(type);
      setRidePrice(price);
      setActiveBottomSheet('carTypeSelection');

      if (carTypeSelectionSheetRef.current) {
        console.log("Dismissing carTypeSelectionSheetRef");
        carTypeSelectionSheetRef.current.dismiss();
      } else {
        console.log("carTypeSelectionSheetRef is not available");
      }

      // Add a delay and use requestAnimationFrame for smoother transitions
      setTimeout(() => {
        requestAnimationFrame(() => {
          if (userCarInfoSheetRef.current) {
            console.log("Attempting to present userCarInfoSheetRef");
            userCarInfoSheetRef.current.present();
            setActiveBottomSheet('userCarInfo');
          } else {
            console.log("userCarInfoSheetRef is not available");
          }
        });
      }, 500);
    };
  };

  const handleConfirmButtonPress = () => {
    Keyboard.dismiss();
    userCarInfoSheetRef.current.dismiss();
    paymentOptionsSheetRef.current.present();
    setActiveBottomSheet('paymentOptions');
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

      paymentOptionsSheetRef.current.dismiss();
      rideSearchSheetRef.current.present();
      setActiveBottomSheet('rideSearch');
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

  const handlePressItemPress = (coords, address, inputRef) => {
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
      carTypeSelectionSheetRef.current.present();
    }
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
    carTypeSelectionSheetRef.current.dismiss();
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

  const handleLocationTextInputFocus = (value) => {
    console.log(value);
    setInputLocationObject(value);
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

  const handlePressSelectTypeRoad = (type) => {
    setTypeCar(type);
  };

  const handleDetailsForm = (bottomSheet) => {
    console.log(detailsInfo);
    setDetailsInfo({ bottomSheet: bottomSheet });
    bottomSheet.current.dismiss();
    bottomSheetModalRefDetails.current.present();
  };

  const endTrip = () => {
    setModalConfirmationVisible(true);
  };

  const onConfirmCancelSearch = (complaints) => {
    socket.emit("searchCancel", { idService: service._id, complaints });
    tripStartedSheetRef.current?.dismiss();
    rideSearchSheetRef.current.dismiss();
    setService();
    setMapDirections();
    setMapMarkers([]);
    setDriverLocation();
    setDestinationCity();
    setOriginCity();
    bottomSheetModalRef.current.present();
  }

  const onConfirmCancelTrip = (complaints) => {
    if (service) {
      socket.emit("serviceCancel", { idService: service._id, complaints });
      tripStartedSheetRef.current?.dismiss();
      rideSearchSheetRef.current.dismiss();
      setService();
      setMapDirections();
      setMapMarkers([]);
      setDriverLocation();
      setDestinationCity();
      setOriginCity();
      bottomSheetModalRef.current.present();
    }
  };

  const handleCancelSearch = () => {
    console.log("Canceling search...");
    const complaints = {
      title: "Search Cancellation",
      description: "User cancelled the search",
      idUser: user.id,
    };
    console.log("Complaint registered: ", complaints);
    onConfirmCancelSearch(complaints);
    resetTimer();
  };

  const handleCancelTrip = (question) => {
    const complaints = {
      title: "Cancelled by user",
      description: question,
      idUser: user.id,
    };
    console.log("cancel", complaints);
    onConfirmCancelTrip(complaints);
    resetTimer();
  };

  const handlePressQuestion = (question) => {
    handleCancelTrip(question);
    handleCancelAlert();
  };

  const handleMapDirectionsReady = (routeInfo) => {
    console.log(routeInfo.coordinates);
    setMapDirections(routeInfo);
    setTripDuration(routeInfo?.duration);
  };

  const handleDriverConnect = (driverLocation, coords) => {
    console.log("MAPMARKERS: ", coords);
    setMapMarkers([driverLocation, coords]);
    setTripState('assigned');
  };

  const handleDriverAccepted = async (data) => {
    try {
      rideSearchSheetRef.current.dismiss();
      tripStartedSheetRef.current.present();
      setTripState('assigned'); // Update trip state
      setActiveBottomSheet('tripStarted');
      resetTimer();
    } catch (error) {
      console.error("Error saving app state: ", error);
    }
  };

  // --- Modal and Alert Handlers ---

  const closeDestinationModal = () => {
    setModalVisible(false);
    bottomSheetModalRef.current.present();
  };

  const closeSavedPlacesModal = () => {
    setModalSavedPlacesVisible(false);
    bottomSheetModalRef.current.present();
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

  const handlePreCancelButtonPress = () => {
    setModalPreCancelVisible(true);
  };

  const handleAddFavouriteButtonPress = () => {
    setModalSavedPlacesVisible(true);
  };

  const handleBackButtonPress = () => {
    if (isRouteVisible) {
      setMapMarkers([]);
      setOriginCity();
      setDestinationCity();
      setOriginCoords();
      setDestinationCoords();
      setMapDirections();
      centerToUserLocation();

      // Dismiss all bottom sheets
      carTypeSelectionSheetRef.current?.dismiss();
      userCarInfoSheetRef.current?.dismiss();
      paymentOptionsSheetRef.current?.dismiss();
      rideSearchSheetRef.current?.dismiss();
      tripStartedSheetRef.current?.dismiss();
      driverArrivingSheetRef.current?.dismiss();
      tripEndingSheetRef.current?.dismiss();
      
      // Present the initial bottom sheet
      setTimeout(() => {
        bottomSheetModalRef.current?.present();
      }, 300);

      // Reset other relevant states
      setBrand('');
      setModel('');
      setLicense('');
      setColor('');
      setMarkerVisible();
      setInputLocationObject();
      setOriginCity();
      setDestinationCity();
      setOriginCoords();
      setDestinationCoords();
      setMapMarkers([]);
      setMapDirections();
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

  const handleMessageDriver = () => {
    setModalChatVisible(true);
  };

  const closeChatModel = () => {
    setModalChatVisible(false);
  };

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

  const backToPaymentScreen = () => {
    resetTimer();
    rideSearchSheetRef.current.dismiss();
    paymentOptionsSheetRef.current.present();
    setActiveBottomSheet('paymentOptions');
  };
  // --- Reset to Initial State ---

  const resetToInitialState = () => {
    // setModalVisible(false);
    setModalSavedPlacesVisible(false);
    setModalCancelVisible(false);
    setModalPreCancelVisible(false);
    setModalChatVisible(false);


    bottomSheetModalRef?.current.present();

    setMapMarkers([]);
    setMapDirections();
    setTypeCar("Turismo");
    setRidePrice("25,300");
    setService();
    setTripState(null);
    setDriver();
    setDriverConnected(false);
    setTripDuration();
    setModalConfirmationVisible(false);
    setDetailsInfo();
    setMarkerVisible();
    setInputLocationObject();
    setOriginCity();
    setDestinationCity();
    setOriginCoords();
    setDestinationCoords();
    setIsCurrLocation();
    setDriverLocation();
    setCarsAround([]);
    resetTimer();
    resetActiveBottomSheet();

    // setTimeout(() => {
    //   // Only present the bottom sheet if the modal isn't already visible
    //   if (!modalVisible) {
    //     bottomSheetModalRef?.current.present();
    //   }
    // }, 50);
  };

  const resetActiveBottomSheet = () => {
    setActiveBottomSheet(null);
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
      carTypeSelectionSheetRef,
      userCarInfoSheetRef,
      paymentOptionsSheetRef,
      rideSearchSheetRef,
      tripStartedSheetRef,
      driverArrivingSheetRef,
      tripEndingSheetRef,
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
      activeBottomSheet,
      tripState,
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
      handleCancelSearch,
      startTimer,
      resetTimer,
      formatTime,
      formatDuration,
      calculateProgress,
      handleDetailsForm,
      handleBackDetailsButtonPress,
      endTrip,
      handlePressQuestion,
      handlePressCancel,
      resetToInitialState,
      resetActiveBottomSheet,
      getAddressFromCoordinates
    },
  };
};
