import { useEffect, useRef, useState, useCallback } from 'react';
import { BackHandler, Keyboard, Linking } from 'react-native';
import { scale } from 'react-native-size-matters';
import { useUserLocationStateContext } from '../../context/UserLocationStateContext';
import { useSocket } from '../../context/SocketContext';
import { useUserData } from '../../context/UserDataContext';
import { useLogger } from '../../hooks/useLogger';
import { useNotification } from '../../context/NotificationContext';
import { useTripState } from '../../context/TripStateContext';
import { useAlert } from '../../context/AlertContext';
import { useMapGeocoding } from '../../hooks/useMapGeocoding';
import { useMapRouting } from '../../hooks/useMapRouting';
import { useMapDrivers } from '../../hooks/useMapDrivers';
import { useMapTrip } from '../../hooks/useMapTrip';
import api from '../../services/APIService';
import { MAP_LATITUDE_DELTA, MAP_LONGITUDE_DELTA, DRIVER_POLL_INTERVAL_MS } from '../../constants/config';

export const useMapScreen = () => {
  const logger = useLogger('useMapScreen');

  // ── Context ─────────────────────────────────────────────────────────────
  const { socket } = useSocket();
  const { user, setUser, serviceStatus, setServiceStatus, prices, fetchPrices, unreadNotificationsCount, saveUserVehicle, removeDiscount } = useUserData();
  const { userLocation, setUserLocation } = useUserLocationStateContext();
  const { setTripActive, setTripStatus } = useTripState();
  const { showAlert } = useAlert();
  const { unreadMessageCount, resetUnreadCount, handleIncomingMessages, setUnreadMessageCount } = useNotification();

  // ── Refs ─────────────────────────────────────────────────────────────────
  const mapRef = useRef(null);
  const transitionTimeoutRef = useRef(null);
  const lastMessageCountRef = useRef(0);
  const lastRecoveredServiceKeyRef = useRef(null);

  // ── Bottom Sheet Refs ────────────────────────────────────────────────────
  const bottomSheetModalRef = useRef(null);
  const carTypeSelectionSheetRef = useRef(null);
  const userCarInfoSheetRef = useRef(null);
  const paymentOptionsSheetRef = useRef(null);
  const rideSearchSheetRef = useRef(null);
  const tripStartedSheetRef = useRef(null);
  const driverArrivingSheetRef = useRef(null);
  const tripEndingSheetRef = useRef(null);
  const bottomSheetModalRefDetails = useRef(null);
  const bottomSheetModalDragMarker = useRef(null);

  // ── UI State ─────────────────────────────────────────────────────────────
  const [activeBottomSheet, setActiveBottomSheet] = useState(null);
  const [modalState, setModalState] = useState({
    destination: false,
    savedPlaces: false,
    cancel: false,
    preCancel: false,
    chat: false,
    confirmation: null,
  });

  const updateModal = useCallback((modalName, value) => {
    setModalState((prev) => ({ ...prev, [modalName]: value }));
  }, []);

  // ── Map UI State ─────────────────────────────────────────────────────────
  const [markers, setMarkers] = useState([]);
  const [markerVisible, setMarkerVisible] = useState(false);
  const [markerCoordinates, setMarkerCoordinates] = useState(null);
  const [hasCentered, setHasCentered] = useState(false);
  const [savedAddressMapDragCallback, setSavedAddressMapDragCallback] = useState(null);

  // ── Legacy Location State (backward compat) ──────────────────────────────
  const [originCity, setOriginCity] = useState(null);
  const [destinationCity, setDestinationCity] = useState(null);
  const [originCoords, setOriginCoords] = useState(null);
  const [destinationCoords, setDestinationCoords] = useState(null);
  const [isCurrLocation, setIsCurrLocation] = useState(null);

  // ── Unified Location Selection State ─────────────────────────────────────
  const [locationSelection, setLocationSelection] = useState({
    origin: { address: null, coords: null, isCurrentLocation: false },
    destination: { address: null, coords: null, isCurrentLocation: false },
    activeInput: null,
    pendingDragLocation: { address: null, coords: null },
  });

  const applyLocationSelection = useCallback((inputType, locationData) => {
    setLocationSelection((prev) => ({
      ...prev,
      [inputType]: {
        address: locationData.address,
        coords: locationData.coords,
        isCurrentLocation: locationData.isCurrentLocation || false,
      },
      pendingDragLocation: { address: null, coords: null },
    }));
    if (inputType === 'origin') {
      setOriginCity(locationData.address);
      setOriginCoords(locationData.coords);
      if (!locationData.isCurrentLocation) setIsCurrLocation(undefined);
    } else if (inputType === 'destination') {
      setDestinationCity(locationData.address);
      setDestinationCoords(locationData.coords);
    }
  }, []);

  // ── Cancellation Reasons ─────────────────────────────────────────────────
  const [questions] = useState([
    { key: 0, question: 'O motorista não vem' },
    { key: 1, question: 'O motorista se recusou a conduzir' },
    { key: 2, question: 'O motorista está muito longe' },
    { key: 3, question: 'Quero modificar o destino ' },
    { key: 4, question: 'Ponto de partida incorreto' },
    { key: 5, question: 'Outro' },
  ]);

  // ── Favourite Places ──────────────────────────────────────────────────────
  const [favPlaces, setFavPlaces] = useState([]);

  useEffect(() => {
    const userSavedPlaces = user?.saved_places || [];
    const converted = userSavedPlaces.map((sp) => ({
      _id: sp._id,
      place: { name: sp.place.name, description: sp.place.description, coordinates: sp.place.coordinates },
    }));
    const home = converted.filter(sp => sp.place.name === 'Casa');
    const work = converted.filter(sp => sp.place.name === 'Trabalho');
    const others = converted.filter(sp => sp.place.name !== 'Casa' && sp.place.name !== 'Trabalho');
    setFavPlaces([
      ...home,
      ...work,
      ...others,
      {
        _id: 'add-favorite',
        place: {
          name: 'Adicionar Favorito',
          description: 'Toque para adicionar um novo local favorito',
          coordinates: { latitude: 0, longitude: 0 },
        },
      },
    ]);
  }, [user?.saved_places]);

  // ── Sheet Management ──────────────────────────────────────────────────────
  const dismissAllBottomSheets = useCallback(() => {
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
    setActiveBottomSheet(null);
  }, []);

  const presentBottomSheet = useCallback((sheetName) => {
    const sheetMap = {
      initial: bottomSheetModalRef,
      carType: carTypeSelectionSheetRef,
      userCarInfo: userCarInfoSheetRef,
      payment: paymentOptionsSheetRef,
      rideSearch: rideSearchSheetRef,
      tripStarted: tripStartedSheetRef,
      driverArriving: driverArrivingSheetRef,
      tripEnding: tripEndingSheetRef,
      details: bottomSheetModalRefDetails,
      dragMarker: bottomSheetModalDragMarker,
    };
    if (activeBottomSheet === sheetName) {
      dismissAllBottomSheets();
      sheetMap[sheetName]?.current?.present();
      return;
    }
    if (transitionTimeoutRef.current) {
      clearTimeout(transitionTimeoutRef.current);
      transitionTimeoutRef.current = null;
    }
    dismissAllBottomSheets();
    setActiveBottomSheet(sheetName);
    transitionTimeoutRef.current = setTimeout(() => {
      sheetMap[sheetName]?.current?.present();
      transitionTimeoutRef.current = null;
    }, 300);
  }, [activeBottomSheet, dismissAllBottomSheets]);

  // ── onResetRef (avoids circular dep in useMapTrip) ───────────────────────
  const onResetRef = useRef(null);

  // ── Sub-hooks ─────────────────────────────────────────────────────────────
  const geocoding = useMapGeocoding();

  const routing = useMapRouting();

  const drivers = useMapDrivers({ userLocation, tripService: null });

  const trip = useMapTrip({
    socket,
    user,
    prices,
    userLocation,
    originCity,
    destinationCity,
    markers,
    presentBottomSheet,
    dismissAllBottomSheets,
    updateModal,
    showAlert,
    handleIncomingMessages,
    lastMessageCountRef,
    modalChatOpen: modalState.chat,
    onResetRef,
    setMapMarkers: setMarkers,
    setDriverLocation: drivers.setDriverLocation,
    updateCurrentRoute: routing.updateCurrentRoute,
    routeCoordinates: routing.routeCoordinates,
    getDistanceInKm: routing.getDistanceInKm,
    getSlicedRoute: routing.getSlicedRoute,
    setDirections: routing.setDirections,
    serviceStatus,
    setServiceStatus,
    fetchPrices,
    removeDiscount,
    setOriginCity,
    setDestinationCity,
  });

  // ── resetToInitialState ───────────────────────────────────────────────────
  const resetToInitialState = useCallback(() => {
    updateModal('savedPlaces', false);
    updateModal('cancel', false);
    updateModal('preCancel', false);
    updateModal('chat', false);
    updateModal('confirmation', false);

    setMarkers([]);
    setMarkerVisible(false);
    routing.clearRoute();
    drivers.clearCarsAround();
    drivers.setDriverLocation(null);

    setOriginCity(null);
    setDestinationCity(null);
    setOriginCoords(null);
    setDestinationCoords(null);
    setIsCurrLocation(null);
    setLocationSelection({
      origin: { address: null, coords: null, isCurrentLocation: false },
      destination: { address: null, coords: null, isCurrentLocation: false },
      activeInput: null,
      pendingDragLocation: { address: null, coords: null },
    });

    trip.resetTripData();
    presentBottomSheet('initial');
  }, [updateModal, routing, drivers, trip, presentBottomSheet]);

  // Wire onResetRef after all hooks are set up
  onResetRef.current = resetToInitialState;

  // ── Effects ───────────────────────────────────────────────────────────────

  // Sync trip state to TripStateContext
  useEffect(() => {
    setTripActive(!!trip.tripData.service);
    setTripStatus(trip.tripData.status);
  }, [trip.tripData.service, trip.tripData.status, setTripActive, setTripStatus]);

  useEffect(() => {
    const handleHardwareBack = () => {
      if (activeBottomSheet === 'rideSearch' || trip.tripData.status === 'connecting') {
        trip.handleCancelSearch();
        return true;
      }
      return false;
    };

    const subscription = BackHandler.addEventListener('hardwareBackPress', handleHardwareBack);
    return () => subscription.remove();
  }, [activeBottomSheet, trip.tripData.status, trip.handleCancelSearch]);

  // Center map initially
  useEffect(() => {
    if (userLocation && !trip.tripData.driver && !hasCentered) {
      mapRef.current?.animateToRegion({
        latitude: userLocation.latitude,
        longitude: userLocation.longitude,
        latitudeDelta: MAP_LATITUDE_DELTA,
        longitudeDelta: MAP_LONGITUDE_DELTA,
      });
      setHasCentered(true);
    }
  }, [userLocation, trip.tripData.driver, hasCentered]);

  // Fit map to route
  useEffect(() => {
    if (routing.directions?.coordinates) {
      mapRef.current?.fitToCoordinates(routing.directions.coordinates, {
        edgePadding: { bottom: scale(250), top: scale(50), left: scale(20), right: scale(20) },
      });
    }
  }, [routing.directions?.coordinates]);

  // Present initial sheet on mount
  useEffect(() => {
    presentBottomSheet('initial');
  }, []);

  // Register socket event handlers
  useEffect(() => {
    if (!socket) return;
    const handlers = {
      bestDriver: trip.handleBestDriver,
      driverConnected: trip.handleDriverConnected,
      driverLocation: trip.handleDriverLocation,
      serviceAccepted: trip.handleServiceAccepted,
      serviceDeclined: trip.handleDriverDeclined,
      serviceStarted: trip.handleServiceStarted,
      serviceEnded: trip.handleServiceEnded,
      serviceCancelled: trip.handleServiceCancelled,
      noDriver: trip.handleNoDriver,
      message: trip.handleMessage,
    };
    Object.entries(handlers).forEach(([event, handler]) => socket.on(event, handler));
    return () => Object.entries(handlers).forEach(([event, handler]) => socket.off(event, handler));
  }, [
    socket,
    trip.handleBestDriver,
    trip.handleDriverConnected,
    trip.handleDriverLocation,
    trip.handleServiceAccepted,
    trip.handleDriverDeclined,
    trip.handleServiceStarted,
    trip.handleServiceEnded,
    trip.handleServiceCancelled,
    trip.handleNoDriver,
    trip.handleMessage,
  ]);

  // Nearby-driver polling — stops automatically when a service is active
  useEffect(() => {
    if (!userLocation || trip.tripData.service) {
      drivers.clearCarsAround();
      return;
    }
    drivers.getNearbyDrivers();
    const pollingTimer = setInterval(drivers.getNearbyDrivers, DRIVER_POLL_INTERVAL_MS);
    return () => clearInterval(pollingTimer);
  }, [userLocation, trip.tripData.service]);

  // Handle service status updates (reconnect flow)
  useEffect(() => {
    if (!serviceStatus) return;

    if (['nodriver', 'cancelled'].includes(serviceStatus?.service?.status)) {
      resetToInitialState();
      setServiceStatus?.(null);
      return;
    }

    if (serviceStatus?.service?.status === 'flagged') return;

    const { service, car = {} } = serviceStatus;
    if (!service?.driver?._id || !service?.locations?.[0] || !service?.locations?.[1]) {
      setServiceStatus?.(null);
      resetToInitialState();
      return;
    }
    const status = service.status;
    const room = `service-request-${service._id}`;
    const paymentValue = service.payment?.value ?? service.payment?.amount;
    const recoveryKey = `${service._id}:${status}`;
    const recoverySheet =
      status === 'in-progress' ? 'tripEnding' :
        status === 'assigned' ? 'tripStarted' :
          status === 'connecting' ? 'tripStarted' :
            null;

    if (lastRecoveredServiceKeyRef.current === recoveryKey) {
      if (recoverySheet && activeBottomSheet !== recoverySheet) {
        presentBottomSheet(recoverySheet);
      }
      return;
    }

    lastRecoveredServiceKeyRef.current = recoveryKey;

    trip.updateTripData({
      price: paymentValue,
      driverConnected: true,
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
          name: [car.brand, car.model, car.color].filter(Boolean).join(' '),
          color: car.color || '',
          licensePlate: car.licensePlate || '',
        },
      },
    });
    setOriginCity(service.locations[0].name);
    setDestinationCity(service.locations[1].name);

    switch (status) {
      case 'in-progress':
        if (socket?.connected) socket.emit('join', room);
        presentBottomSheet('tripEnding');
        trip.updateTripData({ service, status: 'in-progress', price: paymentValue, driverConnected: true });
        break;
      case 'assigned':
        if (socket?.connected) socket.emit('join', room);
        presentBottomSheet('tripStarted');
        trip.updateTripData({ service, status: 'assigned', price: paymentValue, driverConnected: true });
        break;
      case 'connecting':
        if (socket?.connected) socket.emit('join', room);
        presentBottomSheet('tripStarted');
        trip.updateTripData({ service, status: 'assigned', price: paymentValue, driverConnected: true });
        break;
      case 'completed':
        trip.updateTripData({ price: paymentValue, service });
        updateModal('confirmation', true);
        if (user?.discount?.active) {
          removeDiscount(user.discount.promotion.code);
        }
        break;
    }
  }, [
    serviceStatus,
    presentBottomSheet,
    resetToInitialState,
    setServiceStatus,
    socket,
    trip.updateTripData,
    updateModal,
    user,
    removeDiscount,
  ]);

  // Sync message count ref after chat closes
  useEffect(() => {
    if (!modalState.chat && trip.tripData.service?._id) {
      api.get(`/chats/${trip.tripData.service._id}`)
        .then((r) => { lastMessageCountRef.current = r.data?.messages?.length || 0; })
        .catch((e) => logger.error('Failed to fetch message count', e));
    }
  }, [modalState.chat, trip.tripData.service?._id]);

  // ── Current Location Label (chip) ────────────────────────────────────────
  const [currentLocationLabel, setCurrentLocationLabel] = useState(null);
  const hasGeocodedRef = useRef(false);

  useEffect(() => {
    if (!userLocation || hasGeocodedRef.current) return;
    hasGeocodedRef.current = true;
    geocoding.getAddressFromCoordinates(userLocation.latitude, userLocation.longitude)
      .then((address) => { if (address) setCurrentLocationLabel(address); })
      .catch(() => {});
  }, [userLocation]);

  // ── Location-throttle ────────────────────────────────────────────────────
  const lastLocationUpdateRef = useRef(Date.now());
  const handleUserLocationChange = useCallback(({ nativeEvent: { coordinate } }) => {
    const now = Date.now();
    if (now - lastLocationUpdateRef.current >= 1000) {
      if (coordinate && !modalState.destination && markers.length < 2) {
        setUserLocation(coordinate);
      }
      lastLocationUpdateRef.current = now;
    }
  }, [modalState.destination, markers.length, setUserLocation]);

  // ── centerToUserLocation ─────────────────────────────────────────────────
  const centerToUserLocation = useCallback(() => {
    if (userLocation && !trip.tripData.driver && !hasCentered) {
      mapRef.current?.animateToRegion({
        latitude: userLocation.latitude,
        longitude: userLocation.longitude,
        latitudeDelta: MAP_LATITUDE_DELTA,
        longitudeDelta: MAP_LONGITUDE_DELTA,
      });
      setHasCentered(true);
    }
  }, [userLocation, trip.tripData.driver, hasCentered]);

  // ── UI Handlers ──────────────────────────────────────────────────────────

  const handleMapSearchBarPress = useCallback(async () => {
    if (!userLocation?.latitude || !userLocation?.longitude) {
      showAlert({ type: 'info', title: 'Localização indisponível', message: 'Aguarde enquanto obtemos sua localização.' });
      return;
    }
    const address = await geocoding.getAddressFromCoordinates(userLocation.latitude, userLocation.longitude);
    const coordinates = { latitude: userLocation.latitude, longitude: userLocation.longitude };
    setOriginCity(address || 'Localização atual');
    setOriginCoords(coordinates);
    setIsCurrLocation(coordinates);
    dismissAllBottomSheets();
    setLocationSelection((prev) => ({
      ...prev,
      origin: { address: address || 'Localização atual', coords: coordinates, isCurrentLocation: true },
    }));
    updateModal('destination', true);
    trip.updateTripData({ inputLocationObject: 1 });
  }, [userLocation, geocoding, showAlert, dismissAllBottomSheets, updateModal, trip]);

  const handlePressItemPress = useCallback((item, activeInput) => {
    let coords = item.geometry?.location
      ? { latitude: item.geometry.location.lat, longitude: item.geometry.location.lng }
      : null;
    let address = item.name || item.formatted_address;

    if (activeInput === 'origin') {
      if (coords) setOriginCoords(coords);
      setOriginCity(address);
      setIsCurrLocation(undefined);
    } else if (activeInput === 'destination') {
      if (address === 'CurrLocation') {
        coords = { latitude: userLocation?.latitude, longitude: userLocation?.longitude };
        address = geocoding.markerCity;
      }
      fetchPrices();
      setDestinationCity(address);
      setMarkers([originCoords, coords]);
      updateModal('destination', false);
      presentBottomSheet('carType');
    }
  }, [userLocation, geocoding.markerCity, originCoords, fetchPrices, updateModal, presentBottomSheet]);

  const handleOnFavouriteButtonPress = useCallback((item) => async () => {
    const destinationAddress = item.place.description;
    const destinationCoordinates = {
      latitude: item.place.coordinates.latitude,
      longitude: item.place.coordinates.longitude,
    };
    setDestinationCity(destinationAddress);
    setDestinationCoords(destinationCoordinates);
    setLocationSelection((prev) => ({
      ...prev,
      destination: { address: destinationAddress, coords: destinationCoordinates, isCurrentLocation: false },
    }));

    let originCoordinates = null;
    let originAddress = null;

    if (isCurrLocation || originCoords?.latitude) {
      originCoordinates = originCoords || { latitude: userLocation?.latitude, longitude: userLocation?.longitude };
      originAddress = originCity;
    } else if (locationSelection.origin.coords) {
      originCoordinates = locationSelection.origin.coords;
      originAddress = locationSelection.origin.address;
    } else if (userLocation?.latitude) {
      originCoordinates = { latitude: userLocation.latitude, longitude: userLocation.longitude };
      try {
        originAddress = await geocoding.getAddressFromCoordinates(userLocation.latitude, userLocation.longitude);
      } catch {
        originAddress = 'Localização Atual';
      }
      setOriginCity(originAddress);
      setOriginCoords(originCoordinates);
      setIsCurrLocation(originCoordinates);
      setLocationSelection((prev) => ({
        ...prev,
        origin: { address: originAddress, coords: originCoordinates, isCurrentLocation: true },
      }));
    }

    if (originCoordinates?.latitude && destinationCoordinates?.latitude) {
      fetchPrices();
      setMarkers([originCoordinates, destinationCoordinates]);
      presentBottomSheet('carType');
    } else {
      updateModal('destination', true);
      trip.updateTripData({ inputLocationObject: 0 });
    }
  }, [isCurrLocation, originCoords, originCity, locationSelection, userLocation, geocoding, fetchPrices, presentBottomSheet, updateModal, trip]);

  const handleInitiateDragMarkerSelection = useCallback(() => () => {
    setLocationSelection((prev) => ({
      ...prev,
      activeInput: trip.tripData.inputLocationObject === 0 ? 'origin' : 'destination',
    }));
    updateModal('destination', false);
    setMarkerVisible(true);
    presentBottomSheet('dragMarker');
  }, [trip.tripData.inputLocationObject, updateModal, presentBottomSheet]);

  const handleDragMarkerPositionChange = useCallback(({ latitude, longitude }) => {
    geocoding.getAddressFromCoordinates(latitude, longitude);
    setLocationSelection((prev) => ({
      ...prev,
      pendingDragLocation: { address: geocoding.markerCity, coords: { latitude, longitude } },
    }));
    setMarkerCoordinates({ latitude, longitude });
    if (trip.tripData.inputLocationObject === 0) {
      setOriginCoords({ latitude, longitude });
    } else if (trip.tripData.inputLocationObject === 1) {
      fetchPrices();
      setDestinationCoords({ latitude, longitude });
    }
  }, [geocoding, trip.tripData.inputLocationObject, fetchPrices]);

  const handleReturnToSearchFromDragMarker = useCallback(() => {
    if (savedAddressMapDragCallback) {
      dismissAllBottomSheets();
      setMarkerVisible(false);
      updateModal('savedPlaces', true);
      return;
    }
    const inputType = locationSelection.activeInput;
    if (inputType && geocoding.markerCity) {
      applyLocationSelection(inputType, {
        address: geocoding.markerCity,
        coords: locationSelection.pendingDragLocation.coords,
        isCurrentLocation: false,
      });
    }
    dismissAllBottomSheets();
    setMarkerVisible(false);
    updateModal('destination', true);
  }, [savedAddressMapDragCallback, locationSelection, geocoding.markerCity, applyLocationSelection, dismissAllBottomSheets, updateModal]);

  const handleConfirmDragMarkerLocation = useCallback(() => {
    if (savedAddressMapDragCallback) {
      savedAddressMapDragCallback({
        coordinates: locationSelection.pendingDragLocation.coords || { latitude: 0, longitude: 0 },
        address: geocoding.markerCity,
        name: geocoding.markerCity?.split(',')[0] || 'Local selecionado',
      });
      setSavedAddressMapDragCallback(null);
      setMarkerVisible(false);
      setLocationSelection((prev) => ({ ...prev, pendingDragLocation: { address: null, coords: null } }));
      setMarkerCoordinates(null);
      dismissAllBottomSheets();
      updateModal('savedPlaces', true);
      return;
    }

    const inputType = locationSelection.activeInput;
    if (inputType && geocoding.markerCity) {
      applyLocationSelection(inputType, {
        address: geocoding.markerCity,
        coords: locationSelection.pendingDragLocation.coords,
        isCurrentLocation: false,
      });
    }

    const updatedOrigin = inputType === 'origin' ? geocoding.markerCity : (locationSelection.origin.address || originCity);
    const updatedDest = inputType === 'destination' ? geocoding.markerCity : (locationSelection.destination.address || destinationCity);

    if (updatedOrigin && updatedDest) {
      const oCoords = inputType === 'origin'
        ? locationSelection.pendingDragLocation.coords
        : (locationSelection.origin.coords || originCoords);
      const dCoords = inputType === 'destination'
        ? locationSelection.pendingDragLocation.coords
        : (locationSelection.destination.coords || destinationCoords);
      setMarkers([oCoords, dCoords]);
      updateModal('destination', false);
      setMarkerVisible(false);
      presentBottomSheet('carType');
    } else {
      if (inputType === 'origin') trip.updateTripData({ inputLocationObject: 1 });
      updateModal('destination', true);
      dismissAllBottomSheets();
      setMarkerVisible(false);
    }
  }, [savedAddressMapDragCallback, locationSelection, geocoding.markerCity, applyLocationSelection, originCity, destinationCity, originCoords, destinationCoords, dismissAllBottomSheets, updateModal, presentBottomSheet, trip]);

  const handleSavedAddressMapDragRequest = useCallback((callback) => {
    setSavedAddressMapDragCallback(() => callback);
    updateModal('savedPlaces', false);
    updateModal('destination', false);
    setMarkerVisible(true);
    presentBottomSheet('dragMarker');
  }, [updateModal, presentBottomSheet]);

  const handleLocationTextInputFocus = useCallback((value) => {
    trip.updateTripData({ inputLocationObject: value });
  }, [trip]);

  const handleTypeCarPress = useCallback((type, price) => () => {
    const defaultVehicle = user?.vehicles?.find((v) => v.isDefault);
    trip.updateTripData({
      carType: type,
      price,
      brand: defaultVehicle?.brand || '',
      model: defaultVehicle?.model || '',
      license: defaultVehicle?.license || '',
      color: defaultVehicle?.color || '',
    });
    presentBottomSheet('userCarInfo');
  }, [trip, presentBottomSheet, user?.vehicles]);

  const handleConfirmButtonPress = useCallback(async (shouldSave) => {
    Keyboard.dismiss();
    if (shouldSave) {
      try {
        await saveUserVehicle({
          brand: trip.tripData.brand,
          model: trip.tripData.model,
          license: trip.tripData.license,
          color: trip.tripData.color,
          isDefault: !user?.vehicles?.length,
        });
      } catch (_) {}
    }
    presentBottomSheet('payment');
  }, [presentBottomSheet, saveUserVehicle, trip.tripData, user?.vehicles]);

  const handleBrandInputValueChange = useCallback((brand) => trip.updateTripData({ brand }), [trip]);
  const handleModelInputValueChange = useCallback((model) => trip.updateTripData({ model }), [trip]);
  const handleLicenseInputValueChange = useCallback((license) => trip.updateTripData({ license }), [trip]);
  const handleColorInputValueChange = useCallback((color) => trip.updateTripData({ color }), [trip]);
  const handlePressSelectTypeRoad = useCallback((type) => trip.updateTripData({ carType: type }), [trip]);

  const handleMapDirectionsReady = useCallback((routeInfo) => {
    const duration = routing.handleMapDirectionsReady(routeInfo);
    trip.updateTripData({ duration });
  }, [routing, trip]);

  const handleDetailsForm = useCallback(() => {
    trip.updateTripData({ detailsInfo: { isViewingDetails: true } });
    presentBottomSheet('details');
  }, [trip, presentBottomSheet]);

  const handleBackDetailsButtonPress = useCallback(() => {
    if (trip.tripData.detailsInfo) {
      trip.updateTripData({ detailsInfo: null });
      if (trip.tripData.status === 'in-progress') presentBottomSheet('tripEnding');
      else if (trip.tripData.driverArrived) presentBottomSheet('driverArriving');
      else if (trip.tripData.status === 'assigned') presentBottomSheet('tripStarted');
    }
  }, [trip, presentBottomSheet]);

  const handleBackButtonPress = useCallback(() => {
    if (markers.length === 2) {
      setMarkers([]);
      setOriginCity(null); setDestinationCity(null);
      setOriginCoords(null); setDestinationCoords(null);
      setIsCurrLocation(null);
      setLocationSelection({
        origin: { address: null, coords: null, isCurrentLocation: false },
        destination: { address: null, coords: null, isCurrentLocation: false },
        activeInput: null,
        pendingDragLocation: { address: null, coords: null },
      });
      routing.clearRoute();
      setMarkerVisible(false);
      trip.updateTripData({ brand: '', model: '', license: '', color: '', inputLocationObject: null });
      centerToUserLocation();
      presentBottomSheet('initial');
    }
  }, [markers.length, routing, trip, centerToUserLocation, presentBottomSheet]);

  const handleRecenterMap = useCallback(() => {
    if (routing.directions?.coordinates?.length > 0) {
      mapRef.current?.fitToCoordinates(routing.directions.coordinates, {
        edgePadding: { bottom: scale(250), top: scale(50), left: scale(50), right: scale(50) },
        animated: true,
      });
    } else if (userLocation) {
      mapRef.current?.animateToRegion({
        latitude: userLocation.latitude,
        longitude: userLocation.longitude,
        latitudeDelta: MAP_LATITUDE_DELTA,
        longitudeDelta: MAP_LONGITUDE_DELTA,
      }, 500);
    }
  }, [routing.directions, userLocation]);

  const handleMessageDriver = useCallback(() => {
    updateModal('chat', true);
    resetUnreadCount();
  }, [updateModal, resetUnreadCount]);

  const handleCallDriver = useCallback(() => {
    const phoneNumber = trip.tripData.driver?.phone;
    if (phoneNumber) {
      let phone = phoneNumber.toString().replace(/[^\d]/g, '');
      if (phone.startsWith('244')) phone = phone.substring(3);
      Linking.openURL(`tel:${phone}`).catch(() => {
        showAlert({ type: 'error', title: 'Erro', message: 'Erro ao tentar fazer a ligação' });
      });
    } else {
      showAlert({ type: 'warning', title: 'Aviso', message: 'Número de telefone do motorista não disponível' });
    }
  }, [trip.tripData.driver, showAlert]);

  const handlePreCancelButtonPress = useCallback(() => updateModal('preCancel', true), [updateModal]);
  const handleAddFavouriteButtonPress = useCallback(() => updateModal('savedPlaces', true), [updateModal]);
  const handlePressCancel = useCallback(() => { updateModal('preCancel', false); updateModal('cancel', true); }, [updateModal]);
  const closeDestinationModal = useCallback(() => { updateModal('destination', false); presentBottomSheet('initial'); }, [updateModal, presentBottomSheet]);
  const closeSavedPlacesModal = useCallback(() => { updateModal('savedPlaces', false); presentBottomSheet('initial'); }, [updateModal, presentBottomSheet]);
  const closeConfirmationModal = useCallback(() => resetToInitialState(), [resetToInitialState]);
  const closeCancelModal = useCallback(() => updateModal('cancel', false), [updateModal]);
  const closePreCancelModal = useCallback(() => updateModal('preCancel', false), [updateModal]);
  const closeChatModel = useCallback(() => updateModal('chat', false), [updateModal]);
  const endTrip = useCallback(() => updateModal('confirmation', true), [updateModal]);

  // ── Derived State ─────────────────────────────────────────────────────────
  const isRouteVisible = markers.length === 2;
  const servicePaymentValue = trip.tripData.service?.payment?.value ?? trip.tripData.service?.payment?.amount;
  const ridePrice = servicePaymentValue ?? trip.tripData.price;

  // ── Return ────────────────────────────────────────────────────────────────
  return {
    models: {
      user,
      userLocation,
      prices,
      tripData: trip.tripData,
      service: trip.tripData.service,
      driver: trip.tripData.driver,
      typeCar: trip.tripData.carType,
      ridePrice,
      brand: trip.tripData.brand,
      model: trip.tripData.model,
      license: trip.tripData.license,
      color: trip.tripData.color,
      tripDuration: trip.tripData.duration,
      inputLocationObject: trip.tripData.inputLocationObject,
      driverConnected: trip.tripData.driverConnected,
      driverArrived: trip.tripData.driverArrived,
      detailsInfo: trip.tripData.detailsInfo,
      tripState: trip.tripData.status,
      mapRef,
      modalState,
      modalVisible: modalState.destination,
      modalCancelVisible: modalState.cancel,
      modalSavedPlacesVisible: modalState.savedPlaces,
      modalConfirmationVisible: modalState.confirmation,
      modalChatVisible: modalState.chat,
      modalPreCancelVisible: modalState.preCancel,
      unreadMessageCount,
      unreadNotificationsCount,
      mapMarkers: markers,
      markerVisible,
      markerCity: geocoding.markerCity,
      mapDirections: routing.directions,
      currentRoute: routing.currentRoute,
      carsAround: drivers.carsAround,
      driverLocation: drivers.driverLocation,
      locationSelection,
      originCity,
      destinationCity,
      currentLocationLabel,
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
      timer: trip.timer,
      isActive: trip.isActive,
      isCurrLocation,
      questions,
      favPlaces,
      activeBottomSheet,
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
      handleConfirmPaymentPress: trip.handleConfirmPaymentPress,
      handleMessageDriver,
      handleCallDriver,
      setUnreadMessageCount,
      handleCancelTrip: trip.handleCancelTrip,
      handleCancelSearch: trip.handleCancelSearch,
      startTimer: trip.startTimer,
      resetTimer: trip.resetTimer,
      formatTime: trip.formatTime,
      formatDuration: trip.formatDuration,
      calculateProgress: trip.calculateProgress,
      handleDetailsForm,
      handleBackDetailsButtonPress,
      endTrip,
      handlePressQuestion: trip.handlePressQuestion,
      handlePressCancel,
      resetToInitialState,
      dismissAllBottomSheets,
      presentBottomSheet,
      getAddressFromCoordinates: geocoding.getAddressFromCoordinates,
    },
  };
};
