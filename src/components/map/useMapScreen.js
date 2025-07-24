import { useEffect, useRef, useState, useCallback } from "react";
import { scale } from "react-native-size-matters";
import { useDispatch, useSelector } from 'react-redux';
import { 
  fetchPrices, 
} from "../../store/slices/userSlice";
import axios from "axios";
import Geocoder from "react-native-geocoding";
import { Alert, Keyboard } from "react-native"; 
import { setUserLocation } from "../../store/slices/locationSlice";
 
// Constants
const IP = process.env.EXPO_PUBLIC_UREBOQUE_API;
const LATITUDE_DELTA = 0.0022;
const LONGITUDE_DELTA = 0.005;
const DEFAULT_TIMER_DURATION = 180; // 3 minutes in seconds

// Import our custom hooks
import { useLocationSearch } from "../../hooks/useLocationSearch";
import { useTimer } from "../../hooks/useTimer";
import { useBottomSheetManager } from "../../hooks/useBottomSheetManager";
import { useCarDetails } from "../../hooks/useCarDetails";
import { useServiceManagement } from "../../hooks/useServiceManagement";

Geocoder.init(process.env.EXPO_PUBLIC_GOOGLE_MAPS_API_KEY);

export const useMapScreen = () => {
  const dispatch = useDispatch();
  const { user, prices } = useSelector((state) => state.user);
  const { userLocation } = useSelector((state) => state.location);

  // --- Refs ---
  const mapRef = useRef(null);
  const markerAnimated = useRef(null);

  // Modals
  const [modalDestinationVisible, setModalDestinationVisible] = useState(false);
  const [modalSavedPlacesVisible, setModalSavedPlacesVisible] = useState(false);
  const [modalCancelVisible, setModalCancelVisible] = useState(false);
  const [modalPreCancelVisible, setModalPreCancelVisible] = useState(false);
  const [modalChatVisible, setModalChatVisible] = useState(false);
  const [modalConfirmationVisible, setModalConfirmationVisible] =
    useState(null);
 
  const bottomSheetModalRefDetails = useRef(null);
  const bottomSheetModalDragMarker = useRef(null);
 
  // Map and Markers
  const [mapMarkers, setMapMarkers] = useState([]);
  const [carsAround, setCarsAround] = useState([]);
  const [isSearchingNearby, setIsSearchingNearby] = useState(false); 
  const [hasCentered, setHasCentered] = useState(false);
   
  const [detailsInfo, setDetailsInfo] = useState();
  
  // Saved Places
  const [favPlaces, setFavPlaces] = useState([]);
  const [newSavedPlaceAddress, setNewSavedPlaceAddress] = useState({
    pos: 0,
    city: "",
  });
 

  // Cancellation Reasons
  const [questions, setQuestions] = useState([
    { key: 0, question: "O motorista não vem" },
    { key: 1, question: "O motorista se recusou a conduzir" },
    { key: 2, question: "O motorista está muito longe" },
    { key: 3, question: "Quero modificar o destino " },
    { key: 4, question: "Ponto de partida incorreto" },
    { key: 5, question: "Outro" },
  ]);

  // Function declarations - moved to the top to avoid redeclaration errors
  const resetToInitialState = () => {
    setModalDestinationVisible(false);
    setModalSavedPlacesVisible(false);
    setModalCancelVisible(false);
    setModalPreCancelVisible(false);
    setModalChatVisible(false);
    setModalConfirmationVisible(false);

    bottomSheetManager.resetBottomSheets();
    locationSearch.resetLocationState();
    carDetails.resetCarDetails();
    serviceManagement.resetServiceState();
    timerHook.resetTimer();
    
    setMapMarkers([]);
    setCarsAround([]);
    setDetailsInfo(null);
  };

  const backToPaymentScreen = () => {
    timerHook.resetTimer();
    bottomSheetManager.transitionToSheet('rideSearch', 'paymentOptions');
  };

  // 1. Location Search Hook
  const locationSearch = useLocationSearch(
    mapRef, 
    setMapMarkers, 
    (locations) => {
      console.log("Locations selected:", locations);
      // Handle location selection if needed
      
      handleDestinationSelected();
    }
  );

  // 2. Timer Hook with timeout handling  
  const timerHook = useTimer(DEFAULT_TIMER_DURATION, () => {
    if (serviceManagement?.driver) return;

    const complaints = {
      title: "TimeOver",
      description: "Waiting time finish",
      idUser: user.id,
    };

    handleCancelTrip({
      description: "Waiting time finish",
    });

      Alert.alert(
        "Não há um motorista disponível",
        "Tente novamente mais tarde",
      [{ text: "OK", onPress: resetToInitialState }]
    );
  });

  // 3. Bottom Sheet Manager Hook
  const bottomSheetManager = useBottomSheetManager();

  // 4. Car Details Hook
  const carDetails = useCarDetails({
    onCarTypeChange: (carTypeData) => console.log("Car type changed:", carTypeData),
    onCarDetailsChange: (details) => console.log("Car details changed:", details),
    initialCarType: "Turismo"
  });

    // Helper function to handle existing service data
  const handleExistingService = useCallback((serviceData) => {
    console.log("Handling existing service:", serviceData);
    
    if (!serviceData || !serviceData.service) {
      console.log("No valid service data provided");
      return false;
    }
    
    const service = serviceData.service;
    const origin = service.locations[0];
    const destination = service.locations[1];
  
    // Set car type and price if available in the service data
     if (service.payment) {
      carDetails.handleTypeCarPress("", service.payment.value);
    }
    
    if ((origin || service.pickup) && (destination || service.dropoff)) {
      // Prepare data for the location handler in the format it expects
      const formattedData = {
        origin: {
          name: origin?.name || service.pickup?.address || '',
          coordinates: origin?.coordinates || {
            latitude: service.pickup?.location?.latitude || service.pickup?.latitude,
            longitude: service.pickup?.location?.longitude || service.pickup?.longitude
          }
        },
        destination: {
          name: destination?.name || service.dropoff?.address || '',
          coordinates: destination?.coordinates || {
            latitude: service.dropoff?.location?.latitude || service.dropoff?.latitude,
            longitude: service.dropoff?.location?.longitude || service.dropoff?.longitude
          }
        }
      };
      
      // Use the handleExistingServiceAtStart function from locationSearch
      return locationSearch.handleExistingServiceAtStart(formattedData);
    }
    
    console.log("Service data format not recognized");
    return false;
  }, [locationSearch, carDetails]);

  // 5. Service Management Hook
  const serviceManagement = useServiceManagement({
    onDriverFound: (data) => {
      console.log("Driver found:", data);
      
      // Use the new handleExistingService function instead of directly updating location data
      const success = handleExistingService(data);
      
      if (success) console.log("Successfully set up map with service data");
      
      if (bottomSheetManager.rideSearchSheetRef.current && 
          bottomSheetManager.tripStartedSheetRef.current) {
        bottomSheetManager.transitionToSheet('rideSearch', 'tripStarted');
      }
      timerHook.resetTimer();
    },
    onDriverArriving: () => {
      console.log("Driver arriving");
      if (bottomSheetManager.driverArrivingSheetRef.current && 
          bottomSheetManager.tripEndingSheetRef.current) {
        bottomSheetManager.transitionToSheet('tripStarted', 'driverArriving');
      }
    },
    onServiceStarted: (data) => {
      console.log("Service started", data);
      
      const success = handleExistingService(data);

      if (success) console.log("Successfully set up map with service data");
      
      if (bottomSheetManager.driverArrivingSheetRef.current && 
          bottomSheetManager.tripEndingSheetRef.current) {
        bottomSheetManager.transitionToSheet('driverArriving', 'tripEnding');
      }
    },
 
    onServiceCompleted: (data) => {
      console.log("Service completed:", data);
      if (data.payment) {
        carDetails.handleTypeCarPress("", data.payment.value);
      }
      bottomSheetManager.dismissActiveBottomSheet();
      setModalConfirmationVisible(true);
    },
    onServiceCancelled: () => {
      resetToInitialState();
    },
    onNoDriverAvailable: () => {
      timerHook.resetTimer();
      Alert.alert(
        "Não há um motorista disponível",
        "Tente novamente mais tarde",
        [{ text: "OK", onPress: backToPaymentScreen }]
      );
    },
    resetAppState: resetToInitialState
  });

  // --- Updated Core Functions ---

  // Center to user location
  const centerToUserLocation = useCallback(() => {
    if (userLocation && !serviceManagement.driver && !hasCentered) {
      mapRef.current?.animateToRegion({
        latitude: userLocation.latitude,
        longitude: userLocation.longitude,
        latitudeDelta: LATITUDE_DELTA,
        longitudeDelta: LONGITUDE_DELTA,
      });
      setHasCentered(true);
    }
  }, [userLocation?.latitude, userLocation?.longitude, hasCentered, serviceManagement.driver]);

  // Handle user location change
  const handleUserLocationChange = ({ nativeEvent: { coordinate } }) => {
    if (coordinate && !modalDestinationVisible && mapMarkers.length < 2) {
      dispatch(setUserLocation(coordinate));
    }
  };

  // Get nearby drivers
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

      const nearbyDrivers = resp.data.map((driverData) => ({
        latitude: driverData.location.latitude,
        longitude: driverData.location.longitude,
        color: driverData.driver.car.color,
      }));

      setCarsAround(nearbyDrivers);
      setIsSearchingNearby(true);

      if (!serviceManagement.service) {
        // Continue searching if a service doesn't exist
        setTimeout(getNearbyDrivers, 20000);
      }
    } catch (error) {
      console.error(error);
      if (!serviceManagement.service) {
        // Retry after a delay if a service doesn't exist
        setTimeout(getNearbyDrivers, 20000);
      }
    }
  };

  // Handle map search bar press
  const handleMapSearchBarPress = async () => {
    const success = await locationSearch.handleMapSearchBarPress();
    if (success) {
      setModalDestinationVisible(true);
    }
  };

  // Handle favorite button press
 const handleOnFavouriteButtonPress = (item) => {
    return () => {
      locationSearch.setOriginCity(item.place.description);
      locationSearch.setOriginCoords({
        latitude: item.place.coordinates.latitude,
        longitude: item.place.coordinates.longitude,
      });
      setModalDestinationVisible(true);
      locationSearch.setInputLocationObject(0);
      locationSearch.setIsCurrLocation(null);
    };
  };

  // Handle type car press
  const handleTypeCarPress = (type, price) => {
    return () => {
      carDetails.handleTypeCarPress(type, price);
      bottomSheetManager.transitionToSheet('carTypeSelection', 'userCarInfo');
    };
  };

  // Handle confirm button press
  const handleConfirmButtonPress = () => {
    Keyboard.dismiss();
    bottomSheetManager.transitionToSheet('userCarInfo', 'paymentOptions');
  };

  // Handle confirm payment press
  const handleConfirmPaymentPress = (payment_type) => {
    return async () => {
      bottomSheetManager.transitionToSheet('paymentOptions', 'rideSearch');
      setCarsAround([]);
      
      // Don't start the timer yet - wait for successful service request
      console.log("handleConfirmPaymentPress");

      try {
        const requestData = {
          user: user.id,
          locations: [
            {
              name: locationSearch.originCity,
              coordinates: {
                latitude: mapMarkers[0].latitude,
                longitude: mapMarkers[0].longitude,
              },
            },
            {
              name: locationSearch.destinationCity,
              coordinates: {
                latitude: mapMarkers[1].latitude,
                longitude: mapMarkers[1].longitude,
              },
            },
          ],
          status: "requested",
          user_car_details: carDetails.getFormattedCarDetails(),
          payment: {
            value: carDetails.ridePrice,
            method: payment_type,
            discount: user.discount?.active ? user.discount.percentage : null,
          },
          type_car: carDetails.typeCar,
        };

        console.log("requestData", requestData);
        console.log("serviceManagement", serviceManagement);
        const serviceData = await serviceManagement.requestService(requestData);
        console.log("serviceManagement", serviceData);
        
        // Start the timer only after successful service request
        timerHook.startTimer();
      } catch (error) {
        // Reset the timer if the service request fails
        timerHook.resetTimer();
        
        Alert.alert(
          "Erro", 
          error.response?.data?.message || "Não foi possível criar o serviço", 
          [{ 
          text: "OK", 
          onPress: () => {
              bottomSheetManager.transitionToSheet('rideSearch', 'paymentOptions');
            }
          }]
        );
      }
    };
  };

  // Handle cancel search
  const handleCancelSearch = () => {
    const complaints = {
      title: "Search Cancellation",
      description: "User cancelled the search",
      idUser: user.id,
    };
    
    serviceManagement.cancelServiceSearch(complaints);
    timerHook.resetTimer();
    bottomSheetManager.transitionToSheet('rideSearch', 'main');
  };

  // Handle trip cancellation
  const handleCancelTrip = (reason) => {
    const complaints = {
      title: "Cancelled by user",
      description: reason?.description || "User cancelled the service",
      idUser: user.id,
    };
    
    serviceManagement.cancelService(complaints);
    timerHook.resetTimer();
    bottomSheetManager.resetBottomSheets();
  };

  // Handle press question
  const handlePressQuestion = (question) => {
    handleCancelTrip({description: question});
    handleCancelAlert();
  };

  // Handle back button press
  const handleBackButtonPress = () => {
    if (mapMarkers.length === 2) {
      resetToInitialState();
    }
  };

  // Modal handlers
  const closeDestinationModal = () => {
    setModalDestinationVisible(false);
    
    // When manually closing the modal, always go back to the main sheet
    // The handleDestinationSelected function will handle showing car type selection sheet
    bottomSheetManager.presentBottomSheet('main');
  };

  const closeSavedPlacesModal = () => {
    // Just for debugging
    console.log("closeSavedPlacesModal called with newSavedPlaceAddress:", newSavedPlaceAddress);
    
    // Only reset if not coming back from map drag
    if (!newSavedPlaceAddress?.fromMapDrag) {
      console.log("Closing SavedPlacesModal normally");
      setModalSavedPlacesVisible(false);
      bottomSheetManager.presentBottomSheet('main');
    } else {
      console.log("Keeping SavedPlacesModal open because we're coming back from map drag");
      // If we set it to false and true quickly, it will cause a flicker, so keep it visible
    }
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

  const closeChatModel = () => {
    setModalChatVisible(false);
  };

  const handlePreCancelButtonPress = () => {
    setModalPreCancelVisible(true);
  };

  const handleAddFavouriteButtonPress = () => {
    setModalSavedPlacesVisible(true);
  };

  const handlePressCancel = () => {
    setModalCancelVisible(true);
  };

  // Cancel alert
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

  // Handle driver details form
  const handleDetailsForm = (bottomSheetRef) => {
    bottomSheetRef.current?.close();
    bottomSheetModalRefDetails.current?.present();
  };

  // Handle messaging the driver
  const handleMessageDriver = () => {
    setModalChatVisible(true);
  };

  // Handle destination selection and transition to car type selection
  const handleDestinationSelected = () => {
    // Close the destination modal
    setModalDestinationVisible(false);
    
    // If prices data is not loaded yet, load it now
    if (!prices) {
      console.log("Fetching prices data before showing car type selection");
      dispatch(fetchPrices());
    } else {
      console.log("Using existing prices data:", prices);
    }
    
    // Present the car type selection sheet
    bottomSheetManager.presentBottomSheet('carTypeSelection');
  };

  // Reset the saved place address data
  const resetNewSavedPlaceAddress = () => {
    setNewSavedPlaceAddress({
      pos: 0,
      city: "",
      callback: false,
      fromMapDrag: false
    });
  };

  // Force close saved places modal regardless of fromMapDrag status
  const forceCloseSavedPlacesModal = () => {
    console.log("Forcing close of SavedPlacesModal");
    
    // Reset the newSavedPlaceAddress state to clear the fromMapDrag flag
    resetNewSavedPlaceAddress();
    
    // Close the saved places modal
    setModalSavedPlacesVisible(false);
  };

  // --- Effects ---

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
    if (serviceManagement.mapDirections?.coordinates) {
      mapRef.current?.fitToCoordinates(serviceManagement.mapDirections?.coordinates, {
        edgePadding: {
          bottom: scale(250),
          top: scale(50),
          left: scale(20),
          right: scale(20),
        },
      });
    }
  }, [serviceManagement.mapDirections?.coordinates]);

  // Effect - Show initial bottom sheet and fetch nearby drivers
  useEffect(() => {
    bottomSheetManager.mainBottomSheetRef.current?.present();
  }, []);
  
  // Effect - Fetch nearby drivers
  useEffect(() => {
    if (!serviceManagement.service && userLocation && !isSearchingNearby) {
      getNearbyDrivers();
    }

    return () => {
      setIsSearchingNearby(true);
    };
  }, [userLocation, isSearchingNearby, serviceManagement.service]);

  return {
    models: {
      // Map-related states
      userLocation,
      mapRef,
      markerAnimated,
      mapMarkers,
      carsAround,
      
      // Ride state
      hasCentered,
      
      // Modal states
      modalDestinationVisible,
      modalSavedPlacesVisible,
      modalCancelVisible,
      modalPreCancelVisible,
      modalChatVisible,
      modalConfirmationVisible,
      
      // Favorite places
      favPlaces,
      
      // Details
      detailsInfo,
      
      // Other state from hooks
      driver: serviceManagement.driver,
      service: serviceManagement.service,
      driverLocation: serviceManagement.driverLocation,
      mapDirections: serviceManagement.mapDirections,
      tripState: serviceManagement.tripState,
      isRouteVisible: mapMarkers.length === 2,
      tripDuration: serviceManagement.tripDuration,
      originCity: locationSearch.originCity,
      destinationCity: locationSearch.destinationCity,
      user,
      prices,
      timer: timerHook.timer,
      isActive: timerHook.isActive,
      driverConnected: serviceManagement.driverConnected,
      
      // Bottom sheet state
      activeBottomSheet: bottomSheetManager.activeBottomSheet,
      
      // From Location Search Hook - state only
      markerVisible: locationSearch.markerVisible,
      markerCity: locationSearch.markerCity,
      inputLocationObject: locationSearch.inputLocationObject,
      isCurrLocation: locationSearch.isCurrLocation,
      
      // References from bottom sheet manager
      mainBottomSheetRef: bottomSheetManager.mainBottomSheetRef,
      carTypeSelectionSheetRef: bottomSheetManager.carTypeSelectionSheetRef,
      userCarInfoSheetRef: bottomSheetManager.userCarInfoSheetRef,
      paymentOptionsSheetRef: bottomSheetManager.paymentOptionsSheetRef,
      rideSearchSheetRef: bottomSheetManager.rideSearchSheetRef,
      tripStartedSheetRef: bottomSheetManager.tripStartedSheetRef,
      driverArrivingSheetRef: bottomSheetManager.driverArrivingSheetRef, 
      tripEndingSheetRef: bottomSheetManager.tripEndingSheetRef,
      bottomSheetModalRefDetails: bottomSheetModalRefDetails,
      bottomSheetModalDragMarker: bottomSheetModalDragMarker,
      
      // Car Details Hook - state only
      typeCar: carDetails.typeCar,
      ridePrice: carDetails.ridePrice,
      brand: carDetails.brand,
      model: carDetails.model,
      license: carDetails.license,
      color: carDetails.color,
      
      // Custom state for saved places
      newSavedPlaceAddress: newSavedPlaceAddress,
    },
    operations: {
      // Map event handlers
      handleUserLocationChange,
      centerToUserLocation,
      
      // UI event handlers
      handleMapSearchBarPress,
      handleOnFavouriteButtonPress,
      handleTypeCarPress,
      handleConfirmButtonPress,
      handleConfirmPaymentPress,
      handleCancelSearch,
      handleCancelTrip,
      handlePressQuestion,
      handleBackButtonPress,
      handlePreCancelButtonPress,
      handleAddFavouriteButtonPress,
      handlePressCancel,
      handleDestinationSelected,
      
      // Modal handlers
      closeDestinationModal,
      closeSavedPlacesModal,
      closeConfirmationModal,
      closeCancelModal,
      closePreCancelModal,
      closeChatModel,
      
      // App state management
      resetToInitialState,
      backToPaymentScreen,
      
      // Alert handlers
      handleCancelAlert,
      
      // From location search - functions only
      handleMarkerDragEnd: locationSearch.handleMarkerDragEnd,
      handleMarkerDragPress: () => {
        // Set marker drag origin to 'destination' to track where the drag action came from
        locationSearch.setMarkerDragOrigin('destination');
        locationSearch.handleMarkerDragPress();
        setModalDestinationVisible(false);
        bottomSheetModalDragMarker.current?.present();
      }, 
      handlePressItemPress: locationSearch.handlePressItemPress,
      handleLocationTextInputFocus: locationSearch.handleLocationTextInputFocus,
      handleMarkerDragSavedPlaces: (savedPlacePos = 1) => {
        console.log("handleMarkerDragSavedPlaces", savedPlacePos);
        // Set marker drag origin to 'savedPlaces' to track where the drag action came from
        locationSearch.setMarkerDragOrigin('savedPlaces');
        locationSearch.handleMarkerDragSavedPlaces(savedPlacePos);
        setModalSavedPlacesVisible(false);
        bottomSheetModalDragMarker.current?.present();
      },
      handleConfirmDraggablePress: (savedPlaceInfo = null) => {
        const success = locationSearch.handleConfirmDraggablePress(savedPlaceInfo);
        
        // Add debugging information
        console.log("handleConfirmDraggablePress called with origin:", locationSearch.markerDragOrigin);
        console.log("Marker coordinates:", locationSearch.markerCoords);
        
        // Check if this was called from the saved places flow or regular destination flow
        if (locationSearch.markerDragOrigin === 'savedPlaces') {
          console.log("Handling savedPlaces flow");
          
          // Safety check: ensure markerCoords is available
          if (!locationSearch.markerCoords) {
            console.error("Error: No marker coordinates available");
            // Show error to user
            Alert.alert("Error", "Could not determine location coordinates. Please try again.");
            return;
          }
          
          // Get the address information from the marker location
          const markerAddress = {
            coordinates: {
              latitude: locationSearch.markerCoords.latitude,
              longitude: locationSearch.markerCoords.longitude,
            },
            city: locationSearch.markerCity || 'Selected Location',
            callback: true, // Set to true to make AddressModal visible again
            pos: 0,
            fromMapDrag: true // Add flag to indicate this came from map drag
          };
          
          // Update the saved place address data
          setNewSavedPlaceAddress(markerAddress);
          console.log("Setting newSavedPlaceAddress:", markerAddress);
          
          // Reopen the SavedPlacesModal which will show the AddressModal with the new address
          setModalSavedPlacesVisible(true);
        } else {
          console.log("Handling destination flow");
          // Regular destination flow - show destination modal
          setModalDestinationVisible(true);
          if (success) handleDestinationSelected();
        }
        
        // Reset the marker drag origin after handling it
        locationSearch.setMarkerDragOrigin(null);
        
        bottomSheetModalDragMarker.current?.dismiss();
      },
      
      // From service management - functions only
      handleMapDirectionsReady: serviceManagement.handleMapDirectionsReady,
      formatDuration: serviceManagement.formatDuration,
      
      // From car details - input handlers
      handleBrandInputValueChange: carDetails.handleBrandInputValueChange,
      handleModelInputValueChange: carDetails.handleModelInputValueChange,
      handleColorInputValueChange: carDetails.handleColorInputValueChange,
      handleLicenseInputValueChange: carDetails.handleLicenseInputValueChange,
      
      // From timer hook
      formatTime: timerHook.formatTime,
      
      // Driver interaction
      handleDetailsForm,
      handleMessageDriver,
      resetNewSavedPlaceAddress,
      forceCloseSavedPlacesModal
    }
  };
};
