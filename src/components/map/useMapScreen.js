import { useContext, useEffect, useRef, useState, useCallback, useMemo } from "react";
import { useUserLocationStateContext } from "../../context/UserLocationStateContext";
import { scale } from "react-native-size-matters";
import { useSocket } from "../../context/SocketContext";
import { useUserData } from "../../context/UserDataContext";
import Geocoder from "react-native-geocoding";
import { Alert, Keyboard, Linking } from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import api from "../../services/APIService";
import ErrorService from "../../services/ErrorService";
import { useLogger } from "../../hooks/useLogger";
import { useNotification } from "../../context/NotificationContext";


Geocoder.init(process.env.EXPO_PUBLIC_GOOGLE_MAPS_API_KEY);

const LATITUDE_DELTA = 0.0022;
const LONGITUDE_DELTA = 0.005;
const DEFAULT_TIMER_DURATION = 180; // 3 minutes in seconds

export const useMapScreen = () => {
  const logger = useLogger('useMapScreen');

  // --- Refs ---
  const mapRef = useRef(null);
  const bottomSheetModalRef = useRef(null);
  // pollingTimerRef removed - timers now managed locally in effects

  // Modals - Consolidated state
  const [modalState, setModalState] = useState({
    destination: false,
    savedPlaces: false,
    cancel: false,
    preCancel: false,
    chat: false,
    confirmation: null,
  });

  // Helper function for modal updates
  const updateModal = (modalName, value) => {
    setModalState(prev => ({
      ...prev,
      [modalName]: value
    }));
  };

  // Saved addresses map drag callback
  const [savedAddressMapDragCallback, setSavedAddressMapDragCallback] = useState(null);
  const [markerCoordinates, setMarkerCoordinates] = useState(null);

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

  // Map and Markers - Consolidated state
  const [mapState, setMapState] = useState({
    markers: [],
    directions: null,
    routeCoordinates: [], // Full route for local trimming
    currentRoute: [],      // Sliced route for visual display
    carsAround: [],
    driverLocation: null,
    isLoadingDrivers: false,
    markerVisible: false,
    markerCity: null,
    markerCoordinates: null,
    hasCentered: false,
  });

  // Helper function for map state updates
  const updateMapState = (updates) => {
    setMapState(prev => ({
      ...prev,
      ...updates
    }));
  };

  // User Input
  const [originCity, setOriginCity] = useState(null);
  const [destinationCity, setDestinationCity] = useState(null);
  const [originCoords, setOriginCoords] = useState(null);
  const [destinationCoords, setDestinationCoords] = useState(null);
  const [isCurrLocation, setIsCurrLocation] = useState(null);

  // NEW: Unified Location Selection State
  const [locationSelection, setLocationSelection] = useState({
    origin: {
      address: null,
      coords: null,
      isCurrentLocation: false
    },
    destination: {
      address: null,
      coords: null,
      isCurrentLocation: false
    },
    activeInput: null, // 'origin' | 'destination' | null
    pendingDragLocation: {
      address: null,
      coords: null
    }
  });

  // Helper: Apply location selection for origin or destination
  const applyLocationSelection = useCallback((inputType, locationData) => {
    logger.debug("Applying location selection", { inputType, locationData });

    setLocationSelection(prev => ({
      ...prev,
      [inputType]: {
        address: locationData.address,
        coords: locationData.coords,
        isCurrentLocation: locationData.isCurrentLocation || false
      },
      pendingDragLocation: { address: null, coords: null }
    }));

    // Update legacy states for backward compatibility during transition
    if (inputType === 'origin') {
      setOriginCity(locationData.address);
      setOriginCoords(locationData.coords);
      if (!locationData.isCurrentLocation) {
        setIsCurrLocation();
      }
    } else if (inputType === 'destination') {
      setDestinationCity(locationData.address);
      setDestinationCoords(locationData.coords);
    }
  }, []);

  // Car and Trip Details - Consolidated state
  const [tripData, setTripData] = useState({
    // Car details
    carType: "Turismo",
    price: "25,300",
    brand: "Toyota",
    model: "Corolla",
    license: "LD-SOM",
    color: "Preto",

    // Trip details
    duration: null,
    inputLocationObject: null,

    // Service and Driver
    service: null,
    driver: null,
    driverConnected: false,
    detailsInfo: null,
    status: null, // Trip status
  });

  // Helper function for trip state updates
  const updateTripData = (updates) => {
    setTripData(prev => ({
      ...prev,
      ...updates
    }));
  };

  // Timer
  const [timer, setTimer] = useState(DEFAULT_TIMER_DURATION);
  const [isActive, setIsActive] = useState(false);

  // Unread Messages - now managed by NotificationContext
  const { unreadMessageCount, resetUnreadCount, handleIncomingMessages, setUnreadMessageCount } = useNotification();
  const lastMessageCountRef = useRef(0);

  // --- Context ---
  const { socket } = useSocket();
  const {
    user,
    serviceStatus,
    setServiceStatus,
    prices,
    fetchPrices,
  } = useUserData();

  const { userLocation, setUserLocation } = useUserLocationStateContext();

  // Marker for animation
  const markerAnimated = useRef(null);

  // Saved Places - Simplified (new system manages its own state)

  // --- Derived State ---
  const isRouteVisible = mapState.markers.length === 2;

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

  // Throttling utility for location updates
  const useThrottledCallback = (callback, delay) => {
    const lastRun = useRef(Date.now());

    return useCallback((...args) => {
      const now = Date.now();
      if (now - lastRun.current >= delay) {
        callback(...args);
        lastRun.current = now;
      }
    }, [callback, delay]);
  };

  // Cache for geocoding results
  const geocodeCache = useMemo(() => new Map(), []);

  const getAddressFromCoordinates = useCallback(async (lat, lng) => {
    const key = `${lat.toFixed(6)},${lng.toFixed(6)}`;

    if (geocodeCache.has(key)) {
      const cachedAddress = geocodeCache.get(key);
      updateMapState({ markerCity: cachedAddress });
      return cachedAddress;
    }

    try {
      const response = await Geocoder.from(lat, lng);
      const address = response.results[0]?.address_components[1]?.long_name;
      // console.log(response.results[0]);
      geocodeCache.set(key, address);
      updateMapState({ markerCity: address });
      return address;
    } catch (error) {
      logger.error("Error fetching address", error);
    }
  }, [geocodeCache]);

  // Simple cache for distance calculations
  const distanceCache = useRef(new Map());

  const getDistanceInKm = useCallback((pickup, drop) => {
    const key = `${pickup.latitude.toFixed(6)},${pickup.longitude.toFixed(6)}-${drop.latitude.toFixed(6)},${drop.longitude.toFixed(6)}`;

    if (distanceCache.current.has(key)) {
      return distanceCache.current.get(key);
    }

    // Original calculation logic
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

    distanceCache.current.set(key, distance);
    return distance;
  }, []);

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

  /**
   * Trims a polyline locally by finding the point on the route closest to the driver.
   * This provides the "premium" shortening line effect at zero cost.
   */
  const getSlicedRoute = useCallback((currentLocation, coordinates) => {
    if (!currentLocation || !coordinates || coordinates.length < 2) return coordinates;

    let closestIndex = 0;
    let minDistance = Infinity;

    // We only check the first few points to save CPU, as drivers usually move forward
    // but check enough to handle lag.
    const searchRange = Math.min(coordinates.length, 50);

    for (let i = 0; i < searchRange; i++) {
      const dist = getDistanceInKm(currentLocation, coordinates[i]);
      if (dist < minDistance) {
        minDistance = dist;
        closestIndex = i;
      }
    }

    // If driver is far from the current route start, they might be off-route
    // or we just need to jump to the closest point.
    // Return route starting from the driver's EXACT location, followed by the remaining path
    // This removes the "gap" between the car and the blue line.
    const pathAhead = coordinates.slice(closestIndex);
    return [currentLocation, ...pathAhead];
  }, [getDistanceInKm]);

  // Note: simulateMovement removed to prevent memory leaks

  const centerToUserLocation = useCallback(() => {
    if (userLocation && !tripData.driver && !mapState.hasCentered) {
      // when user moves it centers
      mapRef.current?.animateToRegion({
        latitude: userLocation.latitude,
        longitude: userLocation.longitude,
        latitudeDelta: LATITUDE_DELTA,
        longitudeDelta: LONGITUDE_DELTA,
      });
      logger.debug("User location updated", { latitude: userLocation?.latitude, longitude: userLocation?.longitude });
      updateMapState({ hasCentered: true });
    }
  }, [userLocation, tripData.driver, mapState.hasCentered]);

  // Throttled location update function
  const throttledLocationUpdate = useThrottledCallback((coordinate) => {
    if (coordinate && !modalState.destination && !isRouteVisible) {
      setUserLocation(coordinate);
    }
  }, 1000); // Update max once per second

  const handleUserLocationChange = ({ nativeEvent: { coordinate } }) => {
    throttledLocationUpdate(coordinate);
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
    return timer / 180; // Progress decreases as timer counts down
  };
  // --- Socket Event Handlers ---

  // Socket event handlers moved to outer scope for consolidated management
  const handleBestDriver = useCallback((data) => {
    try {
      logger.info("Socket event: bestDriver", data);
      // handleDriverAccept(data.location, data.atual);
    } catch (error) {
      logger.error("Error handling bestDriver event", error);
    }
  }, []);

  const handleNoDriver = useCallback((data) => {
    try {
      logger.info("Socket event: noDriver");
      Alert.alert(
        "Não há um motorista disponível",
        "Tente novamente mais tarde",
        [
          {
            text: "Cancelar",
            style: "cancel",
            onPress: () => {
              dismissAllBottomSheets();
              updateTripData({ service: null, status: null });
              resetToInitialState();
            },
          },
          {
            text: "Tentar de novo",
            onPress: () => {
              dismissAllBottomSheets();
              updateTripData({ service: null, status: null });
              resetTimer();

              setTimeout(() => {
                paymentOptionsSheetRef.current?.present();
              }, 300);
            },
          },
        ]
      );
    } catch (error) {
      logger.error("Error handling noDriver event", error);
    }
  }, []);

  const handleDriverConnected = useCallback((data) => {
    try {
      logger.info("Socket event: driverConnected", data);
      if (data && data.location && data.service && data.service.pickup) {
        updateTripData({ driverConnected: true });
        handleDriverConnect(data.location, data.service.pickup);
        updateTripData({ driver: data.driver });
        updateMapState({ driverLocation: data.location });
      }
    } catch (error) {
      logger.error("Error handling driverConnected event", error);
    }
  }, []);

  const handleServiceAccepted = useCallback((data) => {
    try {
      logger.info("Socket event: serviceAccepted", data);
      handleDriverAccepted(data);
    } catch (error) {
      logger.error("Error handling serviceAccepted event", error);
    }
  }, []);

  const handleDriverDeclined = useCallback((data) => {
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
  }, [socket]);

  const handleMessage = useCallback((messages) => {
    try {
      logger.info("Socket event: message", { messageCount: messages?.length });

      if (!messages || messages.length === 0) return;

      const currentMessageCount = messages.length;
      const previousCount = lastMessageCountRef.current;

      // Only process if there are actually new messages
      if (currentMessageCount > previousCount) {
        // Get only the new messages
        const newMessages = messages.slice(previousCount);

        // Use NotificationContext to handle incoming messages
        handleIncomingMessages(newMessages, user, modalState.chat);

        // Update the reference to current count
        lastMessageCountRef.current = currentMessageCount;
      }
    } catch (error) {
      logger.error("Error handling message event", error);
    }
  }, [logger, user, modalState.chat, handleIncomingMessages]);

  const handleDriverLocation = useCallback((data) => {
    try {
      if (data && data.service && data.location) {
        const { service, location } = data;

        // Batch all updates into a single object to minimize re-renders
        const updates = { driverLocation: location };

        // 1. Movement Threshold: Only re-calculate if the driver has moved at least 10 meters
        // This prevents excessive OOM on Android by ignoring GPS jitter
        const lastLoc = mapState.driverLocation;
        const movedDistance = lastLoc ? getDistanceInKm(lastLoc, location) * 1000 : Infinity;

        if (movedDistance > 10) { // 10 meters threshold
          logger.debug("Driver moved > 10m, updating route slicing");

          if (mapState.routeCoordinates?.length > 0) {
            const sliced = getSlicedRoute(location, mapState.routeCoordinates);
            updates.currentRoute = sliced;
          }
        }

        switch (service.status) {
          case 1: { // Going to pickup
            // Only update markers (API TRIGGER) if they aren't set yet for this phase
            if (mapState.markers.length < 2 || mapState.markers[1].latitude !== service.pickupLocation.latitude) {
              logger.info("Setting markers for pickup phase");
              updates.markers = [location, service.pickupLocation];
            }

            if (serviceStatus) {
              logger.debug("Service status reset");
              setServiceStatus(null);
            }

            const distance = getDistanceInKm(service.pickupLocation, location);
            if (distance < 0.3) {
              updates.directions = null;
              tripStartedSheetRef.current.dismiss();
              if (!tripData.detailsInfo?.isViewingDetails) {
                driverArrivingSheetRef.current.present();
              }
            }
            break;
          }
          case 2: { // Going to dropoff
            // Only update markers (API TRIGGER) if they aren't set yet for this phase
            if (mapState.markers.length < 2 || mapState.markers[1].latitude !== service.dropoffLocation.latitude) {
              logger.info("Setting markers for dropoff phase");
              updates.markers = [location, service.dropoffLocation];
            }
            break;
          }
        }

        // Single batch update
        updateMapState(updates);
      }
    } catch (error) {
      logger.error("Error handling driverLocation event", error);
    }
  }, [serviceStatus, tripData.detailsInfo, mapState.markers, mapState.routeCoordinates, mapState.driverLocation, getSlicedRoute, getDistanceInKm]);

  const handleServiceStarted = useCallback((data) => {
    try {
      if (data && data.status === "in-progress") {
        // Don't interfere if user is currently viewing details
        if (!tripData.detailsInfo?.isViewingDetails) {
          // Dismiss all sheets before showing trip ending sheet
          dismissAllBottomSheets();

          setTimeout(() => {
            tripEndingSheetRef.current.present();
          }, 300);
        }
        updateTripData({ status: 'in-progress' }); // Update trip state
      }
    } catch (error) {
      logger.error("Error handling serviceStarted event", error);
    }
  }, [tripData.detailsInfo]);

  const handleServiceEnded = useCallback((data) => {
    try {
      if (data && data.status === "completed") {
        // Dismiss all sheets before showing confirmation modal
        dismissAllBottomSheets();
        updateModal('confirmation', true);

        logger.info("Trip completed", { userId: user?.id });
      }
    } catch (error) {
      logger.error("Error handling serviceEnded event", error);
    }
  }, [user?.id]);

  const handleServiceCancelled = useCallback((data) => {
    try {
      logger.info("Socket event: serviceCancelled", data);
      // Handle the service cancellation here
      Alert.alert("Serviço cancelado", "O motorista cancelou o serviço", [
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
  }, []);


  // --- Effect Hooks ---

  // Effect - Center map on user location initially if no current service 
  useEffect(() => {
    centerToUserLocation();
  }, [centerToUserLocation]);

  // Effect - Update favorite places when user's saved places change
  // Computed favPlaces for bottom sheet display
  const [favPlaces, setFavPlaces] = useState([]);

  useEffect(() => {
    // Build favPlaces array from user's saved_places
    const userSavedPlaces = user?.saved_places || [];
    const addFavoriteItem = {
      _id: 'add-favorite',
      place: {
        name: 'Adicionar Favorito',
        description: 'Toque para adicionar um novo local favorito',
        coordinates: { latitude: 0, longitude: 0 }
      }
    };

    // Convert saved places to favPlaces format
    const convertedPlaces = userSavedPlaces.map(savedPlace => ({
      _id: savedPlace._id,
      place: {
        name: savedPlace.place.name,
        description: savedPlace.place.description,
        coordinates: savedPlace.place.coordinates
      }
    }));

    // Add "Adicionar Favorito" button at the end
    setFavPlaces([...convertedPlaces, addFavoriteItem]);
  }, [user?.saved_places]);

  // Effect - Fit map to route coordinates when they change
  useEffect(() => {
    if (mapState.directions?.coordinates) {
      mapRef.current?.fitToCoordinates(mapState.directions?.coordinates, {
        edgePadding: {
          bottom: scale(250),
          top: scale(50),
          left: scale(20),
          right: scale(20),
        },
      });
    }
  }, [mapState.directions?.coordinates]);

  // Effect: Handle Socket Events - Attach/Detach listeners  
  useEffect(() => {
    if (!socket) return;

    const eventHandlers = {
      bestDriver: handleBestDriver,
      driverConnected: handleDriverConnected,
      driverLocation: handleDriverLocation,
      serviceAccepted: handleServiceAccepted,
      serviceDeclined: handleDriverDeclined,
      serviceStarted: handleServiceStarted,
      serviceEnded: handleServiceEnded,
      serviceCancelled: handleServiceCancelled,
      noDriver: handleNoDriver,
      message: handleMessage,
    };

    // Register all handlers
    Object.entries(eventHandlers).forEach(([event, handler]) => {
      socket.on(event, handler);
    });

    return () => {
      // Clean up all handlers
      Object.entries(eventHandlers).forEach(([event, handler]) => {
        socket.off(event, handler);
      });
    };
  }, [socket]); // Simplified dependencies - handlers are stable

  // Effect - Show initial bottom sheet
  useEffect(() => {
    bottomSheetModalRef.current.present();
  }, []);

  // Effect - Consolidated timer management (polling + countdown)
  useEffect(() => {
    let pollingTimer = null;
    let countdownTimer = null;

    // Nearby drivers polling - only when no service and user location available
    if (userLocation && !tripData.service && !mapState.isLoadingDrivers) {
      const startPolling = () => {
        getNearbyDrivers(); // Initial fetch
        pollingTimer = setInterval(getNearbyDrivers, 20000);
      };
      startPolling();
    } else {
      updateMapState({ carsAround: [] }); // Clear cars when service is active
    }

    // Countdown timer - only when active and during driver search or waiting for acceptance
    if (isActive && tripData.service) {
      countdownTimer = setInterval(() => {
        setTimer((prevTimer) => {
          if (prevTimer <= 0) return 0; // Prevent negative numbers

          const newTimer = prevTimer - 1;

          // Handle timer reaching 0
          if (newTimer === 0) {
            setIsActive(false); // Stop the timer
            logger.warn("Timer has reached 0!");

            // Handle timeout regardless of driver connection status
            const complaints = {
              title: "TimeOver",
              description: "Waiting time finish",
              idUser: user.id,
            };

            // Only emit cancellation, do NOT reset state immediately
            // This ensures the current screen stays visible until the user answers the Alert
            if (tripData.service && socket?.connected) {
              socket.emit("searchCancel", { idService: tripData.service._id, complaints });
            } else {
              logger.warn("Socket not connected or no service for timer cancellation");
            }

            Alert.alert(
              "Não há um motorista disponível",
              "Tente novamente mais tarde",
              [
                {
                  text: "Cancelar",
                  style: "cancel",
                  onPress: () => {
                    resetToInitialState();
                  },
                },
                {
                  text: "Tentar de novo",
                  onPress: () => {
                    rideSearchSheetRef.current?.dismiss();
                    updateTripData({ service: null, status: null });
                    resetTimer();
                    setTimeout(() => {
                      paymentOptionsSheetRef.current?.present();
                    }, 300);
                  },
                },
              ]
            );
            return 0;
          }

          return newTimer;
        });
      }, 1000);
    }

    return () => {
      // Clean up both timers
      if (pollingTimer) clearInterval(pollingTimer);
      if (countdownTimer) clearInterval(countdownTimer);
    };
  }, [userLocation, tripData.service, isActive, tripData.driver, user]);

  // Effect - Manage service status updates
  useEffect(() => {
    logger.info('useMapScreen', 'Service status update', { status: serviceStatus?.service?.status });
    if (
      !serviceStatus ||
      serviceStatus?.service?.status === "nodriver" ||
      serviceStatus?.service?.status === "cancelled" ||
      serviceStatus?.service?.status === "flagged"
    )
      return;
    const { service, car } = serviceStatus;
    const status = service.status;
    logger.info('useMapScreen', 'Processing service status', { status });
    const room = `service-request-${serviceStatus.service._id}`;
    updateTripData({
      driver: {
        id: service.driver._id,
        driverId: service.driver._id,
        name: `${service.driver.details.name} ${service.driver.details.surname}`,
        photo: service.driver.user_photo_url,
        status: service.driver.status,
        rating: service.driver.rating,
        numServices: service.driver.numServices,
        phone: service.driver.phone,
        car: {
          name: `${car.brand} ${car.model} ${car.color}`,
          color: car.color,
          licensePlate: car.licensePlate,
        },
      }
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
        updateTripData({ service });
        updateTripData({ status: 'in-progress' }); // Update trip state
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
        updateTripData({ service });
        updateTripData({ status: 'assigned' }); // Update trip state
        break;

      case "completed":
        // Handle completed status here
        // Add your code for completed status
        updateTripData({ price: service.payment.value });
        updateTripData({ service });
        updateModal('confirmation', true);

        break;

      default:
        break;
    }
  }, [serviceStatus]);

  // --- Data Fetching Functions ---

  const getNearbyDrivers = async () => {
    if (mapState.isLoadingDrivers || tripData.service) return; // Don't search if already loading or service exists

    updateMapState({ isLoadingDrivers: true });
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
      updateMapState({ carsAround: nearbyDrivers });
      logger.info("Driver search completed");
    } catch (error) {
      ErrorService.handleAPIError(error);
    } finally {
      updateMapState({ isLoadingDrivers: false });
    }
  };

  // --- Button Press Handlers ---

  const handleMapSearchBarPress = () => {
    getAddressFromCoordinates(userLocation?.latitude, userLocation?.longitude);
    setOriginCity(mapState.markerCity);
    setOriginCoords({
      latitude: userLocation?.latitude,
      longitude: userLocation?.longitude,
    });
    if (mapState.markerCity) {
      updateModal('destination', true);
      setIsCurrLocation({
        latitude: userLocation?.latitude,
        longitude: userLocation?.longitude,
      });
    }
  };

  const handleOnFavouriteButtonPress = useCallback((item) => async () => {
    logger.debug('Favorite place pressed', {
      place: item.place.description,
      currentState: {
        originCity,
        isCurrLocation: !!isCurrLocation,
        originCoords: !!originCoords,
        locationSelectionOrigin: locationSelection.origin
      }
    });

    // Set favorite place as destination
    const destinationAddress = item.place.description;
    const destinationCoordinates = {
      latitude: item.place.coordinates.latitude,
      longitude: item.place.coordinates.longitude,
    };

    setDestinationCity(destinationAddress);
    setDestinationCoords(destinationCoordinates);

    // Update new location selection state
    setLocationSelection(prev => ({
      ...prev,
      destination: {
        address: destinationAddress,
        coords: destinationCoordinates,
        isCurrentLocation: false
      }
    }));

    // Determine origin coordinates - default to current location if nothing is set
    let originCoordinates = null;
    let originAddress = null;

    if (isCurrLocation || (originCoords && originCoords.latitude)) {
      // Use current location or already set origin
      logger.debug('Using legacy origin state');
      originCoordinates = originCoords || {
        latitude: userLocation?.latitude,
        longitude: userLocation?.longitude,
      };
      originAddress = originCity;
    } else if (locationSelection.origin.coords) {
      // Use new unified state origin
      logger.debug('Using locationSelection origin state', {
        address: locationSelection.origin.address,
        coords: locationSelection.origin.coords
      });
      originCoordinates = locationSelection.origin.coords;
      originAddress = locationSelection.origin.address;
    } else if (userLocation?.latitude && userLocation?.longitude) {
      // Default to user's current location
      logger.debug('Defaulting to current user location');
      originCoordinates = {
        latitude: userLocation.latitude,
        longitude: userLocation.longitude,
      };

      // Geocode address and wait for result
      try {
        originAddress = await getAddressFromCoordinates(userLocation.latitude, userLocation.longitude);
        logger.debug('Geocoded origin address', { originAddress });
      } catch (error) {
        logger.error("Failed to geocode origin address", error);
        originAddress = 'Localização Atual'; // Fallback
      }

      setOriginCity(originAddress);
      setOriginCoords(originCoordinates);
      setIsCurrLocation(originCoordinates);
      setLocationSelection(prev => ({
        ...prev,
        origin: {
          address: originAddress,
          coords: originCoordinates,
          isCurrentLocation: true
        }
      }));
    }

    logger.debug('Final origin for saved place', {
      originAddress,
      originCoordinates,
      willProceedToCarSelection: !!(originCoordinates?.latitude && destinationCoordinates?.latitude)
    });

    if (originCoordinates?.latitude && destinationCoordinates?.latitude) {
      // Both origin and destination set - proceed to car type selection

      // Fetch prices for car types
      fetchPrices();

      updateMapState({
        markers: [originCoordinates, destinationCoordinates]
      });
      bottomSheetModalRef.current.dismiss();
      carTypeSelectionSheetRef.current.present();
    } else {
      // No valid origin - open destination modal to set origin
      updateModal('destination', true);
      updateTripData({ inputLocationObject: 0 }); // Set to origin input
    }
  }, [isCurrLocation, originCoords, originCity, locationSelection, userLocation, fetchPrices, getAddressFromCoordinates]);

  const handleConfirmDragMarkerLocation = () => {
    logger.debug("Confirming drag marker location");

    // Check if this is for saved addresses
    if (savedAddressMapDragCallback) {
      const selectedLocation = {
        coordinates: locationSelection.pendingDragLocation.coords || { latitude: 0, longitude: 0 },
        address: mapState.markerCity,
        name: mapState.markerCity?.split(',')[0] || 'Local selecionado'
      };
      savedAddressMapDragCallback(selectedLocation);
      setSavedAddressMapDragCallback(null);
      updateMapState({ markerVisible: false });
      setLocationSelection(prev => ({
        ...prev,
        pendingDragLocation: { address: null, coords: null }
      }));
      setMarkerCoordinates(null);
      bottomSheetModalDragMarker.current.dismiss();
      updateModal('savedPlaces', true);
      return;
    }

    // Apply the pending drag location
    const inputType = locationSelection.activeInput;
    if (inputType && mapState.markerCity) {
      applyLocationSelection(inputType, {
        address: mapState.markerCity,
        coords: locationSelection.pendingDragLocation.coords,
        isCurrentLocation: false
      });
    }

    // Check if both locations are set to proceed
    const updatedOrigin = inputType === 'origin'
      ? mapState.markerCity
      : (locationSelection.origin.address || originCity);
    const updatedDestination = inputType === 'destination'
      ? mapState.markerCity
      : (locationSelection.destination.address || destinationCity);

    if (updatedOrigin && updatedDestination) {
      // Both locations set - proceed to car type selection
      const originCoordinates = inputType === 'origin'
        ? locationSelection.pendingDragLocation.coords
        : (locationSelection.origin.coords || originCoords);
      const destinationCoordinates = inputType === 'destination'
        ? locationSelection.pendingDragLocation.coords
        : (locationSelection.destination.coords || destinationCoords);

      updateMapState({
        markers: [originCoordinates, destinationCoordinates]
      });
      updateModal('destination', false);
      bottomSheetModalRef.current.dismiss();
      bottomSheetModalDragMarker.current.dismiss();
      updateMapState({ markerVisible: false });
      carTypeSelectionSheetRef.current.present();
    } else {
      // Only one location set - return to destination modal
      updateModal('destination', true);
      bottomSheetModalDragMarker.current.dismiss();
      updateMapState({ markerVisible: false });
    }
  };

  const handleTypeCarPress = useCallback((type, price) => () => {
    logger.info("Type car pressed", { type, price });
    logger.debug("Current state", {
      typeCar: tripData.carType,
      ridePrice: tripData.price,
      carTypeSelectionSheetRef: carTypeSelectionSheetRef.current ? 'exists' : 'null',
      userCarInfoSheetRef: userCarInfoSheetRef.current ? 'exists' : 'null'
    });

    updateTripData({ carType: type, price });

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
        } else {
          logger.warn("userCarInfoSheetRef is not available");
        }
      });
    }, 500);
  }, [tripData.carType, tripData.price]);

  const handleConfirmButtonPress = () => {
    Keyboard.dismiss();
    userCarInfoSheetRef.current.dismiss();
    // Add delay to ensure keyboard and sheet are fully dismissed before showing next sheet
    setTimeout(() => {
      paymentOptionsSheetRef.current.present();
    }, 300);
  };

  const handleConfirmPaymentPress = (payment_type) => {
    return async () => {
      if (!socket.connected) {
        logger.warn("Socket is not connected. Unable to emit data.");
        Alert.alert("Não há conexão com o servidor.");
        return;
      }

      logger.info("Confirm Payment");
      logger.debug("Selected car type", { typeCar: tripData.carType });

      paymentOptionsSheetRef.current.dismiss();
      setTimeout(() => {
        rideSearchSheetRef.current.present();
      }, 300);
      updateMapState({ carsAround: [] });
      startTimer();

      try {
        const requestData = {
          user: user.id,
          locations: [
            {
              name: originCity,
              coordinates: {
                latitude: mapState.markers[0].latitude,
                longitude: mapState.markers[0].longitude,
              },
            },
            {
              name: destinationCity,
              coordinates: {
                latitude: mapState.markers[1].latitude,
                longitude: mapState.markers[1].longitude,
              },
            },
          ],
          status: "requested",
          user_car_details: `${tripData.brand} ${tripData.model}, ${tripData.color}, ${tripData.license}`,
          payment: {
            value: tripData.price,
            method: payment_type,
            discount: user.discount?.active ? user.discount.percentage : null,
          },
          type_car: tripData.carType,
        };

        //maybe alter here
        const resp = await api.post("/service/", requestData);
        logger.info("Service request successful", { serviceId: resp.data?._id });
        updateTripData({ service: resp.data });

        //console.log("SERVICO",service)
        const data = {
          idService: resp.data._id,
          userLocation: [mapState.markers[0].longitude, mapState.markers[0].latitude],
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
    if (tripData.inputLocationObject === 0) {
      logger.debug("Origin coordinates", { coords });
      setOriginCoords(coords);
      setOriginCity(address);
      setIsCurrLocation();
      inputRef.current.focus();
      logger.debug("Location data updated", { inputLocationObject: tripData.inputLocationObject, coords, address });
    } else if (tripData.inputLocationObject === 1) {
      logger.debug("Destination coordinates", { coords });
      logger.debug("Location data updated", { inputLocationObject: tripData.inputLocationObject, coords, address });

      if (address === "CurrLocation") {
        coords = {
          latitude: userLocation?.latitude,
          longitude: userLocation?.longitude,
        };

        address = mapState.markerCity;
      }
      // setDestinationCoords(coords);
      fetchPrices();
      setDestinationCity(address);
      // console.log("AQUI", type);
      updateMapState({ markers: [originCoords, coords] });
      updateModal('destination', false);
      bottomSheetModalRef.current.dismiss();
      carTypeSelectionSheetRef.current.present();
    }
  };

  const handleInitiateDragMarkerSelection = useCallback(() => () => {
    logger.debug("Initiating drag marker selection", { activeInput: tripData.inputLocationObject });

    setLocationSelection(prev => ({
      ...prev,
      activeInput: tripData.inputLocationObject === 0 ? 'origin' : 'destination'
    }));

    updateModal('destination', false);
    updateMapState({ markerVisible: true });
    bottomSheetModalRef.current.dismiss();
    bottomSheetModalDragMarker.current.present();
  }, [tripData.inputLocationObject]);

  const handleReturnToSearchFromDragMarker = useCallback(() => {
    logger.debug("Returning to search from drag marker");

    // Check if this is from saved addresses modal
    if (savedAddressMapDragCallback) {
      // Return to saved addresses modal without applying location
      bottomSheetModalDragMarker.current.dismiss();
      updateMapState({ markerVisible: false });
      updateModal('savedPlaces', true);
      return;
    }

    // Apply current pending location before returning (for normal flow)
    const inputType = locationSelection.activeInput;
    if (inputType && mapState.markerCity) {
      applyLocationSelection(inputType, {
        address: mapState.markerCity,
        coords: locationSelection.pendingDragLocation.coords,
        isCurrentLocation: false
      });
    }

    bottomSheetModalDragMarker.current.dismiss();
    updateMapState({ markerVisible: false });
    updateModal('destination', true);
  }, [savedAddressMapDragCallback, locationSelection, mapState.markerCity, applyLocationSelection]);

  const handleSavedAddressMapDragRequest = (callback) => {
    // Store the callback and initiate map drag
    setSavedAddressMapDragCallback(() => callback);

    // Close saved addresses modal and destination modal
    updateModal('savedPlaces', false);
    updateModal('destination', false);

    // Start map drag process
    updateMapState({ markerVisible: true });
    carTypeSelectionSheetRef.current.dismiss();
    bottomSheetModalDragMarker.current.present();
  };

  const handleDragMarkerPositionChange = ({ latitude, longitude }) => {
    getAddressFromCoordinates(latitude, longitude);
    logger.debug("Drag marker position changed", { latitude, longitude });

    // Store as pending location (not confirmed yet)
    setLocationSelection(prev => ({
      ...prev,
      pendingDragLocation: {
        address: mapState.markerCity, // Will be updated by getAddressFromCoordinates
        coords: { latitude, longitude }
      }
    }));

    // Legacy coordinate updates for backward compatibility during transition
    setMarkerCoordinates({ latitude, longitude });
    if (tripData.inputLocationObject === 0) {
      setOriginCoords({ latitude, longitude });
    } else if (tripData.inputLocationObject === 1) {
      fetchPrices();
      setDestinationCoords({ latitude, longitude });
    }
  };

  const handleLocationTextInputFocus = (value) => {
    logger.debug("Value logged", { value });
    updateTripData({ inputLocationObject: value });
  };

  const handleBrandInputValueChange = (brand) => {
    updateTripData({ brand });
  };

  const handleModelInputValueChange = (model) => {
    updateTripData({ model });
  };

  const handleLicenseInputValueChange = (license) => {
    updateTripData({ license });
  };

  const handleColorInputValueChange = (color) => {
    updateTripData({ color });
  };

  const handlePressSelectTypeRoad = (type) => {
    updateTripData({ carType: type });
  };

  // Function to get the correct bottom sheet based on trip status
  const getCorrectBottomSheet = () => {
    if (tripData.status === 'in-progress') {
      return tripEndingSheetRef;
    } else if (tripData.status === 'assigned') {
      return tripStartedSheetRef;
    } else {
      return driverArrivingSheetRef; // fallback
    }
  };

  const handleDetailsForm = (bottomSheet) => {
    logger.debug("Details info", { detailsInfo: tripData.detailsInfo });
    // Store that we're in details view but don't store the actual ref
    updateTripData({ detailsInfo: { isViewingDetails: true } });

    // Dismiss all other sheets to prevent conflicts
    dismissAllBottomSheets();

    // Present details sheet
    bottomSheetModalRefDetails.current.present();
  };

  const endTrip = () => {
    updateModal('confirmation', true);
  };

  const onConfirmCancelSearch = (complaints) => {
    logger.info('Canceling search', { serviceId: tripData.service?._id });

    if (socket?.connected) {
      socket.emit("searchCancel", { idService: tripData.service._id, complaints });
    } else {
      logger.warn("Socket not connected for searchCancel");
    }

    // resetToInitialState already presents the initial sheet, no need to do it again
    resetToInitialState();

    // Reset unified location selection state
    logger.debug('Resetting locationSelection in onConfirmCancelSearch');
  }

  const onConfirmCancelTrip = (complaints) => {
    logger.info('Canceling trip', { serviceId: tripData.service?._id });

    if (tripData.service) {
      if (socket?.connected) {
        socket.emit("serviceCancel", { idService: tripData.service._id, complaints });
      } else {
        logger.warn("Socket not connected for serviceCancel");
      }
      // resetToInitialState already presents the initial sheet, no need to do it again
      resetToInitialState();
      // Reset unified location selection state
      logger.debug('Resetting locationSelection in onConfirmCancelTrip');
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
    logger.info("🗺️ Directions API called", {
      timestamp: new Date().toISOString(),
      serviceId: tripData.service?._id,
      duration: routeInfo?.duration,
    });

    // Store full coordinates for local slicing logic
    if (routeInfo?.coordinates) {
      updateMapState({
        directions: routeInfo,
        routeCoordinates: routeInfo.coordinates,
        currentRoute: routeInfo.coordinates
      });
    }

    updateTripData({ duration: routeInfo?.duration });
  };

  const handleDriverConnect = (driverLocation, coords) => {
    logger.debug("Map markers set", { coords });
    updateMapState({ markers: [driverLocation, coords] });
    updateTripData({ status: 'assigned' });
  };

  const handleDriverAccepted = async (data) => {
    try {
      // Dismiss all sheets before showing trip started sheet
      dismissAllBottomSheets();
      updateTripData({ status: 'assigned' }); // Update trip state
      resetTimer();

      setTimeout(() => {
        tripStartedSheetRef.current.present();
      }, 300);
    } catch (error) {
      logger.error("Error saving app state", error);
    }
  };

  // --- Modal and Alert Handlers ---

  const closeDestinationModal = () => {
    updateModal('destination', false);
    bottomSheetModalRef.current.present();
  };

  const closeSavedPlacesModal = () => {
    updateModal('savedPlaces', false);
    bottomSheetModalRef.current.present();
  };

  const closeConfirmationModal = () => {
    resetToInitialState();
  };

  const closeCancelModal = () => {
    updateModal('cancel', false);
  };
  const closePreCancelModal = () => {
    updateModal('preCancel', false);
  };

  const handlePreCancelButtonPress = () => {
    updateModal('preCancel', true);
  };

  const handleAddFavouriteButtonPress = () => {
    updateModal('savedPlaces', true);
  };

  const handleBackButtonPress = () => {
    if (isRouteVisible) {
      updateMapState({ markers: [] });

      // Clear legacy location states
      setOriginCity(null);
      setDestinationCity(null);
      setOriginCoords(null);
      setDestinationCoords(null);
      setIsCurrLocation(null);

      // Clear new unified location state
      setLocationSelection({
        origin: {
          address: null,
          coords: null,
          isCurrentLocation: false
        },
        destination: {
          address: null,
          coords: null,
          isCurrentLocation: false
        },
        activeInput: null,
        pendingDragLocation: {
          address: null,
          coords: null
        }
      });

      updateMapState({ directions: null });
      centerToUserLocation();

      // Dismiss all bottom sheets
      dismissAllBottomSheets();

      // Present the initial bottom sheet
      setTimeout(() => {
        bottomSheetModalRef.current?.present();
      }, 300);

      // Reset other relevant states
      updateTripData({ brand: '', model: '', license: '', color: '' });
      updateMapState({ markerVisible: false });
      updateTripData({ inputLocationObject: null });
      setOriginCity(null);
      setDestinationCity(null);
      setOriginCoords();
      setDestinationCoords();
      updateMapState({
        markers: [],
        directions: null,
        routeCoordinates: [],
        currentRoute: []
      });
    }
  };

  const handleRecenterMap = useCallback(() => {
    if (mapState.directions?.coordinates && mapState.directions.coordinates.length > 0) {
      // If there's a route, fit to route coordinates
      mapRef.current?.fitToCoordinates(mapState.directions.coordinates, {
        edgePadding: {
          bottom: scale(250),
          top: scale(50),
          left: scale(50),
          right: scale(50),
        },
        animated: true,
      });
    } else if (userLocation) {
      // If no route, center to user location
      mapRef.current?.animateToRegion({
        latitude: userLocation.latitude,
        longitude: userLocation.longitude,
        latitudeDelta: LATITUDE_DELTA,
        longitudeDelta: LONGITUDE_DELTA,
      }, 500);
    }
  }, [mapState.directions, userLocation]);

  const handleBackDetailsButtonPress = () => {
    if (tripData.detailsInfo) {
      updateTripData({ detailsInfo: null });
      bottomSheetModalRefDetails.current.dismiss();

      // Ensure only the correct sheet is presented and dismiss any conflicting sheets
      setTimeout(() => {
        // Dismiss any potentially conflicting sheets first
        dismissAllBottomSheets();

        // Get the correct sheet based on current trip status
        const correctBottomSheet = getCorrectBottomSheet();

        // Then present the correct sheet
        correctBottomSheet.current.present();
        logger.info('Back to correct bottom sheet', {
          status: tripData.status,
          sheet: correctBottomSheet === tripEndingSheetRef ? 'tripEnding' :
            correctBottomSheet === tripStartedSheetRef ? 'tripStarted' : 'driverArriving'
        });

      }, 50);
    }
  };

  const handleMessageDriver = () => {
    updateModal('chat', true);
    // Reset unread count when opening chat
    resetUnreadCount();
  };

  const closeChatModel = () => {
    updateModal('chat', false);
  };

  // Update message count reference when chat modal closes
  useEffect(() => {
    if (!modalState.chat && tripData.service?._id) {
      // When chat closes, we need to set the reference to current total message count
      // to avoid recounting existing messages
      const fetchCurrentMessageCount = async () => {
        try {
          const response = await api.get(`/chats/${tripData.service._id}`);
          const currentCount = response.data?.messages?.length || 0;
          lastMessageCountRef.current = currentCount;
          logger.info('Updated message count reference after chat close', { count: currentCount });
        } catch (error) {
          logger.error('Failed to fetch current message count', error);
        }
      };

      fetchCurrentMessageCount();
    }
  }, [modalState.chat, tripData.service?._id, logger]);

  const handleCancelAlert = () => {
    Alert.alert(
      "VIAGEM CANCELADA",
      "O motivo de cancelamento foi levado em consideração!",
      [
        {
          text: "OK",
          style: "cancel",
          onPress: () => {
            updateModal('preCancel', false);
            updateModal('cancel', false);
          },
        },
      ],
      {
        cancelable: false,
      }
    );
  };

  const handleCallDriver = () => {

    const phoneNumber = tripData.driver?.phone;

    if (phoneNumber) {
      let phone = phoneNumber.toString().replace(/[^\d]/g, '');

      // Remove 244 country code
      if (phone.startsWith('244')) {
        phone = phone.substring(3);
      }

      Linking.openURL(`tel:${phone}`)
        .catch((err) => {
          Alert.alert("Erro", "Erro ao tentar fazer a ligação");
        });
    } else {
      Alert.alert("Aviso", "Número de telefone do motorista não disponível");
    }
  };

  const handlePressCancel = () => {
    updateModal('cancel', true);
  };


  // --- Reset to Initial State ---

  const dismissAllBottomSheets = () => {
    bottomSheetModalRef?.current?.dismiss();
    carTypeSelectionSheetRef?.current?.dismiss();
    userCarInfoSheetRef?.current?.dismiss();
    paymentOptionsSheetRef?.current?.dismiss();
    rideSearchSheetRef?.current?.dismiss();
    tripStartedSheetRef?.current?.dismiss();
    driverArrivingSheetRef?.current?.dismiss();
    tripEndingSheetRef?.current?.dismiss();
    bottomSheetModalRefDetails?.current?.dismiss();
    bottomSheetModalDragMarker?.current?.dismiss();
  };

  const resetToInitialState = () => {
    // Dismiss all sheets first to prevent flashing
    dismissAllBottomSheets();

    // setModalVisible(false);
    updateModal('savedPlaces', false);
    updateModal('cancel', false);
    updateModal('preCancel', false);
    updateModal('chat', false);

    updateMapState({
      markers: [],
      directions: null,
      routeCoordinates: [],
      currentRoute: []
    });
    updateTripData({ carType: "Turismo", price: "25,300", service: null, status: null, driver: null, driverConnected: false, duration: null, detailsInfo: null, inputLocationObject: null });
    updateModal('confirmation', false);
    updateMapState({ markerVisible: false });
    setOriginCity(null);
    setDestinationCity(null);
    setOriginCoords();
    setDestinationCoords();
    setIsCurrLocation();

    // Reset unified location selection state
    setLocationSelection({
      origin: {
        address: null,
        coords: null,
        isCurrentLocation: false
      },
      destination: {
        address: null,
        coords: null,
        isCurrentLocation: false
      },
      activeInput: null,
      pendingDragLocation: {
        address: null,
        coords: null
      }
    });

    updateMapState({ driverLocation: null });
    updateMapState({ carsAround: [] });
    resetTimer();

    // Wait for dismiss animations to complete before presenting initial sheet
    setTimeout(() => {
      bottomSheetModalRef?.current.present();
    }, 300);
  };


  return {
    models: {
      user,
      userLocation,
      prices,
      // Trip data (consolidated)
      tripData,
      service: tripData.service,
      driver: tripData.driver,
      typeCar: tripData.carType,
      ridePrice: tripData.price,
      brand: tripData.brand,
      model: tripData.model,
      license: tripData.license,
      color: tripData.color,
      tripDuration: tripData.duration,
      inputLocationObject: tripData.inputLocationObject,
      driverConnected: tripData.driverConnected,
      detailsInfo: tripData.detailsInfo,
      tripState: tripData.status,
      mapRef,
      markerAnimated,
      // Modal states (consolidated)
      modalState,
      modalVisible: modalState.destination,
      modalCancelVisible: modalState.cancel,
      modalSavedPlacesVisible: modalState.savedPlaces,
      modalConfirmationVisible: modalState.confirmation,
      modalChatVisible: modalState.chat,
      modalPreCancelVisible: modalState.preCancel,
      // Unread messages
      unreadMessageCount,
      // Map states (consolidated)
      mapState,
      mapMarkers: mapState.markers,
      markerVisible: mapState.markerVisible,
      markerCity: mapState.markerCity,
      mapDirections: mapState.directions,
      currentRoute: mapState.currentRoute,
      carsAround: mapState.carsAround,
      driverLocation: mapState.driverLocation,
      locationSelection,
      originCity,
      destinationCity,
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
      isRouteVisible,
      timer,
      isActive,
      isCurrLocation,
      questions,
      favPlaces,
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
      handleInitiateDragMarkerSelection,
      handleReturnToSearchFromDragMarker,
      handleSavedAddressMapDragRequest,
      handleDragMarkerPositionChange,
      handleConfirmDragMarkerLocation,
      handleLocationTextInputFocus,
      handleBackButtonPress,
      handleRecenterMap,
      handleTypeCarPress,
      handleBrandInputValueChange,
      handleModelInputValueChange,
      handleLicenseInputValueChange,
      handleColorInputValueChange,
      handleConfirmButtonPress,
      handleConfirmPaymentPress,
      handleMessageDriver,
      handleCallDriver,
      setUnreadMessageCount,
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
      dismissAllBottomSheets,
      getAddressFromCoordinates
    },
  };
};
