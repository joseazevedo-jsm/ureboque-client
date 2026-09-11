import { useState, useCallback, useRef, useEffect } from 'react';
import { useLogger } from './useLogger';
import api from '../services/APIService';
import ErrorService from '../services/ErrorService';
import { SEARCH_TIMER_DURATION_S, DRIVER_ARRIVAL_THRESHOLD_KM, DRIVER_MOVE_THRESHOLD_M } from '../constants/config';
import { getTripStatusFromDriverLeg } from '../utils/serviceState';
import { acceptsTripSnapshot, reduceTripSnapshot } from '../utils/tripSnapshot';

const DEFAULT_TIMER_DURATION = SEARCH_TIMER_DURATION_S;
const CANCEL_ACK_TIMEOUT_MS = 8000;
const isValidCoordinate = (point) => Number.isFinite(point?.latitude) && Number.isFinite(point?.longitude);

// Guards against stale/out-of-order/foreign-trip socket events: a snapshot is
// only applied if it carries a version newer than what we've already seen,
// and (when we already know the trip's serviceId) belongs to that same trip.
function isSnapshotAccepted(currentServiceId, currentVersion, snapshot) {
  if (!snapshot || !Number.isFinite(snapshot.version)) return false;
  if (currentServiceId && snapshot.serviceId && snapshot.serviceId !== currentServiceId) return false;
  if (currentVersion != null && snapshot.version <= currentVersion) return false;
  return true;
}

export const useMapTrip = ({
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
  modalChatOpen,
  onResetRef,           // useRef pointing to the composition root's resetToInitialState
  onBookingUncertainRef, // useRef pointing to the composition root's reconcileTrip
  setMapMarkers,        // (markers) => void  — updates markers in composition root
  setDriverLocation,    // from useMapDrivers
  updateCurrentRoute,   // from useMapRouting
  routeCoordinates,     // from useMapRouting
  getDistanceInKm,      // from useMapRouting
  getSlicedRoute,       // from useMapRouting
  setDirections,        // from useMapRouting
  serviceStatus,
  setServiceStatus,
  fetchPrices,
  setOriginCity,
  setDestinationCity,
  removeDiscount,
}) => {
  const logger = useLogger('useMapTrip');
  const mountedRef = useRef(true);
  useEffect(() => () => { mountedRef.current = false; }, []);

  const [tripData, rawSetTripData] = useState({
    carType: 'Turismo',
    price: '25,300',
    brand: 'Toyota',
    model: 'Corolla',
    license: 'LD-SOM',
    color: 'Preto',
    duration: null,
    inputLocationObject: null,
    service: null,
    driver: null,
    driverConnected: false,
    detailsInfo: null,
    status: null,
    driverArrived: false,
    _lastDriverLegStatus: null,
    _version: null,
  });

  const tripDataRef = useRef(tripData);
  // Synchronous gate: two socket events in one render still see the latest version.
  const setTripData = useCallback((update) => {
    const next = typeof update === 'function' ? update(tripDataRef.current) : update;
    tripDataRef.current = next;
    rawSetTripData(next);
  }, []);
  const [timer, setTimer] = useState(DEFAULT_TIMER_DURATION);
  const [isActive, setIsActive] = useState(false);
  const timerRef = useRef(DEFAULT_TIMER_DURATION);
  const noDriverAlertShownRef = useRef(false);
  const tripStatusRef = useRef(null);
  const tripServiceIdRef = useRef(null);
  const lastDriverLocationRef = useRef(null);
  const lastDriverPacketRef = useRef(null);
  const lastMapMarkerUpdateRef = useRef(0);
  const lastMapMarkerLegRef = useRef(null);
  // Remembers the payment method the user picked so a retry after "no driver
  // available" can resubmit directly instead of re-asking for it.
  const lastPaymentTypeRef = useRef(null);
  const confirmPaymentPressRef = useRef(null);

  const updateTripData = useCallback((updates) => {
    setTripData((prev) => ({ ...prev, ...updates }));
  }, []);

  useEffect(() => {
    tripStatusRef.current = tripData.status;
    tripServiceIdRef.current = tripData.service?._id || null;
  }, [tripData.status, tripData.service?._id]);

  // Timer helpers
  const startTimer = useCallback(() => setIsActive(true), []);

  const resetTimer = useCallback(() => {
    setIsActive(false);
    timerRef.current = DEFAULT_TIMER_DURATION;
    setTimer(DEFAULT_TIMER_DURATION);
  }, []);

  const formatTime = useCallback((time) => {
    const minutes = Math.floor(time / 60);
    const seconds = time % 60;
    return `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
  }, []);

  const formatDuration = useCallback((minutes) => {
    const hours = Math.floor(minutes / 60);
    const remaining = Math.floor(minutes % 60);
    return hours > 0 ? `${hours} h ${remaining} mins` : `${remaining} mins`;
  }, []);

  const calculateProgress = useCallback(() => timer / DEFAULT_TIMER_DURATION, [timer]);

  // No-driver alert (shared by socket noDriver event and timer timeout)
  const showNoDriverAlert = useCallback((reason = 'no_drivers') => {
    if (noDriverAlertShownRef.current) {
      logger.info('noDriver alert already shown, skipping');
      return;
    }
    noDriverAlertShownRef.current = true;
    setIsActive(false);
    showAlert({
        type: 'warning',
        title: reason === 'no_drivers' ? 'Não há um motorista disponível' : 'Não foi possível concluir a busca',
        message: reason === 'no_drivers' ? 'Tente novamente mais tarde' : 'A busca terminou sem confirmação. Pode tentar novamente.',
        buttons: [
          {
            text: 'Cancelar',
            style: 'cancel',
            onPress: () => {
              noDriverAlertShownRef.current = false;
              onResetRef.current?.();
            },
          },
          {
            text: 'Tentar de novo',
            onPress: () => {
              noDriverAlertShownRef.current = false;
              setTripData((prev) => ({ ...prev, service: null, status: null }));
              resetTimer();
              if (lastPaymentTypeRef.current && confirmPaymentPressRef.current) {
                confirmPaymentPressRef.current(lastPaymentTypeRef.current)();
              } else {
                presentBottomSheet('payment');
              }
            },
          },
        ],
    });
    setTripData((current) => ({
      ...current,
      service: null,
      driver: null,
      driverConnected: false,
      status: null,
    }));
  }, [showAlert, presentBottomSheet, resetTimer, onResetRef, tripData.service?._id, tripData.driverConnected, tripData.status]);

  // The 180s countdown is only a local estimate — its expiry must reconcile
  // with the server before declaring "no driver" (fixing: a slow-but-alive
  // match, or a driver that connected right as the timer hit zero, must not
  // be reported to the user as a failed search).
  const handleSearchTimeout = useCallback(async () => {
    // A local countdown never declares an outcome. Recover the authoritative request.
    await onBookingUncertainRef?.current?.();
    if (['requested', 'flagged', 'connecting'].includes(tripDataRef.current.service?.status)) {
      timerRef.current = 15;
      setTimer(15);
      setIsActive(true);
    }
  }, [onBookingUncertainRef]);

  // Socket event handlers
  const handleBestDriver = useCallback((data) => {
    try {
      logger.info('Socket event: bestDriver', data);
    } catch (error) {
      logger.error('Error handling bestDriver event', error);
    }
  }, []);

  const handleNoDriver = useCallback(() => {
    logger.info('Socket event: noDriver');
    onBookingUncertainRef?.current?.();
  }, [onBookingUncertainRef]);

  const handleDriverConnect = useCallback((driverLocation, coords) => {
    if (!isValidCoordinate(driverLocation) || !isValidCoordinate(coords)) return;
    logger.debug('Map markers set', { coords });
    setMapMarkers([driverLocation, coords]);
    if (!['assigned', 'in-progress', 'completed'].includes(tripStatusRef.current)) {
      updateTripData({ status: 'connecting' });
    }
  }, [setMapMarkers, updateTripData]);

  const handleDriverConnected = useCallback((data) => {
    try {
      logger.info('Socket event: driverConnected', data);
      const incomingServiceId = data?.service?.id || data?.service?._id;
      const serviceId = incomingServiceId || tripData.service?._id;
      if (!tripData.service?._id && !incomingServiceId) return;
      if (incomingServiceId && !tripData.service?._id) return;
      const isForeignTrip = tripData.service?._id && incomingServiceId && incomingServiceId !== tripData.service._id;
      if (isForeignTrip) return;
      if (!isValidCoordinate(data?.location) || !isValidCoordinate(data?.service?.pickup)) return;
      if (serviceId && socket?.connected) {
        socket.emit('join', `service-request-${serviceId}`);
      }
      resetTimer();
      const nextStatus = ['assigned', 'in-progress', 'completed'].includes(tripStatusRef.current)
        ? tripStatusRef.current
        : 'connecting';
      updateTripData({ driverConnected: true, driver: data.driver, status: nextStatus });
      setDriverLocation(data.location);
      handleDriverConnect(data.location, data.service.pickup);
    } catch (error) {
      logger.error('Error handling driverConnected event', error);
    }
  }, [resetTimer, updateTripData, setDriverLocation, handleDriverConnect, socket, tripData.service?._id]);

  const handleDriverLocation = useCallback((data) => {
    const current = tripDataRef.current;
    const incomingId = data?.service?.id || data?.service?._id;
    if (!current.service?._id || incomingId !== current.service._id ||
        !['connecting', 'assigned', 'in-progress'].includes(current.status) ||
        !isValidCoordinate(data?.location)) return;
    const location = data.location;
    setDriverLocation(location);
    const moved = lastDriverLocationRef.current ? getDistanceInKm(lastDriverLocationRef.current, location) * 1000 : Infinity;
    if (moved > DRIVER_MOVE_THRESHOLD_M && routeCoordinates?.length) {
      updateCurrentRoute(getSlicedRoute(location, routeCoordinates));
    }
    const pickup = current.service.locations?.[0]?.coordinates;
    const destination = current.service.locations?.[current.status === 'in-progress' ? 1 : 0]?.coordinates;
    // Publish live coordinates here; the composition root independently gates
    // paid route requests against the last requested origin, not the last packet.
    if (isValidCoordinate(destination)) {
      setMapMarkers([location, destination]);
      lastMapMarkerUpdateRef.current = Date.now();
      lastMapMarkerLegRef.current = current.status;
    }
    lastDriverLocationRef.current = location;
    // Telemetry may update arrival presentation, never the service lifecycle.
    if (current.status === 'assigned' && !current.driverArrived && isValidCoordinate(pickup) &&
        getDistanceInKm(pickup, location) < DRIVER_ARRIVAL_THRESHOLD_KM) {
      updateTripData({ driverArrived: true });
      setDirections(null);
      if (!current.detailsInfo?.isViewingDetails) presentBottomSheet('driverArriving');
    }
  }, [setDriverLocation, getDistanceInKm, routeCoordinates, updateCurrentRoute, getSlicedRoute,
      setMapMarkers, updateTripData, setDirections, presentBottomSheet]);

  const handleServiceAccepted = useCallback((data) => {
    try {
      logger.info('Socket event: serviceAccepted', data);
      const snapshot = { serviceId: data?.service?._id, version: data?.service?.version };
      if (!snapshot.serviceId || !Number.isFinite(snapshot.version)) {
        logger.info('Ignoring malformed serviceAccepted event', snapshot);
        return;
      }
      if (!isSnapshotAccepted(tripData.service?._id, tripData._version, snapshot)) {
        logger.info('Ignoring stale/mismatched serviceAccepted event', snapshot);
        return;
      }
      setTripData((current) => {
        if (!isSnapshotAccepted(current.service?._id, current._version, snapshot)) {
          return current;
        }
        return {
          ...current,
          status: 'assigned',
          service: data?.service || current.service,
          driver: data?.driverDetails || current.driver,
          driverConnected: true,
          _version: snapshot.version,
        };
      });
      if (socket?.connected) {
        socket.emit('join', `service-request-${snapshot.serviceId}`);
      }
      resetTimer();
      presentBottomSheet('tripStarted');
    } catch (error) {
      logger.error('Error handling serviceAccepted event', error);
    }
  }, [resetTimer, presentBottomSheet, socket, tripData.service?._id, tripData._version]);

  const handleDriverDeclined = useCallback((data) => {
    try {
      logger.info('Socket event: driverDeclined', data);
      const { idUser, idService, userLocation: driverUserLocation, version } = data;
      const snapshot = { serviceId: idService, version };
      if (!idService || !Number.isFinite(version) || (!data?.rematching && !isValidCoordinate(driverUserLocation))) {
        logger.info('Ignoring malformed driverDeclined event', snapshot);
        return;
      }
      if (!tripData.service?._id) {
        logger.info('Ignoring driverDeclined without active trip', snapshot);
        return;
      }
      if (!isSnapshotAccepted(tripData.service?._id, tripData._version, snapshot)) {
        logger.info('Ignoring stale/mismatched driverDeclined event', snapshot);
        return;
      }
      setTripData((current) => {
        if (!isSnapshotAccepted(current.service?._id, current._version, snapshot)) {
          return current;
        }
        return { ...current, driverConnected: false, driver: null, status: 'requested', _version: snapshot.version };
      });
      startTimer();
      presentBottomSheet('rideSearch');
      if (data?.rematching) return;
      const { longitude, latitude } = driverUserLocation;
      if (socket?.connected) {
        socket.emit('chooseBestDriver', {
          idUser,
          idService,
          userLocation: [longitude, latitude],
        });
      }
    } catch (error) {
      logger.error('Error handling driverDeclined event', error);
    }
  }, [socket, startTimer, presentBottomSheet, tripData.service?._id, tripData._version]);

  const handleDriverTimeout = useCallback((data) => {
    try {
      logger.info('Socket event: driverTimeout', data);
      const snapshot = { serviceId: data?.idService, version: data?.version };
      if (!snapshot.serviceId || !Number.isFinite(snapshot.version)) {
        logger.info('Ignoring malformed driverTimeout event', snapshot);
        return;
      }
      if (!tripData.service?._id) {
        logger.info('Ignoring driverTimeout without active trip', snapshot);
        return;
      }
      if (!isSnapshotAccepted(tripData.service?._id, tripData._version, snapshot)) {
        logger.info('Ignoring stale/mismatched driverTimeout event', snapshot);
        return;
      }
      setTripData((current) => {
        if (!isSnapshotAccepted(current.service?._id, current._version, snapshot)) {
          return current;
        }
        return { ...current, driverConnected: false, driver: null, status: 'requested', _version: snapshot.version };
      });
      startTimer();
      presentBottomSheet('rideSearch');
    } catch (error) {
      logger.error('Error handling driverTimeout event', error);
    }
  }, [startTimer, presentBottomSheet, tripData.service?._id, tripData._version]);

  const handleServiceStarted = useCallback((data) => {
    try {
      if (data?.status !== 'in-progress') return;
      const snapshot = { serviceId: data?.idService, version: data?.version };
      if (!snapshot.serviceId || !Number.isFinite(snapshot.version)) {
        logger.info('Ignoring malformed serviceStarted event', snapshot);
        return;
      }
      if (!tripData.service?._id) {
        logger.info('Ignoring serviceStarted without active trip', snapshot);
        return;
      }
      if (!isSnapshotAccepted(tripData.service?._id, tripData._version, snapshot)) {
        logger.info('Ignoring stale/mismatched serviceStarted event', snapshot);
        return;
      }
      const shouldShowTripEnding = !tripData.detailsInfo?.isViewingDetails;
      setTripData((current) => {
        if (!isSnapshotAccepted(current.service?._id, current._version, snapshot)) {
          return current;
        }
        return { ...current, status: 'in-progress', _version: snapshot.version };
      });
      if (shouldShowTripEnding) presentBottomSheet('tripEnding');
    } catch (error) {
      logger.error('Error handling serviceStarted event', error);
    }
  }, [presentBottomSheet, tripData.service?._id, tripData._version, tripData.detailsInfo?.isViewingDetails]);

  const handleServiceEnded = useCallback((data) => {
    try {
      logger.info('[DEBUG] serviceEnded received', { data, discountState: user?.discount });
      if (data?.status !== 'completed') return;
      const snapshot = { serviceId: data?.idService, version: data?.version };
      if (!snapshot.serviceId || !Number.isFinite(snapshot.version)) {
        logger.info('Ignoring malformed serviceEnded event', snapshot);
        return;
      }
      if (!tripData.service?._id) {
        logger.info('Ignoring serviceEnded without active trip', snapshot);
        return;
      }
      if (tripData.status === 'completed' || !isSnapshotAccepted(tripData.service?._id, tripData._version, snapshot)) {
        logger.info('Ignoring stale/mismatched serviceEnded event', snapshot);
        return;
      }
      setTripData((current) => {
        // current.status guard makes this idempotent: a duplicate/retried
        // serviceEnded can never trigger a second discount removal below.
        if (current.status === 'completed' || !isSnapshotAccepted(current.service?._id, current._version, snapshot)) {
          return current;
        }
        return { ...current, status: 'completed', detailsInfo: null, _version: snapshot.version };
      });
      dismissAllBottomSheets();
      updateModal('confirmation', true);
      logger.info('[DEBUG] discount check', { active: user?.discount?.active, code: user?.discount?.promotion?.code });
      if (user?.discount?.active) {
        removeDiscount(user.discount.promotion.code);
      }
    } catch (error) {
      logger.error('Error handling serviceEnded event', error);
    }
  }, [dismissAllBottomSheets, updateModal, user, removeDiscount, tripData.status, tripData.service?._id, tripData._version]);

  const handleServiceCancelled = useCallback((data) => {
    try {
      logger.info('Socket event: serviceCancelled', data);
      const snapshot = { serviceId: data?.idService, version: data?.version };
      if (!snapshot.serviceId || !Number.isFinite(snapshot.version)) {
        logger.info('Ignoring malformed serviceCancelled event', snapshot);
        return;
      }
      if (!tripData.service?._id) {
        logger.info('Ignoring serviceCancelled without active trip', snapshot);
        return;
      }
      if (!isSnapshotAccepted(tripData.service?._id, tripData._version, snapshot)) {
        logger.info('Ignoring stale/mismatched serviceCancelled event', snapshot);
        return;
      }
      onResetRef.current?.();
      showAlert({
        type: 'error',
        title: 'Serviço cancelado',
        message: 'O motorista cancelou o serviço',
        buttons: [{ text: 'OK' }],
      });
    } catch (error) {
      logger.error('Error handling serviceCancelled event', error);
    }
  }, [showAlert, onResetRef, tripData.service?._id, tripData._version]);

  const handleServiceSnapshot = useCallback((payload, options = {}) => {
    const service = payload?.service;
    const current = tripDataRef.current;
    const currentForSnapshot = options.hydrate
      ? { ...current, service: current.service || { _id: service?._id }, _version: null }
      : current;
    if (!options.hydrate && !acceptsTripSnapshot(currentForSnapshot, service)) return false;
    if (options.hydrate && (!service?._id || (current.service?._id && current.service._id !== service._id))) return false;
    if (service.status === 'completed') {
      setTripData({ ...currentForSnapshot, service, status: 'completed', _version: service.version, detailsInfo: null });
      resetTimer();
      dismissAllBottomSheets();
      updateModal('confirmation', true);
      return true;
    }
    setTripData(reduceTripSnapshot(currentForSnapshot, service));
    if (service.status === 'cancelled') {
      resetTimer();
      if (['no_drivers', 'search_timeout', 'invalid_location'].includes(service.terminalReason)) {
        presentBottomSheet('payment');
        showNoDriverAlert(service.terminalReason);
      } else onResetRef.current?.();
      return true;
    }
    noDriverAlertShownRef.current = false;
    if (['requested', 'flagged', 'connecting'].includes(service.status)) {
      const deadline = service.offerDeadline || service.searchDeadline;
      const remaining = deadline ? Math.max(1, Math.ceil((new Date(deadline).getTime() - Date.now()) / 1000)) : DEFAULT_TIMER_DURATION;
      timerRef.current = remaining;
      setTimer(remaining);
      startTimer();
      presentBottomSheet('rideSearch');
    } else {
      resetTimer();
      if (!current.detailsInfo?.isViewingDetails) presentBottomSheet(service.status === 'assigned' ? 'tripStarted' : 'tripEnding');
    }
    return true;
  }, [resetTimer, startTimer, presentBottomSheet, showNoDriverAlert, onResetRef, dismissAllBottomSheets, updateModal]);

  const normalizeMessages = useCallback((payload) => (
    Array.isArray(payload) ? payload : payload?.messages || []
  ), []);

  const handleMessage = useCallback((payload, meta = {}) => {
    try {
      if (meta.chatRoomId && tripData.service?._id && meta.chatRoomId !== tripData.service._id) return;
      const messages = normalizeMessages(payload);
      if (!messages?.length) return;
      const currentCount = messages.length;
      const previousCount = lastMessageCountRef.current;
      if (modalChatOpen) {
        lastMessageCountRef.current = currentCount;
        return;
      }
      if (currentCount > previousCount) {
        const newMessages = messages.slice(previousCount);
        handleIncomingMessages(newMessages, user, modalChatOpen);
        lastMessageCountRef.current = currentCount;
      }
    } catch (error) {
      logger.error('Error handling message event', error);
    }
  }, [tripData.service?._id, normalizeMessages, lastMessageCountRef, modalChatOpen, handleIncomingMessages, user]);

  // Payment / booking
  // isSubmittingBookingRef is the synchronous guard (blocks a second tap in the
  // same tick, before React has re-rendered); isSubmittingBooking is its state
  // mirror so the UI can disable the buttons across renders.
  const isSubmittingBookingRef = useRef(false);
  const pendingBookingRef = useRef(null);
  const [isSubmittingBooking, setIsSubmittingBooking] = useState(false);

  const handleConfirmPaymentPress = useCallback((payment_type) => async () => {
    if (isSubmittingBookingRef.current) {
      logger.warn('Booking already in flight, ignoring duplicate press');
      return;
    }
    if (!user?.id || !isValidCoordinate(markers?.[0]) || !isValidCoordinate(markers?.[1])) {
      showAlert({
        type: 'error',
        title: 'Localização incompleta',
        message: 'Aguarde até que os pontos de recolha e destino estejam definidos.',
      });
      return;
    }
    isSubmittingBookingRef.current = true;
    setIsSubmittingBooking(true);
    lastPaymentTypeRef.current = payment_type;

    if (!socket?.connected) {
      logger.warn('Socket not connected');
      showAlert({
        type: 'error',
        title: 'Sem conexão',
        message: 'Não há conexão com o servidor.',
      });
      isSubmittingBookingRef.current = false;
      setIsSubmittingBooking(false);
      return;
    }

    logger.info('Confirm Payment', { carType: tripData.carType });
    presentBottomSheet('rideSearch');
    startTimer();

    try {
      // New per-attempt idempotency key: a genuine retry (e.g. "Tentar de
      // novo" after no-driver) is a new booking and gets a new key; a
      // duplicate send of THIS attempt (double-tap slipping past the ref
      // guard, a lost-then-resent response) reuses it and the server
      // returns the original service instead of creating a second one.
      const requestKey = pendingBookingRef.current?.requestKey || `${user.id}-${Date.now()}-${Math.random().toString(36).slice(2)}`;
      const requestData = {
        user: user.id,
        locations: [
          {
            name: originCity,
            coordinates: { latitude: markers[0].latitude, longitude: markers[0].longitude },
          },
          {
            name: destinationCity,
            coordinates: { latitude: markers[1].latitude, longitude: markers[1].longitude },
          },
        ],
        status: 'requested',
        user_car_details: `${tripData.brand} ${tripData.model}, ${tripData.color}, ${tripData.license}`,
        payment: {
          value: tripData.price,
          method: payment_type,
          discount: user.discount?.active ? user.discount.percentage : null,
        },
        type_car: tripData.carType,
        requestKey,
      };

      pendingBookingRef.current = pendingBookingRef.current || requestData;
      const resp = await api.post('/service/', pendingBookingRef.current, {
        headers: { 'Idempotency-Key': requestKey },
      });
      logger.info('Service request successful', { serviceId: resp.data?._id });
      pendingBookingRef.current = null;
      updateTripData({ service: resp.data, status: resp.data.status, _version: null });
      handleServiceSnapshot({ service: resp.data });

      // Matching now starts server-side right after creation (see
      // MatchingOrchestrator on the API) — the client only needs to join the
      // room to receive the result, so a lost response here can no longer
      // orphan the booking the way a client-triggered chooseBestDriver could.
      if (socket?.connected) {
        socket.emit('join', `service-request-${resp.data._id}`);
      }
      return resp.data;
    } catch (error) {
      // A response failure here does not mean the booking failed — the
      // request may have been created server-side and only the response was
      // lost. Only a definite client error (4xx, got a real answer) is safe
      // to report as "not sent"; anything else must offer to check first,
      // never a silent assumption either way.
      const uncertain = !error.response || error.response.status >= 500;
      if (uncertain) {
        showAlert({
          type: 'error',
          title: 'Ainda não confirmámos o seu pedido',
          message: 'A ligação falhou. O pedido pode ter sido recebido pelo servidor. Verifique o estado antes de pedir outro reboque.',
          buttons: [
            { text: 'Verificar pedido', onPress: () => onBookingUncertainRef?.current?.() },
            { text: 'Fechar', style: 'cancel' },
          ],
        });
      } else {
        pendingBookingRef.current = null;
        ErrorService.handleAPIError(error);
        resetTimer();
        presentBottomSheet('payment');
      }
      return null;
    } finally {
      isSubmittingBookingRef.current = false;
      setIsSubmittingBooking(false);
    }
  }, [socket, user, originCity, destinationCity, markers, tripData, presentBottomSheet, startTimer, updateTripData, showAlert, onBookingUncertainRef, handleServiceSnapshot, resetTimer]);
  confirmPaymentPressRef.current = handleConfirmPaymentPress;

  // Cancel helpers — the server ack is the only thing allowed to say
  // "cancelled"; a lost connection is reported as unconfirmed, never as success.
  const handleCancelAlert = useCallback(() => {
    showAlert({
      type: 'info',
      title: 'VIAGEM CANCELADA',
      message: 'O motivo de cancelamento foi levado em consideração!',
      buttons: [{ text: 'OK', onPress: () => onResetRef.current?.() }],
    });
  }, [showAlert, onResetRef]);

  const showCancelUnconfirmedAlert = useCallback(() => {
    showAlert({
      type: 'error',
      title: 'Ainda não confirmámos o cancelamento',
      message: 'A ligação falhou antes de recebermos a confirmação do servidor. Verifique o estado do pedido antes de tentar novamente.',
      buttons: [{ text: 'OK' }],
    });
  }, [showAlert]);

  const onConfirmCancelSearch = useCallback((complaints) => {
    const serviceId = tripData.service?._id;
    logger.info('Canceling search', { serviceId });
    if (!serviceId || !socket?.connected) {
      showCancelUnconfirmedAlert();
      return;
    }
    socket.timeout(CANCEL_ACK_TIMEOUT_MS).emit('searchCancel', { idService: serviceId, complaints }, (err, response) => {
      if (err || !response?.success) {
        logger.warn('searchCancel unconfirmed', { err, response });
        showCancelUnconfirmedAlert();
        return;
      }
      onResetRef.current?.();
    });
  }, [socket, tripData.service, onResetRef, showCancelUnconfirmedAlert]);

  const onConfirmCancelTrip = useCallback((complaints) => {
    const serviceId = tripData.service?._id;
    logger.info('Canceling trip', { serviceId });
    if (!serviceId || !socket?.connected) {
      showCancelUnconfirmedAlert();
      return;
    }
    socket.timeout(CANCEL_ACK_TIMEOUT_MS).emit('serviceCancel', { idService: serviceId, complaints }, (err, response) => {
      if (err || !response?.success) {
        logger.warn('serviceCancel unconfirmed', { err, response });
        showCancelUnconfirmedAlert();
        return;
      }
      handleCancelAlert();
    });
  }, [socket, tripData.service, showCancelUnconfirmedAlert, handleCancelAlert]);

  const handleCancelSearch = useCallback(() => {
    const complaints = { title: 'Search Cancellation', description: 'User cancelled the search', idUser: user?.id };
    onConfirmCancelSearch(complaints);
    resetTimer();
  }, [user, onConfirmCancelSearch, resetTimer]);

  const handleCancelTrip = useCallback((question) => {
    const complaints = { title: 'Cancelled by user', description: question, idUser: user?.id };
    onConfirmCancelTrip(complaints);
    resetTimer();
  }, [user, onConfirmCancelTrip, resetTimer]);

  const handlePressQuestion = useCallback((question) => {
    handleCancelTrip(question);
    updateModal('cancel', false);
  }, [handleCancelTrip, updateModal]);

  // Countdown timer — owned here since we have isActive, socket, and showNoDriverAlert
  const handleSearchTimeoutRef = useRef(handleSearchTimeout);
  useEffect(() => { handleSearchTimeoutRef.current = handleSearchTimeout; });
  useEffect(() => { timerRef.current = timer; }, [timer]);

  useEffect(() => {
    if (!isActive) return;
    const interval = setInterval(() => {
      const next = Math.max(timerRef.current - 1, 0);
      timerRef.current = next;
      setTimer(next);
      if (next === 0) {
        setIsActive(false);
        handleSearchTimeoutRef.current?.();
      }
    }, 1000);
    return () => clearInterval(interval);
  }, [isActive]);

  // Trip data resets (called by composition root's resetToInitialState)
  const resetTripData = useCallback(() => {
    lastDriverLocationRef.current = null;
    lastDriverPacketRef.current = null;
    lastMapMarkerUpdateRef.current = 0;
    lastMapMarkerLegRef.current = null;
    setTripData({
      carType: 'Turismo',
      price: '25,300',
      brand: 'Toyota',
      model: 'Corolla',
      license: 'LD-SOM',
      color: 'Preto',
      duration: null,
      inputLocationObject: null,
      service: null,
      driver: null,
      driverConnected: false,
      detailsInfo: null,
      status: null,
      driverArrived: false,
      _lastDriverLegStatus: null,
      _version: null,
    });
    resetTimer();
    noDriverAlertShownRef.current = false;
  }, [resetTimer]);

  return {
    tripData,
    updateTripData,
    timer,
    setTimer,
    isActive,
    setIsActive,
    startTimer,
    resetTimer,
    formatTime,
    formatDuration,
    calculateProgress,
    resetTripData,
    // Socket event handlers (registered in composition root)
    handleBestDriver,
    handleNoDriver,
    handleServiceSnapshot,
    tripDataRef,
    handleDriverConnected,
    handleDriverLocation,
    handleDriverConnect,
    handleServiceAccepted,
    handleDriverDeclined,
    handleDriverTimeout,
    handleServiceStarted,
    handleServiceEnded,
    handleServiceCancelled,
    handleMessage,
    // User-initiated handlers
    handleConfirmPaymentPress,
    isSubmittingBooking,
    handleCancelSearch,
    handleCancelTrip,
    handlePressQuestion,
    onConfirmCancelSearch,
    onConfirmCancelTrip,
    showNoDriverAlert,
  };
};
