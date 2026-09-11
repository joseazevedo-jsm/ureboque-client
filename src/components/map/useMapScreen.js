import { useEffect, useRef, useState, useCallback } from 'react';
import { AppState, BackHandler, Keyboard, Linking } from 'react-native';
import { useIsFocused } from '@react-navigation/native';
import { scale } from 'react-native-size-matters';
import { useUserLocationStateContext } from '../../context/UserLocationStateContext';
import { useSocket } from '../../context/SocketContext';
import { useUserData } from '../../context/UserDataContext';
import { useLogger } from '../../hooks/useLogger';
import { useNotification } from '../../context/NotificationContext';
import { useTripState } from '../../context/TripStateContext';
import { useAlert } from '../../context/AlertContext';
import { useLocationAccess } from '../../context/LocationAccessContext';
import { useMapGeocoding } from '../../hooks/useMapGeocoding';
import { useMapRouting } from '../../hooks/useMapRouting';
import { useMapDrivers } from '../../hooks/useMapDrivers';
import { useMapTrip } from '../../hooks/useMapTrip';
import api from '../../services/APIService';
import { setBackgroundLocationSink, startBackgroundLocation, stopBackgroundLocation } from '../../services/BackgroundLocationService';
import { MAP_LATITUDE_DELTA, MAP_LONGITUDE_DELTA, DRIVER_POLL_INTERVAL_MS } from '../../constants/config';
import { getRecoverySheetForTripStatus, isActiveServiceStatus } from '../../utils/serviceState';
import { isStaleActiveService } from '../../context/userDataHelpers';

// Keep coordinate checks local to this orchestration hook so route, search,
// marker-drag, and location flows all fail safely on incomplete API/GPS data.
const isValidCoordinate = (point) => (
  Number.isFinite(Number(point?.latitude)) && Number.isFinite(Number(point?.longitude))
);

export const useMapScreen = () => {
  const logger = useLogger('useMapScreen');

  // ── Context ─────────────────────────────────────────────────────────────
  const { socket } = useSocket();
  const { user, setUser, serviceStatus, setServiceStatus, prices, fetchPrices, fetchCurrentTrip, unreadNotificationsCount, saveUserVehicle, removeDiscount } = useUserData();
  const { userLocation, setUserLocation } = useUserLocationStateContext();
  const hasUserLocation = !!userLocation;
  const { setTripActive, setTripStatus } = useTripState();
  const { showAlert } = useAlert();
  const { isLocationReady, isChecking: isLocationAccessChecking } = useLocationAccess();
  const isFocused = useIsFocused();
  const mountedRef = useRef(true);
  useEffect(() => () => { mountedRef.current = false; }, []);
  const { unreadMessageCount, resetUnreadCount, handleIncomingMessages, setUnreadMessageCount } = useNotification();
  useEffect(() => {
    currentUserIdRef.current = user?.id || null;
  }, [user?.id]);

  // ── Refs ─────────────────────────────────────────────────────────────────
  const mapRef = useRef(null);
  const lastMessageCountRef = useRef(0);
  const lastRecoveredServiceKeyRef = useRef(null);
  const locationUnavailableAlertShownRef = useRef(false);
  const socketHandlersRef = useRef({});
  const reconcileInFlightRef = useRef(null);
  const currentUserIdRef = useRef(null);

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
  // Keep the imperative modal state outside React render timing. Calling
  // dismiss() on a modal that has never been presented wedges @gorhom's
  // internal status at DISMISSING, so only the known active modal is touched.
  const activeBottomSheetRef = useRef(null);
  const bottomSheetHistoryRef = useRef([]);
  const pendingBottomSheetRef = useRef(null);
  const bottomSheetTransitioningRef = useRef(false);
  // Full-screen location modals temporarily hide a sheet. Remember where the
  // user came from so closing the modal returns to that sheet instead of
  // always resetting the flow to the menu/initial sheet.
  const modalReturnSheetRef = useRef('initial');

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

  // ── Location policy ──────────────────────────────────────────────────────
  // GPS is a real battery cost — only run it at high precision when actually
  // needed (picking a point), only run it at all when granted, this screen is
  // focused, and the app is foregrounded, and never once the user is looking
  // at trip details full-screen.
  const [appIsActive, setAppIsActive] = useState(AppState.currentState === 'active');
  useEffect(() => {
    const subscription = AppState.addEventListener('change', (state) => setAppIsActive(state === 'active'));
    return () => subscription.remove();
  }, []);

  // ── Map UI State ─────────────────────────────────────────────────────────
  const [markers, setMarkers] = useState([]);
  // Route requests must not follow every live driver coordinate.
  const [routeMarkers, setRouteMarkers] = useState([]);
  const lastRouteRequestAtRef = useRef(0);
  const [markerVisible, setMarkerVisible] = useState(false);
  const [markerCoordinates, setMarkerCoordinates] = useState(null);
  const dragGeocodeTimerRef = useRef(null);
  const dragGeocodeSequenceRef = useRef(0);
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
    const converted = userSavedPlaces
      .filter((sp) => sp?.place)
      .map((sp) => ({
        _id: sp._id,
        place: {
          name: sp.place.name || 'Local guardado',
          description: sp.place.description,
          coordinates: sp.place.coordinates,
        },
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
  const getBottomSheetRef = useCallback((sheetName) => {
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
    return sheetMap[sheetName];
  }, []);

  const showBottomSheet = useCallback((sheetName) => {
    const targetSheetRef = getBottomSheetRef(sheetName);
    if (!targetSheetRef) return;
    bottomSheetTransitioningRef.current = false;
    activeBottomSheetRef.current = sheetName;
    setActiveBottomSheet(sheetName);
    requestAnimationFrame(() => targetSheetRef.current?.present());
  }, [getBottomSheetRef]);

  const transitionToBottomSheet = useCallback((sheetName) => {
    if (!getBottomSheetRef(sheetName)) return;

    const activeSheetName = activeBottomSheetRef.current;
    if (activeSheetName === sheetName) {
      getBottomSheetRef(sheetName)?.current?.present();
      return;
    }

    // FlowBottomSheet is a regular BottomSheet and each sheet is rendered only
    // while it is the active one. Swap the logical owner atomically so React
    // unmounts the old sheet before mounting the target. Waiting for close's
    // onDismiss (the old BottomSheetModal strategy) deadlocks because index={0}
    // keeps the controlled old sheet open and the target is not rendered yet.
    pendingBottomSheetRef.current = null;
    showBottomSheet(sheetName);
  }, [getBottomSheetRef, showBottomSheet]);

  const handleBottomSheetDismiss = useCallback((sheetName) => {
    if (activeBottomSheetRef.current !== sheetName) return;

    activeBottomSheetRef.current = null;
    bottomSheetTransitioningRef.current = false;
    setActiveBottomSheet(null);
    const pendingSheetName = pendingBottomSheetRef.current;
    pendingBottomSheetRef.current = null;
    if (pendingSheetName) showBottomSheet(pendingSheetName);
  }, [showBottomSheet]);

  const dismissAllBottomSheets = useCallback(() => {
    pendingBottomSheetRef.current = null;
    const activeSheetName = activeBottomSheetRef.current;
    if (activeSheetName) {
      // Clear the logical owner before dismissing. A modal opened in the same
      // tick must not call present() on a sheet that is already dismissing.
      activeBottomSheetRef.current = null;
      bottomSheetTransitioningRef.current = false;
      setActiveBottomSheet(null);
      getBottomSheetRef(activeSheetName)?.current?.dismiss();
      return;
    }
    bottomSheetTransitioningRef.current = false;
    setActiveBottomSheet(null);
  }, [getBottomSheetRef]);

  const presentBottomSheet = useCallback((sheetName) => {
    if (!getBottomSheetRef(sheetName)) return;

    if (sheetName === 'initial') {
      bottomSheetHistoryRef.current = ['initial'];
    } else if (['carType', 'userCarInfo', 'payment'].includes(sheetName)) {
      // Only the editable booking wizard belongs in Back history. Transient
      // marker/details sheets and server-driven trip statuses have their own
      // exits and must never let Back rewind authoritative trip state.
      const history = bottomSheetHistoryRef.current;
      if (history[history.length - 1] !== sheetName) {
        history.push(sheetName);
      }
    }
    transitionToBottomSheet(sheetName);
  }, [getBottomSheetRef, transitionToBottomSheet]);

  const goBackBottomSheet = useCallback(() => {
    const history = bottomSheetHistoryRef.current;
    if (history.length <= 1) return null;
    history.pop();
    const previousSheetName = history[history.length - 1];
    transitionToBottomSheet(previousSheetName);
    return previousSheetName;
  }, [transitionToBottomSheet]);

  // ── onResetRef (avoids circular dep in useMapTrip) ───────────────────────
  const onResetRef = useRef(null);
  // Same pattern: reconcileTrip is defined after useMapTrip (it needs trip.*),
  // but useMapTrip needs a way to trigger it when a booking's outcome is
  // uncertain — a ref lets both directions exist without a real cycle.
  const onBookingUncertainRef = useRef(null);

  // ── Sub-hooks ─────────────────────────────────────────────────────────────
  const geocoding = useMapGeocoding();

  const routing = useMapRouting();

  const tripServiceForDriversRef = useRef(null);
  const drivers = useMapDrivers({
    userLocation,
    tripService: null,
    tripServiceRef: tripServiceForDriversRef,
  });

  // A socket packet received before background suspension is not a current
  // position when the user returns. Clear it so the UI waits for fresh data.
  useEffect(() => {
    if (!appIsActive) {
      drivers.clearCarsAround();
      drivers.setDriverLocation(null);
    }
  }, [appIsActive, drivers.clearCarsAround, drivers.setDriverLocation]);

  useEffect(() => {
    if (markers.length !== 2 || !isValidCoordinate(markers[0]) || !isValidCoordinate(markers[1])) {
      setRouteMarkers([]);
      lastRouteRequestAtRef.current = 0;
      return;
    }

    setRouteMarkers((previous) => {
      if (previous.length !== 2) {
        lastRouteRequestAtRef.current = Date.now();
        return markers;
      }

      const destinationChanged = previous[1].latitude !== markers[1].latitude || previous[1].longitude !== markers[1].longitude;
      const originMovedKm = routing.getDistanceInKm(previous[0], markers[0]);
      const routeAgeMs = Date.now() - lastRouteRequestAtRef.current;
      if (destinationChanged || (originMovedKm >= 0.1 && routeAgeMs >= 60000)) {
        lastRouteRequestAtRef.current = Date.now();
        return markers;
      }
      return previous;
    });
  }, [markers, routing.getDistanceInKm]);

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
    onBookingUncertainRef,
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

  useEffect(() => {
    tripServiceForDriversRef.current = trip.tripData.service;
  }, [trip.tripData.service]);

  // A map-selection marker belongs only to the drag-marker step. Recovery or
  // booking can move the flow directly into an active trip while Fast Refresh
  // preserves markerVisible from the previous step. Clear the complete drag
  // state at that boundary so the picker label cannot remain over trip UI.
  useEffect(() => {
    const serviceStatus = trip.tripData.status || trip.tripData.service?.status;
    if (!trip.tripData.service || !isActiveServiceStatus(serviceStatus)) return;

    if (dragGeocodeTimerRef.current) {
      clearTimeout(dragGeocodeTimerRef.current);
      dragGeocodeTimerRef.current = null;
    }
    dragGeocodeSequenceRef.current += 1;
    setMarkerVisible(false);
    setMarkerCoordinates(null);
    setSavedAddressMapDragCallback(null);
    setLocationSelection((prev) => ({
      ...prev,
      activeInput: null,
      pendingDragLocation: { address: null, coords: null },
    }));
  }, [trip.tripData.service, trip.tripData.status]);

  useEffect(() => {
    const hasActiveTrip = !!trip.tripData.service && isActiveServiceStatus(trip.tripData.status || trip.tripData.service.status);
    if (!hasActiveTrip || !isLocationReady) {
      setBackgroundLocationSink(null);
      stopBackgroundLocation().catch(() => {});
      return undefined;
    }
    setBackgroundLocationSink((location) => {
      if (mountedRef.current && Number.isFinite(Number(location?.latitude)) && Number.isFinite(Number(location?.longitude))) {
        setUserLocation({ ...location, latitude: Number(location.latitude), longitude: Number(location.longitude), receivedAt: Date.now() });
      }
    });
    startBackgroundLocation().catch((error) => logger.warn('Background location unavailable', error));
    return () => {
      setBackgroundLocationSink(null);
      stopBackgroundLocation().catch(() => {});
    };
  }, [trip.tripData.service?._id, trip.tripData.status, isLocationReady, setUserLocation, logger]);

  useEffect(() => () => {
    // UserLocationStateContext outlives navigation/auth providers; never
    // expose the previous account's last GPS fix to the next session.
    setUserLocation(null);
    setTripActive(false);
    setTripStatus(null);
  }, [setUserLocation, setTripActive, setTripStatus]);

  useEffect(() => {
    if (isLocationAccessChecking) return;
    if (isLocationReady) {
      locationUnavailableAlertShownRef.current = false;
      return;
    }
    if (!trip.tripData.service || locationUnavailableAlertShownRef.current) return;

    locationUnavailableAlertShownRef.current = true;
    setUserLocation(null);
    showAlert({
      type: 'warning',
      title: 'Localização indisponível',
      message: 'A permissão ou o GPS foi desactivado. A viagem continua, mas a localização deste telemóvel não será actualizada até activar novamente o GPS.',
      buttons: [{ text: 'OK' }],
    });
  }, [isLocationReady, isLocationAccessChecking, trip.tripData.service, setUserLocation, showAlert]);

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

  // ── Active-trip recovery ──────────────────────────────────────────────────
  // Independent of the monthly-history/rating-flow `serviceStatus` above:
  // recovers ANY unresolved trip (searching, connecting, assigned, in-progress)
  // regardless of its age or whether a driver has been assigned yet, so the
  // app never silently loses track of a request that's still alive server-side.
  const tripServiceRef = useRef(trip.tripData.service);
  useEffect(() => {
    tripServiceRef.current = trip.tripData.service;
  }, [trip.tripData.service]);

  const applyRecoveredSnapshot = useCallback((service) => {
    const current = trip.tripDataRef.current;
    if (!current.service) trip.updateTripData({ service, _version: null });
    if (!trip.handleServiceSnapshot({ service }, { hydrate: true })) return;
    if (service.status === 'cancelled') return;
    if (service.locations?.[0]?.name) setOriginCity(service.locations[0].name);
    if (service.locations?.[1]?.name) setDestinationCity(service.locations[1].name);
    const pickup = service.locations?.[0]?.coordinates;
    const dropoff = service.locations?.[1]?.coordinates;
    if (isValidCoordinate(pickup) && isValidCoordinate(dropoff)) {
      setOriginCoords(pickup);
      setDestinationCoords(dropoff);
      setMarkers([pickup, dropoff]);
    }
    if (socket?.connected && service.status !== 'cancelled') socket.emit('join', 'service-request-' + service._id);
  }, [socket, trip.handleServiceSnapshot, trip.updateTripData, setOriginCity, setDestinationCity]);

  // Single reconciliation path used on launch, foreground return, AND socket
  // reconnect — Socket.IO does not remember room membership across a
  // reconnect, and a snapshot missed while disconnected must be recovered
  // the same way a cold-launch recovery would. When we already know about a
  // trip, the fetched snapshot only replaces it if its version is strictly
  // newer, so a stale/racing response can never regress what a live socket
  // event already delivered.
  const reconcileTripRequest = useCallback(async () => {
    if (!user?.id) return;
    const requestUserId = user.id;
    const knownService = trip.tripDataRef.current.service;

    if (knownService?._id && socket?.connected) {
      socket.emit('join', `service-request-${knownService._id}`);
    }

    let service;
    try {
      // The active endpoint hides terminal requests. Query the known ID to recover
      // a cancellation/completion missed while disconnected.
      service = knownService?._id
        ? (await api.get('/service/' + knownService._id)).data
        : await fetchCurrentTrip();
    } catch (error) { logger.warn('Trip recovery unavailable', error); return; }
    if (!mountedRef.current || currentUserIdRef.current !== requestUserId) return;
    if (!service) return;
    // A non-terminal service abandoned long ago is not the user's current trip.
    // Restoring it leaves the map idle while the drawer insists a trip is
    // active, with nothing on screen to cancel. Same window the history-based
    // recovery already applies (isRecoverableActiveService).
    if (isStaleActiveService(service)) {
      logger.warn('Ignoring stale active service during recovery', {
        serviceId: service?._id,
        status: service?.status,
        createdAt: service?.createdAt,
      });
      return;
    }
    if (knownService?._id && trip.tripDataRef.current.service?._id !== knownService._id) return;

    if (!tripServiceRef.current) {
      applyRecoveredSnapshot(service);
      return;
    }
    if (service._id !== tripServiceRef.current._id) return;

    const currentVersion = trip.tripData._version;
    // A recovery response may have the same version as local storage while
    // the UI is showing the wrong sheet after a cold launch/background return.
    // Re-apply it when the local status disagrees; identical snapshots remain
    // no-ops to avoid replaying animations every 15 seconds.
    if (currentVersion != null && (service.version ?? 0) <= currentVersion && service.status === trip.tripData.status) return;
    applyRecoveredSnapshot(service);
  }, [user?.id, socket, fetchCurrentTrip, applyRecoveredSnapshot, trip.tripData._version]);

  const reconcileTrip = useCallback(() => {
    if (reconcileInFlightRef.current) return reconcileInFlightRef.current;
    const request = reconcileTripRequest();
    reconcileInFlightRef.current = Promise.resolve(request).finally(() => {
      reconcileInFlightRef.current = null;
    });
    return reconcileInFlightRef.current;
  }, [reconcileTripRequest]);
  onBookingUncertainRef.current = reconcileTrip;
  useEffect(() => {
    if (!trip.tripData.service?._id) return;
    const timer = setInterval(() => reconcileTrip(), 15000);
    return () => clearInterval(timer);
  }, [trip.tripData.service?._id, reconcileTrip]);

  // On launch / login. `fetchCurrentTrip` changes identity when authentication
  // restoration completes. A persisted user can be available one render before
  // the auth token, so listening only to user.id leaves a cold launch stuck on
  // the initial sheet after the first (intentionally skipped) recovery attempt.
  useEffect(() => {
    reconcileTrip();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.id, fetchCurrentTrip]);

  // On foreground return
  useEffect(() => {
    const subscription = AppState.addEventListener('change', (state) => {
      if (state === 'active') reconcileTrip();
    });
    return () => subscription.remove();
  }, [reconcileTrip]);

  // On socket (re)connect
  useEffect(() => {
    if (!socket) return;
    const onConnect = () => reconcileTrip();
    socket.on('connect', onConnect);
    return () => socket.off('connect', onConnect);
  }, [socket, reconcileTrip]);

  // ── Effects ───────────────────────────────────────────────────────────────

  // Sync trip state to TripStateContext
  useEffect(() => {
    setTripActive(!!trip.tripData.service);
    setTripStatus(trip.tripData.status);
  }, [trip.tripData.service, trip.tripData.status, setTripActive, setTripStatus]);

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

  // Present the initial sheet after the screen and its modal refs are mounted.
  // A single mount-time present can race the Gorhom portal during reloads; if
  // that happens the map remains usable but has no way to start the flow.
  useEffect(() => {
    if (!isFocused || trip.tripData.service || modalState.destination ||
        modalState.savedPlaces || markerVisible || markers.length === 2 ||
        activeBottomSheetRef.current) return undefined;

    const retryTimer = setTimeout(() => {
      if (!activeBottomSheetRef.current && isFocused && !trip.tripData.service &&
          !modalState.destination && !modalState.savedPlaces && !markerVisible &&
          markers.length !== 2) {
        presentBottomSheet('initial');
      }
    }, 250);

    return () => clearTimeout(retryTimer);
  }, [isFocused, trip.tripData.service, modalState.destination, modalState.savedPlaces, markerVisible, markers.length, activeBottomSheet, presentBottomSheet]);

  // Fast Refresh can preserve our React/ref state while Gorhom remounts its
  // portal with the modal physically closed. Reconcile the imperative modal
  // with the sheet that React still considers active, otherwise the content
  // remains mounted below the viewport and no bottom sheet is visible.
  useEffect(() => {
    if (!isFocused || modalState.destination || modalState.savedPlaces) return undefined;

    const sheetName = activeBottomSheetRef.current;
    if (!sheetName) return undefined;

    const reconcileTimer = setTimeout(() => {
      if (activeBottomSheetRef.current === sheetName) {
        getBottomSheetRef(sheetName)?.current?.present();
      }
    }, 300);

    return () => clearTimeout(reconcileTimer);
  }, [isFocused, activeBottomSheet, modalState.destination, modalState.savedPlaces, getBottomSheetRef]);

  // Keep handler references current without re-registering socket listeners.
  useEffect(() => {
    socketHandlersRef.current = {
      bestDriver: trip.handleBestDriver,
      serviceSnapshot: trip.handleServiceSnapshot,
      driverConnected: reconcileTrip,
      driverLocation: trip.handleDriverLocation,
      serviceAccepted: reconcileTrip,
      serviceDeclined: reconcileTrip,
      serviceStarted: reconcileTrip,
      serviceEnded: reconcileTrip,
      serviceCancelled: reconcileTrip,
      driverTimeout: reconcileTrip,
      noDriver: trip.handleNoDriver,
      message: trip.handleMessage,
    };
  }, [
    reconcileTrip,
    trip.handleServiceSnapshot,
    trip.handleBestDriver,
    trip.handleDriverConnected,
    trip.handleDriverLocation,
    trip.handleServiceAccepted,
    trip.handleDriverDeclined,
    trip.handleServiceStarted,
    trip.handleServiceEnded,
    trip.handleServiceCancelled,
    trip.handleDriverTimeout,
    trip.handleNoDriver,
    trip.handleMessage,
  ]);

  // Register one stable forwarding listener per event for the lifetime of a
  // socket. This removes the off/on gap caused by callback identity changes.
  useEffect(() => {
    if (!socket) return;
    const onDisconnect = () => drivers.setDriverLocation(null);
    socket.on('disconnect', onDisconnect);
    const events = ['serviceSnapshot', 'bestDriver', 'driverConnected', 'driverLocation', 'serviceAccepted', 'serviceDeclined', 'serviceStarted', 'serviceEnded', 'serviceCancelled', 'driverTimeout', 'noDriver', 'message'];
    const handlers = Object.fromEntries(events.map((event) => [
      event,
      (...args) => socketHandlersRef.current[event]?.(...args),
    ]));
    events.forEach((event) => socket.on(event, handlers[event]));
    return () => {
      socket.off('disconnect', onDisconnect);
      events.forEach((event) => socket.off(event, handlers[event]));
    };
  }, [socket, drivers.setDriverLocation]);

  // Nearby-driver polling — stops automatically when a service is active.
  // getNearbyDriversRef always calls the freshest closure (latest userLocation
  // included), but the interval itself is only torn down/recreated when
  // hasUserLocation flips or a trip starts/ends — never on every GPS tick,
  // which used to reset this to ~1x/sec instead of the intended cadence.
  const getNearbyDriversRef = useRef(drivers.getNearbyDrivers);
  useEffect(() => { getNearbyDriversRef.current = drivers.getNearbyDrivers; });

  useEffect(() => {
    if (!hasUserLocation || trip.tripData.service) {
      drivers.clearCarsAround();
      return;
    }
    const poll = () => {
      if (AppState.currentState !== 'active' || !isFocused) return; // paused while backgrounded or off-screen
      getNearbyDriversRef.current();
    };
    poll();
    const pollingTimer = setInterval(poll, DRIVER_POLL_INTERVAL_MS);
    return () => clearInterval(pollingTimer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [hasUserLocation, trip.tripData.service, isFocused]);

  // Legacy history notifications cannot reset a newer active request.
  useEffect(() => {
    if (!serviceStatus) return;
    const service = serviceStatus.service;
    if (service?._id && trip.tripDataRef.current.service?._id === service._id) {
      applyRecoveredSnapshot(service);
    }
    setServiceStatus?.(null);
  }, [serviceStatus, applyRecoveredSnapshot, setServiceStatus]);

  // Sync message count ref after chat closes
  const chatCountRequestRef = useRef(0);
  useEffect(() => {
    const serviceId = trip.tripData.service?._id;
    if (!modalState.chat && serviceId) {
      const requestId = ++chatCountRequestRef.current;
      api.get(`/chats/${serviceId}`)
        .then((r) => {
          if (requestId === chatCountRequestRef.current) {
            lastMessageCountRef.current = r.data?.messages?.length || 0;
          }
        })
        .catch((e) => logger.error('Failed to fetch message count', e));
    }
    return () => { chatCountRequestRef.current += 1; };
  }, [modalState.chat, trip.tripData.service?._id]);
  // ── Current Location Label (chip) ────────────────────────────────────────
  const [currentLocationLabel, setCurrentLocationLabel] = useState(null);
  const hasGeocodedRef = useRef(false);
  const currentLocationGeocodeSeqRef = useRef(0);
  useEffect(() => {
    const sequence = ++currentLocationGeocodeSeqRef.current;
    if (!userLocation) {
      hasGeocodedRef.current = false;
      setCurrentLocationLabel(null);
      return;
    }
    if (hasGeocodedRef.current) return;
    hasGeocodedRef.current = true;
    geocoding.getAddressFromCoordinates(userLocation.latitude, userLocation.longitude)
      .then((address) => {
        if (sequence === currentLocationGeocodeSeqRef.current && address) setCurrentLocationLabel(address);
      })
      .catch(() => {});
    return () => { currentLocationGeocodeSeqRef.current += 1; };
  }, [hasUserLocation]);

  // ── Location-throttle ────────────────────────────────────────────────────
  const lastLocationUpdateRef = useRef(Date.now());
  const handleUserLocationChange = useCallback(({ nativeEvent: { coordinate } }) => {
    const now = Date.now();
    if (now - lastLocationUpdateRef.current >= 1000) {
      if (!trip.tripData.service && isLocationReady && appIsActive && Number.isFinite(coordinate?.latitude) && Number.isFinite(coordinate?.longitude)) {
        setUserLocation({ ...coordinate, receivedAt: now });
      }
      lastLocationUpdateRef.current = now;
    }
  }, [isLocationReady, appIsActive, setUserLocation, trip.tripData.service]);

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
    // GPS is optional: the user can choose both points manually when the
    // permission is denied, revoked, or unavailable in a poor-signal area.
    const hasLocation = isValidCoordinate(userLocation);

    // Open the destination flow immediately. Reverse geocoding is only used
    // to label the origin and must never block the user's first interaction.
    modalReturnSheetRef.current = activeBottomSheetRef.current || 'initial';
    dismissAllBottomSheets();
    updateModal('destination', true);
    trip.updateTripData({ inputLocationObject: hasLocation ? 1 : 0 });

    if (hasLocation) {
      const coordinates = { latitude: userLocation.latitude, longitude: userLocation.longitude };
      let address = 'Localização atual';
      try {
        address = await geocoding.getAddressFromCoordinates(userLocation.latitude, userLocation.longitude)
          || address;
      } catch {
        // The destination screen is still usable with a coordinate-only origin.
      }
      setOriginCity(address || 'Localização atual');
      setOriginCoords(coordinates);
      setIsCurrLocation(coordinates);
      setLocationSelection((prev) => ({
        ...prev,
        origin: { address: address || 'Localização atual', coords: coordinates, isCurrentLocation: true },
      }));
    }
  }, [userLocation, geocoding, dismissAllBottomSheets, updateModal, trip]);

  const handlePressItemPress = useCallback((item, activeInput) => {
    let coords = item?.geometry?.location
      ? { latitude: Number(item.geometry.location.lat), longitude: Number(item.geometry.location.lng) }
      : null;
    let address = item?.name || item?.formatted_address;

    if (address === 'CurrLocation') {
      coords = { latitude: userLocation?.latitude, longitude: userLocation?.longitude };
      // Use the dedicated current-location label. The shared marker geocoder
      // may currently contain a drag result from another interaction.
      address = currentLocationLabel || 'Localização atual';
    }
    if (!isValidCoordinate(coords)) {
      showAlert({
        type: 'error',
        title: 'Localização inválida',
        message: 'Não foi possível definir este ponto. Escolha outra sugestão.',
      });
      return;
    }

    if (activeInput === 'origin') {
      if (coords) setOriginCoords(coords);
      setOriginCity(address);
      setIsCurrLocation(undefined);
    } else if (activeInput === 'destination') {
      if (!isValidCoordinate(originCoords)) {
        showAlert({
          type: 'warning',
          title: 'Defina a origem',
          message: 'Escolha primeiro o local de recolha antes do destino.',
        });
        return;
      }
      fetchPrices();
      setDestinationCity(address);
      setMarkers([originCoords, coords]);
      updateModal('destination', false);
      presentBottomSheet('carType');
    }
  }, [userLocation, currentLocationLabel, originCoords, fetchPrices, updateModal, presentBottomSheet, showAlert]);

  const handleOnFavouriteButtonPress = useCallback((item) => async () => {
    const place = item?.place;
    const destinationAddress = place?.description;
    const destinationCoordinates = {
      latitude: Number(place?.coordinates?.latitude),
      longitude: Number(place?.coordinates?.longitude),
    };
    if (!isValidCoordinate(destinationCoordinates)) {
      showAlert({
        type: 'error',
        title: 'Localização inválida',
        message: 'Este local guardado não tem coordenadas válidas.',
      });
      return;
    }
    setDestinationCity(destinationAddress);
    setDestinationCoords(destinationCoordinates);
    setLocationSelection((prev) => ({
      ...prev,
      destination: { address: destinationAddress, coords: destinationCoordinates, isCurrentLocation: false },
    }));

    let originCoordinates = null;
    let originAddress = null;

    if (isCurrLocation || isValidCoordinate(originCoords)) {
      originCoordinates = originCoords || { latitude: userLocation?.latitude, longitude: userLocation?.longitude };
      originAddress = originCity;
    } else if (locationSelection.origin.coords) {
      originCoordinates = locationSelection.origin.coords;
      originAddress = locationSelection.origin.address;
    } else if (isValidCoordinate(userLocation)) {
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

    if (isValidCoordinate(originCoordinates) && isValidCoordinate(destinationCoordinates)) {
      fetchPrices();
      setMarkers([originCoordinates, destinationCoordinates]);
      presentBottomSheet('carType');
    } else {
      updateModal('destination', true);
      trip.updateTripData({ inputLocationObject: 0 });
    }
  }, [isCurrLocation, originCoords, originCity, locationSelection, userLocation, geocoding, fetchPrices, presentBottomSheet, updateModal, trip, showAlert]);

  const handleInitiateDragMarkerSelection = useCallback(() => async () => {
    const initialCoords = userLocation && {
      latitude: Number(userLocation.latitude),
      longitude: Number(userLocation.longitude),
    };
    setLocationSelection((prev) => ({
      ...prev,
      activeInput: trip.tripData.inputLocationObject === 0 ? 'origin' : 'destination',
      // Seed with the map's starting center (userLocation) so confirming without
      // ever dragging the pin still has real coordinates — pendingDragLocation.coords
      // otherwise only gets set once handleDragMarkerPositionChange fires on a drag,
      // which previously let a null-coordinate marker through and crashed the map.
      pendingDragLocation: initialCoords
        ? { address: null, coords: initialCoords }
        : prev.pendingDragLocation,
    }));
    updateModal('destination', false);
    setMarkerVisible(true);
    presentBottomSheet('dragMarker');
    // onRegionChangeComplete can fire before markerVisible reaches the event
    // handler's closure. Resolve the initial map center explicitly so the pin
    // never remains on "Carregando..." until the user drags a second time.
    if (isValidCoordinate(initialCoords)) {
      const sequence = ++dragGeocodeSequenceRef.current;
      const address = await geocoding.getAddressFromCoordinates(
        initialCoords.latitude,
        initialCoords.longitude,
      ) || `Localização selecionada (${initialCoords.latitude.toFixed(5)}, ${initialCoords.longitude.toFixed(5)})`;
      if (sequence === dragGeocodeSequenceRef.current) {
        setLocationSelection((prev) => ({
          ...prev,
          pendingDragLocation: { address, coords: initialCoords },
        }));
      }
    }
  }, [trip.tripData.inputLocationObject, updateModal, presentBottomSheet, userLocation, geocoding]);

  const handleDragMarkerPositionChange = useCallback(({ latitude, longitude }) => {
    if (!markerVisible) return;
    latitude = Number(latitude);
    longitude = Number(longitude);
    if (!Number.isFinite(latitude) || !Number.isFinite(longitude)) return;
    const sequence = ++dragGeocodeSequenceRef.current;
    if (dragGeocodeTimerRef.current) clearTimeout(dragGeocodeTimerRef.current);
    setLocationSelection((prev) => ({
      ...prev,
      pendingDragLocation: { address: null, coords: { latitude, longitude } },
    }));
    setMarkerCoordinates({ latitude, longitude });
    dragGeocodeTimerRef.current = setTimeout(async () => {
      const address = await geocoding.getAddressFromCoordinates(latitude, longitude)
        || `Localização selecionada (${latitude.toFixed(5)}, ${longitude.toFixed(5)})`;
      if (sequence !== dragGeocodeSequenceRef.current) return;
      setLocationSelection((prev) => ({
        ...prev,
        pendingDragLocation: { address, coords: { latitude, longitude } },
      }));
    }, 500);
    if (trip.tripData.inputLocationObject === 0) {
      setOriginCoords({ latitude, longitude });
    } else if (trip.tripData.inputLocationObject === 1) {
      setDestinationCoords({ latitude, longitude });
    }
  }, [markerVisible, geocoding, trip.tripData.inputLocationObject]);

  useEffect(() => () => {
    if (dragGeocodeTimerRef.current) clearTimeout(dragGeocodeTimerRef.current);
    dragGeocodeSequenceRef.current += 1;
  }, []);

  const handleReturnToSearchFromDragMarker = useCallback(() => {
    if (savedAddressMapDragCallback) {
      dismissAllBottomSheets();
      setMarkerVisible(false);
      updateModal('savedPlaces', true);
      return;
    }
    const inputType = locationSelection.activeInput;
    if (inputType && locationSelection.pendingDragLocation.address) {
      applyLocationSelection(inputType, {
        address: locationSelection.pendingDragLocation.address,
        coords: locationSelection.pendingDragLocation.coords,
        isCurrentLocation: false,
      });
    }
    dismissAllBottomSheets();
    setMarkerVisible(false);
    updateModal('destination', true);
  }, [savedAddressMapDragCallback, locationSelection, applyLocationSelection, dismissAllBottomSheets, updateModal]);

  const handleConfirmDragMarkerLocation = useCallback(() => {
    if (savedAddressMapDragCallback) {
      if (!isValidCoordinate(locationSelection.pendingDragLocation.coords)) {
        showAlert({
          type: 'error',
          title: 'Localização inválida',
          message: 'Arraste o marcador para uma posição válida antes de confirmar.',
        });
        return;
      }
      savedAddressMapDragCallback({
        coordinates: locationSelection.pendingDragLocation.coords,
        address: locationSelection.pendingDragLocation.address,
        name: locationSelection.pendingDragLocation.address?.split(',')[0] || 'Local selecionado',
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
    if (inputType && locationSelection.pendingDragLocation.address) {
      applyLocationSelection(inputType, {
        address: locationSelection.pendingDragLocation.address,
        coords: locationSelection.pendingDragLocation.coords,
        isCurrentLocation: false,
      });
    }

    const pendingAddress = locationSelection.pendingDragLocation.address;
    const updatedOrigin = inputType === 'origin' ? pendingAddress : (locationSelection.origin.address || originCity);
    const updatedDest = inputType === 'destination' ? pendingAddress : (locationSelection.destination.address || destinationCity);

    if (updatedOrigin && updatedDest) {
      fetchPrices();
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
  }, [savedAddressMapDragCallback, locationSelection, applyLocationSelection, originCity, destinationCity, originCoords, destinationCoords, dismissAllBottomSheets, updateModal, presentBottomSheet, trip, fetchPrices, showAlert]);

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
    if (activeBottomSheetRef.current === 'dragMarker') {
      handleReturnToSearchFromDragMarker();
      return;
    }

    const previousSheetName = goBackBottomSheet();
    if (previousSheetName && previousSheetName !== 'initial') return;

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
      if (!previousSheetName) presentBottomSheet('initial');
    }
  }, [markers.length, routing, trip, centerToUserLocation, presentBottomSheet, goBackBottomSheet, handleReturnToSearchFromDragMarker]);

  // Hardware back must mirror whatever on-screen back control is visible for the
  // current step, or Android falls through to its default behavior and exits the
  // app outright — silently discarding an in-progress request or an active ride.
  useEffect(() => {
    const handleHardwareBack = () => {
      if (activeBottomSheet === 'dragMarker') {
        handleReturnToSearchFromDragMarker();
        return true;
      }
      if (activeBottomSheet === 'rideSearch' || trip.tripData.status === 'connecting') {
        trip.handleCancelSearch();
        return true;
      }
      if (trip.tripData.detailsInfo) {
        handleBackDetailsButtonPress();
        return true;
      }
      if (markers.length === 2 && !trip.tripData.service) {
        handleBackButtonPress();
        return true;
      }
      return false;
    };

    const subscription = BackHandler.addEventListener('hardwareBackPress', handleHardwareBack);
    return () => subscription.remove();
  }, [
    activeBottomSheet,
    trip.tripData.status,
    trip.tripData.detailsInfo,
    trip.tripData.service,
    trip.handleCancelSearch,
    markers.length,
    handleBackButtonPress,
    handleBackDetailsButtonPress,
    handleReturnToSearchFromDragMarker,
  ]);

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
      if (!phone) {
        showAlert({ type: 'warning', title: 'Aviso', message: 'Número de telefone do motorista inválido' });
        return;
      }
      Linking.openURL(`tel:${phone}`).catch(() => {
        showAlert({ type: 'error', title: 'Erro', message: 'Erro ao tentar fazer a ligação' });
      });
    } else {
      showAlert({ type: 'warning', title: 'Aviso', message: 'Número de telefone do motorista não disponível' });
    }
  }, [trip.tripData.driver, showAlert]);

  const handlePreCancelButtonPress = useCallback(() => updateModal('preCancel', true), [updateModal]);
  const handleAddFavouriteButtonPress = useCallback(() => {
    modalReturnSheetRef.current = activeBottomSheetRef.current || 'initial';
    dismissAllBottomSheets();
    updateModal('savedPlaces', true);
  }, [dismissAllBottomSheets, updateModal]);
  const handlePressCancel = useCallback(() => { updateModal('preCancel', false); updateModal('cancel', true); }, [updateModal]);
  const closeDestinationModal = useCallback(() => {
    const returnSheet = modalReturnSheetRef.current || 'initial';
    modalReturnSheetRef.current = 'initial';
    updateModal('destination', false);
    presentBottomSheet(returnSheet);
  }, [updateModal, presentBottomSheet]);
  const closeSavedPlacesModal = useCallback(() => {
    const returnSheet = modalReturnSheetRef.current || 'initial';
    modalReturnSheetRef.current = 'initial';
    updateModal('savedPlaces', false);
    presentBottomSheet(returnSheet);
  }, [updateModal, presentBottomSheet]);
  const closeConfirmationModal = useCallback(() => resetToInitialState(), [resetToInitialState]);
  const closeCancelModal = useCallback(() => updateModal('cancel', false), [updateModal]);
  const closePreCancelModal = useCallback(() => updateModal('preCancel', false), [updateModal]);
  const closeChatModel = useCallback(() => updateModal('chat', false), [updateModal]);
  const endTrip = useCallback(() => updateModal('confirmation', true), [updateModal]);

  // ── Derived State ─────────────────────────────────────────────────────────
  const isRouteVisible = markers.length === 2;
  const servicePaymentValue = trip.tripData.service?.payment?.value ?? trip.tripData.service?.payment?.amount;
  const ridePrice = servicePaymentValue ?? trip.tripData.price;

  // Android-only props (react-native-maps): high precision + frequent updates
  // only while actively choosing a point; otherwise a coarser, cheaper fix.
  const selectingPickup = modalState.destination;
  const needsLiveLocation = !trip.tripData.service && !trip.tripData.detailsInfo?.isViewingDetails;
  const showsUserLocation = isLocationReady && isFocused && appIsActive && needsLiveLocation;
  const userLocationPriority = selectingPickup ? 'high' : 'balanced';
  const userLocationUpdateInterval = selectingPickup ? 5000 : 15000;
  const userLocationFastestInterval = selectingPickup ? 5000 : 15000;

  // ── Return ────────────────────────────────────────────────────────────────
  return {
    models: {
      user,
      userLocation,
      showsUserLocation,
      userLocationPriority,
      userLocationUpdateInterval,
      userLocationFastestInterval,
      prices,
      tripData: trip.tripData,
      service: trip.tripData.service,
      driver: trip.tripData.driver,
      typeCar: trip.tripData.carType,
      isSubmittingBooking: trip.isSubmittingBooking,
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
      routeMarkers,
      markerVisible,
      // During pin dragging, render the address belonging to the current drag
      // request. The shared geocoder label can still contain the previous
      // location while reverse geocoding is in flight, which made the marker
      // label look unchanged after moving the map.
      markerCity: markerVisible
        ? (locationSelection.pendingDragLocation.address || 'Carregando...')
        : geocoding.markerCity,
      mapDirections: routing.directions,
      currentRoute: routing.currentRoute,
      carsAround: drivers.carsAround,
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
      canGoBackBottomSheet: bottomSheetHistoryRef.current.length > 1 || activeBottomSheet === 'dragMarker',
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
      handleBottomSheetDismiss,
      getAddressFromCoordinates: geocoding.getAddressFromCoordinates,
    },
  };
};
