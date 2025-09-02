import { useContext, useEffect, useRef, useState } from "react";
import { useUserLocationStateContext } from "../../context/UserLocationStateContext";
import { scale } from "react-native-size-matters";
import { useSocket } from "../../context/SocketContext";
import { useUserData } from "../../context/UserDataContext";
import Geocoder from "react-native-geocoding";
import { Alert, Keyboard } from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import api from "../../services/APIService";
import ErrorService from "../../services/ErrorService";
import { useLogger } from "../../hooks/useLogger";

const IP = process.env.EXPO_PUBLIC_UREBOQUE_API; //attt ao apagar

Geocoder.init(process.env.EXPO_PUBLIC_GOOGLE_MAPS_API_KEY);

const LATITUDE_DELTA = 0.0022;
const LONGITUDE_DELTA = 0.005;
const DEFAULT_TIMER_DURATION = 180; // 3 minutes in seconds

export const useMapScreen = () => {
  const logger = useLogger('useMapScreen');
  
  // --- Refs ---
  const mapRef = useRef(null);
  const bottomSheetModalRef = useRef(null);
  const pollingTimerRef = useRef(null);

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
  const [isLoadingDrivers, setIsLoadingDrivers] = useState(false);
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
  const { socket } = useSocket();
  const {
    user,
    fetchUserById,
    removeDiscount,
    serviceStatus,
    setServiceStatus,
    prices,
    fetchPrices,
  } = useUserData();

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
      logger.error("Error fetching address", error);
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

  // Note: simulateMovement removed to prevent memory leaks

  const centerToUserLocation = () => {
    if (userLocation && !driver && !hasCentered) {
      // when user moves it centers
      mapRef.current?.animateToRegion({
        latitude: userLocation.latitude,
        longitude: userLocation.longitude,
        latitudeDelta: LATITUDE_DELTA,
        longitudeDelta: LONGITUDE_DELTA,
      });
      logger.debug("User location updated", { latitude: userLocation?.latitude, longitude: userLocation?.longitude });
      setHasCentered(true);
    }
  };

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
    if (!socket) {
      logger.warn("Socket not available, skipping event listeners");
      return () => {}; // Return empty cleanup function
    }

    // Handle events from the server

    const handleBestDriver = (data) => {
      try {
        logger.info("Socket event: bestDriver", data);
        // handleDriverAccept(data.location, data.atual);
      } catch (error) {
        logger.error("Error handling bestDriver event", error);
      }
    };

    const handleNoDriver = (data) => {
      try {
        logger.info("Socket event: noDriver");
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
        logger.error("Error handling noDriver event", error);
      }
    };

    const handleDriverConnected = (data) => {
      try {
        logger.info("Socket event: driverConnected", data);
        if (data && data.location && data.service && data.service.pickup) {
          setDriverConnected(true);
          handleDriverConnect(data.location, data.service.pickup);
          setDriver(data.driver);
          setDriverLocation(data.location);
        }
      } catch (error) {
        logger.error("Error handling driverConnected event", error);
      }
    };

    const handleServiceAccepted = (data) => {
      try {
        logger.info("Socket event: serviceAccepted", data);
        handleDriverAccepted(data);
      } catch (error) {
        logger.error("Error handling serviceAccepted event", error);
      }
    };

    const handleDriverDeclined = (data) => {
      try {
        logger.info("Socket event: driverDeclined", data);
        const { idUser, idService, userLocation } = data;
        const { longitude, latitude } = userLocation;
        if (socket?.connected) {
          socket.emit("chooseBestDriver", {
            idUser,
            idService,
            userLocation: [longitude, latitude],
          });
        }
      } catch (error) {
        logger.error("Error handling driverDeclined event", error);
      }
    };

    const handleDriverLocation = (data) => {
      try {
        logger.info("Socket event: driverLocation", data);
        if (data && data.service && data.location) {
          const { service, location } = data;

          switch (service.status) {
            case 1: {
              setDriverLocation(location);
            
              setMapMarkers([location, service.pickupLocation]);

              if (serviceStatus) {
                logger.debug("Service status reset");
                setServiceStatus(null);
              }

              // Driver location will be updated through real-time socket events
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
        logger.error("Error handling driverLocation event", error);
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
        logger.error("Error handling serviceStarted event", error);
      }
    };

    const handleServiceEnded = (data) => {
      try {
        if (data && data.status === "completed") {
          tripEndingSheetRef.current.dismiss();
          setModalConfirmationVisible(true);

          logger.info("Trip completed", { userId: user?.id });
        }
      } catch (error) {
        logger.error("Error handling serviceEnded event", error);
      }
    };

    const handleServiceCancelled = (data) => {
      try {
        logger.info("Socket event: serviceCancelled", data);
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
        logger.error("Error handling serviceCancelled event", error);
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
      // Clean up the socket event listeners
      if (socket) {
        socket.off("bestDriver", handleBestDriver);
        socket.off("driverConnected", handleDriverConnected);
        socket.off("driverLocation", handleDriverLocation);
        socket.off("serviceAccepted", handleServiceAccepted);
        socket.off("serviceDeclined", handleDriverDeclined);
        socket.off("serviceStarted", handleServiceStarted);
        socket.off("serviceEnded", handleServiceEnded);
        socket.off("serviceCancelled", handleServiceCancelled);
        socket.off("noDriver", handleNoDriver);
      }
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
      logger.warn("Timer has reached 0!");
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

  // Effect - Fetch nearby drivers with interval polling
  useEffect(() => {
    // Don't search if service exists or no user location
    if (!userLocation || service) {
      setCarsAround([]); // Clear cars when service is active
      return;
    }

    // Initial fetch
    getNearbyDrivers();
    
    // Set up interval for continuous polling
    pollingTimerRef.current = setInterval(getNearbyDrivers, 20000);

    return () => {
      // Clear polling timer to prevent memory leaks
      if (pollingTimerRef.current) {
        clearInterval(pollingTimerRef.current);
        pollingTimerRef.current = null;
      }
    };
  }, [userLocation, service]);

  // Effect - Manage service status updates
  useEffect(() => {
    logger.info('useMapScreen', 'Service status update', { status: serviceStatus?.service?.status });
    if (
      !serviceStatus ||
      serviceStatus?.service?.status === "nodriver" ||
      serviceStatus?.service?.status === "cancelled"
    )
      return;
    const { service, car } = serviceStatus;
    const status = service.status;
    logger.info('useMapScreen', 'Processing service status', { status });
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
        logger.info('useMapScreen', 'Socket connected for room join (in-progress)', { room });
        if (socket?.connected) {
          socket.emit("join", room);
        } else {
          logger.warn('useMapScreen', 'Socket not connected for room join', { room });
        }
        bottomSheetModalRef.current.dismiss();
        tripEndingSheetRef.current.present();
        setService(service);
        setTripState('in-progress'); // Update trip state
        break;

      case "assigned":
        logger.info('useMapScreen', 'Socket connected for room join (assigned)', { room });
        if (socket?.connected) {
          socket.emit("join", room);
        } else {
          logger.warn('useMapScreen', 'Socket not connected for room join', { room });
        }
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
    if (isLoadingDrivers || service) return; // Don't search if already loading or service exists
    
    setIsLoadingDrivers(true);
    try {
      const params = {
        latitude: userLocation?.latitude,
        longitude: userLocation?.longitude,
        maxDistance: 5000,
      };
      const resp = await api.get("/drivers/nearby", {
        params: params,
      });

      logger.info("Nearby drivers found", { count: resp.data?.length });

      const nearbyDrivers = resp.data.map((driverData) => ({
        latitude: driverData.location.latitude,
        longitude: driverData.location.longitude,
        color: driverData.driver.car.color,
      }));

      logger.debug("Searching for nearby drivers", { count: nearbyDrivers?.length });
      setCarsAround(nearbyDrivers);
      logger.info("Driver search completed");
    } catch (error) {
      ErrorService.handleAPIError(error);
    } finally {
      setIsLoadingDrivers(false);
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
      logger.debug("Origin coordinates set", { inputLocationObject, coordinates: originCoords });
      setOriginCity(markerCity);
      if (destinationCity != null) {
        setMapMarkers([originCoords, destinationCoords]);
        setModalVisible(false);
        bottomSheetModalRef.current.dismiss();
        carTypeSelectionSheetRef.current.present();
      }
    } else if (inputLocationObject === 1) {
      logger.debug("Destination coordinates set", { inputLocationObject, coordinates: destinationCoords });
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
      logger.info("Type car pressed", { type, price });
      logger.debug("Current state", {
        typeCar,
        ridePrice,
        carTypeSelectionSheetRef: carTypeSelectionSheetRef.current ? 'exists' : 'null',
        userCarInfoSheetRef: userCarInfoSheetRef.current ? 'exists' : 'null'
      });

      setTypeCar(type);
      setRidePrice(price);
      setActiveBottomSheet('carTypeSelection');

      if (carTypeSelectionSheetRef.current) {
        logger.debug("Dismissing carTypeSelectionSheetRef");
        carTypeSelectionSheetRef.current.dismiss();
      } else {
        logger.warn("carTypeSelectionSheetRef is not available");
      }

      // Add a delay and use requestAnimationFrame for smoother transitions
      setTimeout(() => {
        requestAnimationFrame(() => {
          if (userCarInfoSheetRef.current) {
            logger.debug("Attempting to present userCarInfoSheetRef");
            userCarInfoSheetRef.current.present();
            setActiveBottomSheet('userCarInfo');
          } else {
            logger.warn("userCarInfoSheetRef is not available");
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
        logger.warn("Socket is not connected. Unable to emit data.");
        Alert.alert("Não há conexão com o servidor.");
        return;
      }

      logger.info("Confirm Payment");
      logger.debug("Selected car type", { typeCar });

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
        const resp = await api.post("/service/", requestData);
        logger.info("Service request successful", { serviceId: resp.data?._id });
        setService(resp.data);

        //console.log("SERVICO",service)
        const data = {
          idService: resp.data._id,
          userLocation: [mapMarkers[0].longitude, mapMarkers[0].latitude],
          user: user._id,
        };

        if (socket?.connected) {
          socket.emit("chooseBestDriver", data);
        } else {
          logger.warn("Socket not connected for chooseBestDriver");
        }

        return resp.data;
      } catch (error) {
        ErrorService.handleAPIError(error);
        return null;
      }
    };
  };

  const handlePressItemPress = (coords, address, inputRef) => {
    if (inputLocationObject === 0) {
      logger.debug("Origin coordinates", { coords });
      setOriginCoords(coords);
      setOriginCity(address);
      setIsCurrLocation();
      inputRef.current.focus();
      logger.debug("Location data updated", { inputLocationObject, coords, address });
    } else if (inputLocationObject === 1) {
      logger.debug("Destination coordinates", { coords });
      logger.debug("Location data updated", { inputLocationObject, coords, address });

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
      logger.debug("Debug checkpoint - AQUI");
      setModalVisible(false);
      setMarkerVisible(true);
      bottomSheetModalRef.current.dismiss();
      bottomSheetModalDragMarker.current.present();
    };
  };

  const handleMarkerDragSavedPlaces = () => {
    logger.debug("Debug checkpoint - AQUI");
    setNewSavedPlaceAddress({ pos: 1, city: "", callback: false });
    setModalSavedPlacesVisible(false);
    setMarkerVisible(true);
    carTypeSelectionSheetRef.current.dismiss();
    bottomSheetModalDragMarker.current.present();
  };

  const handleMarkerDragEnd = ({ latitude, longitude }) => {
    getAddressFromCoordinates(latitude, longitude);
    logger.debug("Debug checkpoint - AQUI 2", { latitude, longitude, newSavedPlaceAddress });

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
    logger.debug("Value logged", { value });
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
    logger.debug("Details info", { detailsInfo });
    setDetailsInfo({ bottomSheet: bottomSheet });
    bottomSheet.current.dismiss();
    bottomSheetModalRefDetails.current.present();
  };

  const endTrip = () => {
    setModalConfirmationVisible(true);
  };

  const onConfirmCancelSearch = (complaints) => {
    if (socket?.connected) {
      socket.emit("searchCancel", { idService: service._id, complaints });
    } else {
      logger.warn("Socket not connected for searchCancel");
    }
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
      if (socket?.connected) {
        socket.emit("serviceCancel", { idService: service._id, complaints });
      } else {
        logger.warn("Socket not connected for serviceCancel");
      }
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
    logger.info("Canceling search...");
    const complaints = {
      title: "Search Cancellation",
      description: "User cancelled the search",
      idUser: user.id,
    };
    logger.info("Complaint registered", { complaints });
    onConfirmCancelSearch(complaints);
    resetTimer();
  };

  const handleCancelTrip = (question) => {
    const complaints = {
      title: "Cancelled by user",
      description: question,
      idUser: user.id,
    };
    logger.debug("Cancel complaints", { complaints });
    onConfirmCancelTrip(complaints);
    resetTimer();
  };

  const handlePressQuestion = (question) => {
    handleCancelTrip(question);
    handleCancelAlert();
  };

  const handleMapDirectionsReady = (routeInfo) => {
    logger.debug("Route coordinates", { coordinates: routeInfo.coordinates });
    setMapDirections(routeInfo);
    setTripDuration(routeInfo?.duration);
  };

  const handleDriverConnect = (driverLocation, coords) => {
    logger.debug("Map markers set", { coords });
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
      logger.error("Error saving app state", error);
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
