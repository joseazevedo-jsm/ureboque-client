import { useState, useEffect, useCallback, useRef } from "react";
import { useDispatch, useSelector } from "react-redux";
import { Alert } from "react-native";
import axios from "axios";
import {
  setServiceStatus,
  connectSocket,
  emitSocketEvent,
  listenSocketEvent,
  unlistenAllSocketEvents
} from "../store/slices/userSlice";
import store from "../store/index";

const IP = process.env.EXPO_PUBLIC_UREBOQUE_API;

/**
 * Hook to manage towing service lifecycle
 * @param {Function} onDriverFound - Callback when driver is found
 * @param {Function} onServiceStarted - Callback when service starts
 * @param {Function} onServiceCompleted - Callback when service completes
 * @param {Function} onServiceCancelled - Callback when service is cancelled
 * @param {Function} onNoDriverAvailable - Callback when no driver is available
 * @returns {Object} Service management state and functions
 */
export const useServiceManagement = ({
  onDriverFound = () => {},
  onServiceStarted = () => {},
  onDriverArriving = () => {},
  onServiceCompleted = () => {},
  onServiceCancelled = () => {},
  onNoDriverAvailable = () => {},
  resetAppState = () => {}
}) => {
  const dispatch = useDispatch();
  const { user, serviceStatus, socketConnected } = useSelector((state) => state.user);
  const { userLocation } = useSelector((state) => state.location);
  
  // Service state
  const [service, setService] = useState(null);
  const [driver, setDriver] = useState(null);
  const [driverLocation, setDriverLocation] = useState(null);
  const [driverConnected, setDriverConnected] = useState(false);
  const [tripState, setTripState] = useState(null);
  const [mapDirections, setMapDirections] = useState(null);
  const [tripDuration, setTripDuration] = useState(null);
  
  // Ref to prevent duplicate service status handling
  const serviceProcessedRef = useRef({ id: null, status: null });
  
  /**
   * Calculate distance between two coordinates in km
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
   * Format duration in minutes to a readable string
   */
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
   * Request towing service with given parameters
   */
  const requestService = async (requestData) => {
    // Try to ensure socket is connected
    const isConnected = await ensureSocketConnected();
    if (!isConnected) {
      throw new Error("Failed to connect to the server - socket not connected");
    }
    
    try {
      console.log("Creating service with requestData:", JSON.stringify(requestData, null, 2));
      const resp = await axios.post(`${IP}/service/`, requestData);
      console.log("Service created:", resp.data);
      setService(resp.data);
      
      // Emit socket event to find driver
      dispatch(emitSocketEvent("chooseBestDriver", {
        idService: resp.data._id,
        userLocation: [requestData.locations[0].coordinates.longitude, requestData.locations[0].coordinates.latitude],
        user: user._id,
      }));
      
      return resp.data;
    } catch (error) {
      console.error("Error creating service:", error);
      throw error;
    }
  };
  
  /**
   * Ensure socket is connected with retry logic
   */
  const ensureSocketConnected = async () => {
    // Check directly from store to avoid stale state
    const isConnected = () => store.getState().user.socketConnected;
    
    if (!isConnected()) {
      console.log("Ensuring socket is connected...");
      dispatch(connectSocket());
      
      // Wait for connection with timeout
      let attempts = 0;
      const maxAttempts = 3;
      while (attempts < maxAttempts && !isConnected()) {
        console.log(`Waiting for socket connection (attempt ${attempts + 1}/${maxAttempts})...`);
        await new Promise(resolve => setTimeout(resolve, 1000));
        attempts++;
      }
    }
    
    return isConnected();
  };
  
  /**
   * Cancel service search
   */
  const cancelServiceSearch = useCallback((reason) => {
    if (!service) return false;
    
    const complaints = {
      title: reason?.title || "Search Cancellation",
      description: reason?.description || "User cancelled the search",
      idUser: user.id,
    };
    
    if (socketConnected) {
      dispatch(emitSocketEvent("searchCancel", { 
        idService: service._id, 
        complaints 
      }));
      setService(null);
      setTripState(null);
      return true;
    } else {
      console.warn("Cannot cancel search: socket not connected");
      return false;
    }
  }, [service, socketConnected, user?.id, dispatch]);
  
  /**
   * Cancel an active service/trip
   */
  const cancelService = useCallback((reason) => {
    if (!service) return false;
    
    const complaints = {
      title: reason?.title || "Cancelled by user",
      description: reason?.description || "User cancelled the service",
      idUser: user.id,
    };
    
    if (socketConnected) {
      dispatch(emitSocketEvent("serviceCancel", { 
        idService: service._id, 
        complaints 
      }));
      
      setService(null);
      setDriver(null);
      setDriverLocation(null);
      setTripState(null);
      return true;
    } else {
      console.warn("Cannot cancel service: socket not connected");
      return false;
    }
  }, [service, socketConnected, user?.id, dispatch]);
  
  /**
   * Handle when map directions are ready
   */
  const handleMapDirectionsReady = (routeInfo) => {
    console.log("Map directions ready:", routeInfo);
    setMapDirections(routeInfo);
    
    // Convert duration from minutes to a number and ensure it's at least 1 minute
    const durationInMinutes = Math.max(1, Math.ceil(routeInfo?.duration || 0));
    console.log("Setting trip duration to:", durationInMinutes, "minutes");
    setTripDuration(durationInMinutes);
    
    return routeInfo;
  };
  
  /**
   * Reset service state
   */
  const resetServiceState = useCallback(() => {
    setService(null);
    setDriver(null);
    setDriverLocation(null);
    setDriverConnected(false);
    setTripState(null);
    setMapDirections(null);
    setTripDuration(null);
  }, []);

  // --- Socket Event Handlers ---
  
  const handleBestDriverEvent = useCallback((data) => {
    try {
      console.log("bestDriver event:", data);
      // Logic for handling best driver event
    } catch (error) {
      console.error("Error handling bestDriver event:", error);
    }
  }, []);

  const handleNoDriverEvent = useCallback((data) => {
    try {
      onNoDriverAvailable();
      Alert.alert(
        "Não há um motorista disponível",
        "Tente novamente mais tarde",
        [{ text: "OK", onPress: resetAppState }]
      );
    } catch (error) {
      console.error("Error handling noDriver event:", error);
    }
  }, [onNoDriverAvailable, resetAppState]);

  const handleDriverConnectedEvent = useCallback((data) => {
    try {
      console.log("driverConnected event:", data);
      if (data && data.location && data.service && data.service.pickup) {
        setDriverConnected(true);
        setDriver(data.driver);
        setDriverLocation(data.location);
      }
    } catch (error) {
      console.error("Error handling driverConnected event:", error);
    }
  }, [onDriverFound]);

  const handleServiceAcceptedEvent = useCallback((data) => {
    try {
      console.log("serviceAccepted event:", data);
      setTripState('assigned');
      onDriverFound(data);
    } catch (error) {
      console.error("Error handling serviceAccepted event:", error);
    }
  }, [onDriverFound]);

  const handleDriverDeclinedEvent = useCallback((data) => {
    try {
      console.log("driverDeclined event:", data);
      const { idUser, idService, userLocation } = data;
      const { longitude, latitude } = userLocation;
      
      dispatch(emitSocketEvent("chooseBestDriver", {
        idUser,
        idService,
        userLocation: [longitude, latitude],
      }));
    } catch (error) {
      console.error("Error handling driverDeclined event:", error);
    }
  }, [dispatch]);

  const handleDriverLocationEvent = useCallback((data) => {
    try {
      console.log("driverLocation event:", data);
      if (data && data.service && data.location) {
        const { service, location } = data;
        setDriverLocation(location);
        
        switch (service.status) {
          case 1: {
            // Driver moving to pickup location
            const distance = getDistanceInKm(service.pickupLocation, location);
            setTripState('assigned');
            if (distance < 0.3) {
              onDriverArriving();
            }
            break;
          }
          case 2: {
            // Service in progress
            setTripState('in-progress');
            onServiceStarted();
            break;
          }
          default:
            break;
        }
      }
    } catch (error) {
      console.error("Error handling driverLocation event:", error);
    }
  }, [getDistanceInKm, onServiceStarted]);

  const handleServiceStartedEvent = useCallback((data) => {
    try {
      if (data && data.status === "in-progress") {
        setTripState('in-progress');
        onServiceStarted();
      }
    } catch (error) {
      console.error("Error handling serviceStarted event:", error);
    }
  }, [onServiceStarted]);

  const handleServiceEndedEvent = useCallback((data) => {
    try {
      if (data && data.status === "completed") {
        setTripState('completed');
        onServiceCompleted(data);
      }
    } catch (error) {
      console.error("Error handling serviceEnded event:", error);
    }
  }, [onServiceCompleted]);

  const handleServiceCancelledEvent = useCallback((data) => {
    try {
      console.log("serviceCancelled event:", data);
      Alert.alert("Serviço cancelado", "O motorista cancelou o serviço", [
        {
          text: "OK",
          onPress: () => {
            resetServiceState();
            onServiceCancelled();
          },
        },
      ]);
    } catch (error) {
      console.error("Error handling serviceCancelled event:", error);
    }
  }, [resetServiceState, onServiceCancelled]);

  // Effect - Setup socket event listeners
  useEffect(() => {
    if (!socketConnected) return;

    console.log("Setting up socket event listeners for service management");
    
    // Register all event listeners
    dispatch(listenSocketEvent("bestDriver", handleBestDriverEvent));
    dispatch(listenSocketEvent("noDriver", handleNoDriverEvent));
    dispatch(listenSocketEvent("driverConnected", handleDriverConnectedEvent));
    dispatch(listenSocketEvent("serviceAccepted", handleServiceAcceptedEvent));
    dispatch(listenSocketEvent("serviceDeclined", handleDriverDeclinedEvent));
    dispatch(listenSocketEvent("driverLocation", handleDriverLocationEvent));
    dispatch(listenSocketEvent("serviceStarted", handleServiceStartedEvent));
    dispatch(listenSocketEvent("serviceEnded", handleServiceEndedEvent));
    dispatch(listenSocketEvent("serviceCancelled", handleServiceCancelledEvent));
    
    // Cleanup function - remove only service management listeners
    return () => {
      console.log("Cleaning up service management event listeners");
      
      // Remove each listener individually instead of using unlisten_all
      dispatch({ type: 'socket/unlisten', payload: { event: 'bestDriver' } });
      dispatch({ type: 'socket/unlisten', payload: { event: 'noDriver' } });
      dispatch({ type: 'socket/unlisten', payload: { event: 'driverConnected' } });
      dispatch({ type: 'socket/unlisten', payload: { event: 'serviceAccepted' } });
      dispatch({ type: 'socket/unlisten', payload: { event: 'serviceDeclined' } });
      dispatch({ type: 'socket/unlisten', payload: { event: 'driverLocation' } });
      dispatch({ type: 'socket/unlisten', payload: { event: 'serviceStarted' } });
      dispatch({ type: 'socket/unlisten', payload: { event: 'serviceEnded' } });
      dispatch({ type: 'socket/unlisten', payload: { event: 'serviceCancelled' } });
    };
  }, [
    socketConnected, 
    dispatch, 
    handleBestDriverEvent,
    handleNoDriverEvent,
    handleDriverConnectedEvent,
    handleServiceAcceptedEvent,
    handleDriverDeclinedEvent,
    handleDriverLocationEvent,
    handleServiceStartedEvent,
    handleServiceEndedEvent,
    handleServiceCancelledEvent
  ]);

  // Effect - Manage service status updates
  useEffect(() => {
    if (
      !serviceStatus ||
      serviceStatus?.service?.status === "nodriver" ||
      serviceStatus?.service?.status === "cancelled"
    ) return;
      
    const { service, car } = serviceStatus;
    const status = service.status;
    const serviceId = service._id;
    
    // Prevent repeated handling of the same service status
    if (serviceProcessedRef.current.id === serviceId && 
        serviceProcessedRef.current.status === status) {
      return;
    }
    
    console.log("SERVICE STATUS DETECTED:", status);
    const room = `service-request-${serviceId}`;
    
    // Update the ref with current service info
    serviceProcessedRef.current = { id: serviceId, status: status };
    
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
    
    // Make sure socket is connected and join the service room
    const handleServiceStatus = async () => {
      const isConnected = await ensureSocketConnected();
      
      if (!isConnected) {
        console.error("Failed to connect socket for service status update");
        Alert.alert(
          "Erro de conexão",
          "Não foi possível estabelecer conexão com o servidor. O status do serviço pode estar desatualizado.",
          [{ text: "OK" }]
        );
        return;
      }
      
      console.log(`Joining room: ${room} for service status: ${status}`);
      dispatch(emitSocketEvent('join', room));
      
      switch (status) {
        case "in-progress":
          console.log("SERVICE IN PROGRESS:", service);
          setService(service);
          setTripState('in-progress');
          onServiceStarted({
            service: service
          });
          break;
  
        case "assigned":
          console.log("SERVICE ASSIGNED:", service);
          setService(service);
          setTripState('assigned');
          onDriverFound({
            driver: service.driver,
            service: service
          });
          break;
  
        case "completed":
          console.log("SERVICE COMPLETED:", service);
          setService(service);
          onServiceCompleted(service);
          break;
  
        default:
          console.log(`Unhandled service status: ${status}`);
          break;
      }
    };
    
    handleServiceStatus();
  }, [serviceStatus, dispatch, onDriverFound, onServiceStarted, onServiceCompleted]);

  return {
    // State
    service,
    driver,
    driverLocation,
    driverConnected,
    tripState,
    mapDirections,
    tripDuration,
    socketConnected,
    
    // Functions
    requestService,
    cancelServiceSearch,
    cancelService,
    handleMapDirectionsReady,
    resetServiceState,
    formatDuration,
    getDistanceInKm,
    
    // Helpers
    isServiceActive: !!service,
    isDriverAssigned: !!driver,
    isServiceInProgress: tripState === 'in-progress',
    isServiceCompleted: tripState === 'completed'
  };
}; 