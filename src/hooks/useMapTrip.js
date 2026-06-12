import { useState, useCallback, useRef, useEffect } from 'react';
import { useLogger } from './useLogger';
import api from '../services/APIService';
import ErrorService from '../services/ErrorService';
import { SEARCH_TIMER_DURATION_S, DRIVER_ARRIVAL_THRESHOLD_KM, DRIVER_MOVE_THRESHOLD_M } from '../constants/config';

const DEFAULT_TIMER_DURATION = SEARCH_TIMER_DURATION_S;

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
}) => {
  const logger = useLogger('useMapTrip');

  const [tripData, setTripData] = useState({
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
  });

  const [timer, setTimer] = useState(DEFAULT_TIMER_DURATION);
  const [isActive, setIsActive] = useState(false);
  const noDriverAlertShownRef = useRef(false);

  const updateTripData = useCallback((updates) => {
    setTripData((prev) => ({ ...prev, ...updates }));
  }, []);

  // Timer helpers
  const startTimer = useCallback(() => setIsActive(true), []);

  const resetTimer = useCallback(() => {
    setIsActive(false);
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
  const showNoDriverAlert = useCallback(() => {
    setTripData((current) => {
      if (current.driver || current.driverConnected) {
        logger.info('Driver already connected, skipping no driver alert');
        return current;
      }
      if (noDriverAlertShownRef.current) {
        logger.info('noDriver alert already shown, skipping');
        return current;
      }
      noDriverAlertShownRef.current = true;
      setIsActive(false);

      showAlert({
        type: 'warning',
        title: 'Não há um motorista disponível',
        message: 'Tente novamente mais tarde',
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
              presentBottomSheet('payment');
            },
          },
        ],
      });
      return current;
    });
  }, [showAlert, presentBottomSheet, resetTimer, onResetRef]);

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
    showNoDriverAlert();
  }, [showNoDriverAlert]);

  const handleDriverConnect = useCallback((driverLocation, coords) => {
    logger.debug('Map markers set', { coords });
    setMapMarkers([driverLocation, coords]);
    updateTripData({ status: 'assigned' });
  }, [setMapMarkers, updateTripData]);

  const handleDriverConnected = useCallback((data) => {
    try {
      logger.info('Socket event: driverConnected', data);
      resetTimer();
      if (data?.location && data?.service?.pickup) {
        updateTripData({ driverConnected: true, driver: data.driver });
        setDriverLocation(data.location);
        handleDriverConnect(data.location, data.service.pickup);
      }
    } catch (error) {
      logger.error('Error handling driverConnected event', error);
    }
  }, [resetTimer, updateTripData, setDriverLocation, handleDriverConnect]);

  const handleDriverLocation = useCallback((data) => {
    try {
      if (!data?.service || !data?.location) return;
      const { service, location } = data;
      setDriverLocation(location);

      setTripData((current) => {
        const lastLoc = current._lastDriverLocation;
        const movedDistance = lastLoc ? getDistanceInKm(lastLoc, location) * 1000 : Infinity;

        if (movedDistance > DRIVER_MOVE_THRESHOLD_M && routeCoordinates?.length > 0) {
          const sliced = getSlicedRoute(location, routeCoordinates);
          updateCurrentRoute(sliced);
        }

        switch (service.status) {
          case 1: {
            const newMarkers = [location, service.pickupLocation];
            setMapMarkers(newMarkers);
            if (serviceStatus) setServiceStatus(null);

            const distance = getDistanceInKm(service.pickupLocation, location);
            if (distance < DRIVER_ARRIVAL_THRESHOLD_KM && !current.driverArrived) {
              logger.info('Driver arrived at pickup location');
              setDirections(null);
              if (!current.detailsInfo?.isViewingDetails) {
                presentBottomSheet('driverArriving');
              }
              return { ...current, driverArrived: true, _lastDriverLocation: location };
            }
            break;
          }
          case 2: {
            setMapMarkers([location, service.dropoffLocation]);
            break;
          }
        }
        return { ...current, _lastDriverLocation: location };
      });
    } catch (error) {
      logger.error('Error handling driverLocation event', error);
    }
  }, [getDistanceInKm, getSlicedRoute, routeCoordinates, updateCurrentRoute, setDriverLocation, setMapMarkers, setDirections, serviceStatus, setServiceStatus, presentBottomSheet]);

  const handleServiceAccepted = useCallback((data) => {
    try {
      logger.info('Socket event: serviceAccepted', data);
      updateTripData({ status: 'assigned' });
      resetTimer();
      presentBottomSheet('tripStarted');
    } catch (error) {
      logger.error('Error handling serviceAccepted event', error);
    }
  }, [updateTripData, resetTimer, presentBottomSheet]);

  const handleDriverDeclined = useCallback((data) => {
    try {
      logger.info('Socket event: driverDeclined', data);
      const { idUser, idService, userLocation: driverUserLocation } = data;
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
  }, [socket]);

  const handleServiceStarted = useCallback((data) => {
    try {
      if (data?.status === 'in-progress') {
        setTripData((current) => {
          if (!current.detailsInfo?.isViewingDetails) {
            presentBottomSheet('tripEnding');
          }
          return { ...current, status: 'in-progress' };
        });
      }
    } catch (error) {
      logger.error('Error handling serviceStarted event', error);
    }
  }, [presentBottomSheet]);

  const handleServiceEnded = useCallback((data) => {
    try {
      if (data?.status === 'completed') {
        dismissAllBottomSheets();
        updateModal('confirmation', true);
        logger.info('Trip completed', { userId: user?.id });
      }
    } catch (error) {
      logger.error('Error handling serviceEnded event', error);
    }
  }, [dismissAllBottomSheets, updateModal, user?.id]);

  const handleServiceCancelled = useCallback((data) => {
    try {
      logger.info('Socket event: serviceCancelled', data);
      showAlert({
        type: 'error',
        title: 'Serviço cancelado',
        message: 'O motorista cancelou o serviço',
        buttons: [{ text: 'OK', onPress: () => onResetRef.current?.() }],
      });
    } catch (error) {
      logger.error('Error handling serviceCancelled event', error);
    }
  }, [showAlert, onResetRef]);

  const handleMessage = useCallback((messages) => {
    try {
      if (!messages?.length) return;
      const currentCount = messages.length;
      const previousCount = lastMessageCountRef.current;
      if (currentCount > previousCount) {
        const newMessages = messages.slice(previousCount);
        handleIncomingMessages(newMessages, user, modalChatOpen);
        lastMessageCountRef.current = currentCount;
      }
    } catch (error) {
      logger.error('Error handling message event', error);
    }
  }, [user, modalChatOpen, handleIncomingMessages, lastMessageCountRef]);

  // Payment / booking
  const handleConfirmPaymentPress = useCallback((payment_type) => async () => {
    if (!socket?.connected) {
      logger.warn('Socket not connected');
      showAlert({
        type: 'error',
        title: 'Sem conexão',
        message: 'Não há conexão com o servidor.',
      });
      return;
    }

    logger.info('Confirm Payment', { carType: tripData.carType });
    presentBottomSheet('rideSearch');
    startTimer();

    try {
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
      };

      const resp = await api.post('/service/', requestData);
      logger.info('Service request successful', { serviceId: resp.data?._id });
      updateTripData({ service: resp.data });

      if (socket?.connected) {
        socket.emit('chooseBestDriver', {
          idService: resp.data._id,
          userLocation: [markers[0].longitude, markers[0].latitude],
          idUser: user.id,
        });
      }
      return resp.data;
    } catch (error) {
      ErrorService.handleAPIError(error);
      return null;
    }
  }, [socket, user, originCity, destinationCity, markers, tripData, presentBottomSheet, startTimer, updateTripData, showAlert]);

  // Cancel helpers
  const onConfirmCancelSearch = useCallback((complaints) => {
    logger.info('Canceling search', { serviceId: tripData.service?._id });
    if (socket?.connected) {
      socket.emit('searchCancel', { idService: tripData.service._id, complaints });
    }
    onResetRef.current?.();
  }, [socket, tripData.service, onResetRef]);

  const onConfirmCancelTrip = useCallback((complaints) => {
    logger.info('Canceling trip', { serviceId: tripData.service?._id });
    if (tripData.service && socket?.connected) {
      socket.emit('serviceCancel', { idService: tripData.service._id, complaints });
    }
  }, [socket, tripData.service]);

  const handleCancelSearch = useCallback(() => {
    const complaints = { title: 'Search Cancellation', description: 'User cancelled the search', idUser: user.id };
    onConfirmCancelSearch(complaints);
    resetTimer();
  }, [user, onConfirmCancelSearch, resetTimer]);

  const handleCancelTrip = useCallback((question) => {
    const complaints = { title: 'Cancelled by user', description: question, idUser: user.id };
    onConfirmCancelTrip(complaints);
    resetTimer();
  }, [user, onConfirmCancelTrip, resetTimer]);

  const handleCancelAlert = useCallback(() => {
    showAlert({
      type: 'info',
      title: 'VIAGEM CANCELADA',
      message: 'O motivo de cancelamento foi levado em consideração!',
      buttons: [{ text: 'OK', onPress: () => onResetRef.current?.() }],
    });
  }, [showAlert, onResetRef]);

  const handlePressQuestion = useCallback((question) => {
    handleCancelTrip(question);
    updateModal('cancel', false);
    handleCancelAlert();
  }, [handleCancelTrip, updateModal, handleCancelAlert]);

  // Countdown timer — owned here since we have isActive, socket, and showNoDriverAlert
  const showNoDriverAlertRef = useRef(showNoDriverAlert);
  useEffect(() => { showNoDriverAlertRef.current = showNoDriverAlert; });

  const hasService = !!tripData.service;
  useEffect(() => {
    if (!isActive || !hasService) return;
    const interval = setInterval(() => {
      setTimer((prev) => {
        if (prev <= 0) return 0;
        const next = prev - 1;
        if (next === 0) {
          setIsActive(false);
          showNoDriverAlertRef.current?.();
        }
        return next;
      });
    }, 1000);
    return () => clearInterval(interval);
  }, [isActive, hasService]);

  // Trip data resets (called by composition root's resetToInitialState)
  const resetTripData = useCallback(() => {
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
    handleDriverConnected,
    handleDriverLocation,
    handleDriverConnect,
    handleServiceAccepted,
    handleDriverDeclined,
    handleServiceStarted,
    handleServiceEnded,
    handleServiceCancelled,
    handleMessage,
    // User-initiated handlers
    handleConfirmPaymentPress,
    handleCancelSearch,
    handleCancelTrip,
    handlePressQuestion,
    onConfirmCancelSearch,
    onConfirmCancelTrip,
    showNoDriverAlert,
  };
};
