import React, { createContext, useContext, useState, useEffect, useCallback, useMemo, useRef } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import api from '../services/APIService';
import { useAuth } from './AuthContext';
import { useLogger } from '../hooks/useLogger';
import ErrorService from '../services/ErrorService';
import {
  SERVICES_PAGE_LIMIT,
  getPromotionErrorMessage,
  isRecoverableActiveService,
  normalizeNotification,
} from './userDataHelpers';

const UserDataContext = createContext();

export const useUserData = () => {
  const context = useContext(UserDataContext);
  if (!context) {
    throw new Error('useUserData must be used within a UserDataProvider');
  }
  return context;
};

export const UserDataProvider = ({ children }) => {
  const logger = useLogger('UserDataContext');
  const { userToken, isAuthenticated } = useAuth();
  const [user, setUser] = useState(null);
  const [prices, setPrices] = useState(null);
  const [services, setServices] = useState([]);
  const [serviceStatus, setServiceStatus] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [servicesLoading, setServicesLoading] = useState(false);
  const [servicesPage, setServicesPage] = useState(1);
  const [servicesHasMore, setServicesHasMore] = useState(false);
  const [servicesLoadedUserId, setServicesLoadedUserId] = useState(null);
  const [notifications, setNotifications] = useState([]);
  const mountedRef = useRef(true);
  const sessionGenerationRef = useRef(0);
  const actionsRef = useRef({});
  const pricesRequestRef = useRef(null);
  const previousSessionKeyRef = useRef(null);

  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
      sessionGenerationRef.current += 1;
    };
  }, []);

  const fetchUserById = async (userId) => {
    const requestGeneration = sessionGenerationRef.current;
    if (!userId || !mountedRef.current || !isAuthenticated) return;
    const timer = logger.startTimer('fetch_user_by_id');
    logger.logApiRequest('GET', `/users/${userId}`);

    try {
      setIsLoading(true);
      logger.logStateChange('isLoading', false, true, 'fetch_user_started');

      const response = await api.get(`/users/${userId}`);
      const data = response.data;

      logger.logApiResponse('GET', `/users/${userId}`, response.status, data, timer.end());
      if (!mountedRef.current || requestGeneration !== sessionGenerationRef.current || !isAuthenticated) return;
      setUser(data);
      logger.logStateChange('user', null, 'loaded', 'user_data_fetched');

    } catch (error) {
      logger.logError(error, { operation: 'fetchUserById', userId });
    } finally {
      if (mountedRef.current && requestGeneration === sessionGenerationRef.current) {
        setIsLoading(false);
      }
      logger.logStateChange('isLoading', true, false, 'fetch_user_finished');
    }
  };

  const fetchPrices = async () => {
    const requestGeneration = sessionGenerationRef.current;
    if (!mountedRef.current || !isAuthenticated) return;
    if (pricesRequestRef.current) return pricesRequestRef.current;

    const request = (async () => {
    try {
      const response = await api.get("/prices/all");
      logger.info('UserDataContext', 'Prices fetched successfully', response.data);
      const data = response.data;
      if (mountedRef.current && requestGeneration === sessionGenerationRef.current && isAuthenticated) {
        setPrices(data);
      }
    } catch (error) {
      logger.error('Error fetching prices', error.response?.data?.error);
    } finally {
      if (pricesRequestRef.current === request) pricesRequestRef.current = null;
    }
    })();
    pricesRequestRef.current = request;
    return request;
  };

  const saveUserFavouriteAddress = async (place) => {
    const requestGeneration = sessionGenerationRef.current;
    const userId = user?.id || user?._id;
    if (!userId || !isAuthenticated || !place || typeof place !== 'object') return;
    const timer = logger.startTimer('save_favourite_address');
    logger.info('Saving favourite address', { placeName: place.name, userId });
    logger.logApiRequest('PUT', `/users/${userId}/places`, place);

    try {
      const response = await api.put(`/users/${userId}/places`, place);
      logger.logApiResponse('PUT', `/users/${userId}/places`, response.status, response.data, timer.end());
      if (!mountedRef.current || requestGeneration !== sessionGenerationRef.current || !isAuthenticated) return;

      setUser((prevState) => ({
        ...prevState,
        saved_places: response.data.saved_places,
      }));

      logger.info('Favourite address saved successfully', {
        placeName: place.name,
        totalSavedPlaces: response.data.saved_places?.length
      });
    } catch (error) {
      ErrorService.handleAPIError(error, true, 'UserDataContext');
      logger.logError(error, { operation: 'saveUserFavouriteAddress', place });
    }
  };

  const removeUserFavouriteAddress = async (placeId) => {
    const requestGeneration = sessionGenerationRef.current;
    const userId = user?.id || user?._id;
    if (!userId || !isAuthenticated || !placeId) return;
    try {
      const response = await api.delete(`/users/${userId}/places/${placeId}`);
      if (!mountedRef.current || requestGeneration !== sessionGenerationRef.current || !isAuthenticated) return;

      logger.info('Delete API response received', response.data);

      // Check if response has the expected structure
      if (response.data && response.data.saved_places) {
        setUser((prevState) => ({
          ...prevState,
          saved_places: response.data.saved_places,
        }));
      } else {
        // If server doesn't return updated saved_places, remove locally
        logger.info('Server response missing saved_places, removing locally');
        setUser((prevState) => ({
          ...prevState,
          saved_places: prevState.saved_places.filter(place => place._id !== placeId),
        }));
      }
    } catch (error) {
      logger.error('Delete API operation failed', error);
      throw error; // Re-throw to let calling code handle it
    }
  };

  const updateUserFavouriteAddress = async (place, placeId) => {
    const requestGeneration = sessionGenerationRef.current;
    const userId = user?.id || user?._id;
    if (!userId || !isAuthenticated || !placeId) return;
    try {
      const response = await api.put(`/users/${userId}/places/${placeId}`, place);
      logger.info('Update API response received', response.data);
      if (!mountedRef.current || requestGeneration !== sessionGenerationRef.current || !isAuthenticated) return;

      if (response.data && response.data.saved_places) {
        setUser((prevState) => ({
          ...prevState,
          saved_places: response.data.saved_places,
        }));
      }
    } catch (error) {
      logger.error('Update API operation failed', error);
      throw error; // Re-throw to let calling code handle it
    }
  };

  const activateDiscount = async (code) => {
    const requestGeneration = sessionGenerationRef.current;
    const userId = user?.id || user?._id;
    if (!userId || !isAuthenticated || typeof code !== 'string' || !code.trim()) return { success: false };
    try {
      const response = await api.post(
        `/promotions/${code}/activate/${userId}`
      );
      logger.info('UserDataContext', 'Discount operation completed', response.data.discount);
      const newDiscount = response.data.discount;
      if (!mountedRef.current || requestGeneration !== sessionGenerationRef.current || !isAuthenticated) return { success: false };
      setUser((prevState) => ({
        ...prevState,
        discount: newDiscount,
      }));
      return { success: true };
    } catch (error) {
      logger.error('UserDataContext', 'API operation failed', error);
      throw new Error(getPromotionErrorMessage(error.response?.data?.error));
    }
  };

  const removeDiscount = async (code) => {
    const requestGeneration = sessionGenerationRef.current;
    const userId = user?.id || user?._id;
    if (!userId || !isAuthenticated || typeof code !== 'string' || !code.trim()) return;
    logger.info('[DEBUG] removeDiscount called', { code, userId });
    try {
      const response = await api.put(`/promotions/${code}/remove/${userId}`);
      logger.info('[DEBUG] removeDiscount response', response.data);
      const newDiscount = response.data.discount;
      if (!mountedRef.current || requestGeneration !== sessionGenerationRef.current || !isAuthenticated) return;
      setUser((prevState) => ({
        ...prevState,
        discount: newDiscount,
      }));
    } catch (error) {
      logger.error('[DEBUG] removeDiscount failed', { status: error.response?.status, data: error.response?.data });
    }
  };

  const updateUser = async (userId, userData) => {
    const requestGeneration = sessionGenerationRef.current;
    if (!userId || !isAuthenticated || !userData || typeof userData !== 'object') return;
    const timer = logger.startTimer('update_user');
    logger.info('Updating user data', { userId, fields: Object.keys(userData) });
    logger.logApiRequest('PUT', `/users/${userId}`, userData);

    try {
      setIsLoading(true);
      const response = await api.put(`/users/${userId}`, userData);

      logger.logApiResponse('PUT', `/users/${userId}`, response.status, response.data, timer.end());
      if (!mountedRef.current || requestGeneration !== sessionGenerationRef.current || !isAuthenticated) return;

      setUser((prevState) => ({
        ...prevState,
        name: response.data.user.name,
        email: response.data.user.email,
        phone: response.data.user.phone,
        photo: response.data.user.photo
      }));

      logger.info('User updated successfully', { userId, updatedFields: Object.keys(userData) });
    } catch (error) {
      ErrorService.handleAPIError(error, false, 'UserDataContext');
      logger.logError(error, { operation: 'updateUser', userId, userData });
      throw error; // Re-throw the error so calling code knows update failed
    } finally {
      if (mountedRef.current && requestGeneration === sessionGenerationRef.current) {
        setIsLoading(false);
      }
    }
  };

  const fetchUserServices = async (userId, { page = 1, refreshing = false } = {}) => {
    const requestGeneration = sessionGenerationRef.current;
    const currentUserId = user?.id || user?._id;
    if (!userId || !currentUserId || String(userId) !== String(currentUserId) || !mountedRef.current || !isAuthenticated) return;
    const url = `/service/allMonthlyClient/${userId}`;
    const timer = logger.startTimer('fetch_user_services');
    logger.logApiRequest('GET', url);

    try {
      setServicesLoading(true);

      const response = await api.get(`service/allMonthlyClient/${userId}`, {
        params: { page, limit: SERVICES_PAGE_LIMIT },
        validateStatus: (status) => (status >= 200 && status < 300) || status === 404,
      });

      if (!mountedRef.current || requestGeneration !== sessionGenerationRef.current || !isAuthenticated) return;

      logger.logApiResponse('GET', url, response.status, response.data, timer.end());

      if (response.status === 404) {
        logger.info('No user services found', { page, userId });
        if (page === 1 || refreshing) setServices([]);
        setServicesPage(page);
        setServicesHasMore(false);
        if (page === 1 || refreshing) setServicesLoadedUserId(userId);
      } else if (response.data) {
        const servicesData = Array.isArray(response.data) ? response.data : response.data.services ?? [];
        const hasMore = servicesData.length >= SERVICES_PAGE_LIMIT;

        setServices((prev) => (page === 1 || refreshing ? servicesData : [...prev, ...servicesData]));
        setServicesPage(page);
        setServicesHasMore(hasMore);
        if (page === 1 || refreshing) setServicesLoadedUserId(userId);

        logger.info('User services loaded', { page, count: servicesData.length, hasMore, userId });

        if (page === 1 || refreshing) {
          const activeService = servicesData.find(isRecoverableActiveService);
          setServiceStatus(activeService || null);
        }
      } else {
        logger.warn('No services data in response');
        if (page === 1 || refreshing) setServices([]);
        setServicesHasMore(false);
        if (page === 1 || refreshing) setServicesLoadedUserId(userId);
      }
    } catch (error) {
      if (!mountedRef.current || requestGeneration !== sessionGenerationRef.current || !isAuthenticated) return;
      ErrorService.handleAPIError(error, false, 'UserDataContext');
      logger.logError(error, { operation: 'fetchUserServices', userId, page });
      if (page === 1 || refreshing) {
        setServices([]);
        // Mark this userId as attempted even on failure — otherwise the
        // auto-fetch effect below (gated on servicesLoadedUserId !== userId)
        // sees servicesLoadedUserId still empty and refires on every render,
        // hammering a failing endpoint in a tight loop. Explicit retries
        // (pull-to-refresh, a retry button) call fetchUserServices directly
        // and are unaffected by this gate.
        setServicesLoadedUserId(userId);
      }
      setServicesHasMore(false);
    } finally {
      if (mountedRef.current && requestGeneration === sessionGenerationRef.current) {
        setServicesLoading(false);
      }
    }
  };

  const loadMoreServices = async (userId) => {
    if (!servicesHasMore || servicesLoading) return;
    await fetchUserServices(userId, { page: servicesPage + 1 });
  };

  const getAppStatus = async (userId) => {
    await fetchUserServices(userId);
  };

  // Recovers the user's current unresolved trip independent of the monthly
  // history's pagination/age window. Returns the service, null when the
  // server confirms there isn't one, or undefined when the check itself
  // failed (network/etc) — callers must treat undefined as "unknown", not
  // "no trip", so they don't silently drop an active trip on a flaky request.
  const fetchCurrentTrip = useCallback(async () => {
    const requestGeneration = sessionGenerationRef.current;
    if (!mountedRef.current || !isAuthenticated) return undefined;
    try {
      const response = await api.get('/service/current');
      if (!mountedRef.current || requestGeneration !== sessionGenerationRef.current || !isAuthenticated) return undefined;
      return response.data?.service ?? null;
    } catch (error) {
      logger.logError(error, { operation: 'fetchCurrentTrip' });
      return undefined;
    }
  }, [logger, isAuthenticated]);

  // --- Vehicles ---

  const saveUserVehicle = async (vehicle) => {
    const requestGeneration = sessionGenerationRef.current;
    const userId = user?.id || user?._id;
    if (!userId || !isAuthenticated || !vehicle || typeof vehicle !== 'object') return;
    const timer = logger.startTimer('save_vehicle');
    logger.logApiRequest('POST', `/users/${userId}/vehicles`, vehicle);
    try {
      const response = await api.post(`/users/${userId}/vehicles`, vehicle);
      logger.logApiResponse('POST', `/users/${userId}/vehicles`, response.status, response.data, timer.end());
      if (!mountedRef.current || requestGeneration !== sessionGenerationRef.current || !isAuthenticated) return;
      setUser((prev) => ({ ...prev, vehicles: response.data.vehicles }));
    } catch (error) {
      ErrorService.handleAPIError(error, true, 'UserDataContext');
      logger.logError(error, { operation: 'saveUserVehicle', vehicle });
      throw error;
    }
  };

  const updateUserVehicle = async (vehicle, vehicleId) => {
    const requestGeneration = sessionGenerationRef.current;
    const userId = user?.id || user?._id;
    if (!userId || !isAuthenticated || !vehicle || typeof vehicle !== 'object' || !vehicleId) return;
    const timer = logger.startTimer('update_vehicle');
    logger.logApiRequest('PUT', `/users/${userId}/vehicles/${vehicleId}`, vehicle);
    try {
      const response = await api.put(`/users/${userId}/vehicles/${vehicleId}`, vehicle);
      logger.logApiResponse('PUT', `/users/${userId}/vehicles/${vehicleId}`, response.status, response.data, timer.end());
      if (!mountedRef.current || requestGeneration !== sessionGenerationRef.current || !isAuthenticated) return;
      setUser((prev) => ({ ...prev, vehicles: response.data.vehicles }));
    } catch (error) {
      ErrorService.handleAPIError(error, true, 'UserDataContext');
      logger.logError(error, { operation: 'updateUserVehicle', vehicleId });
      throw error;
    }
  };

  const removeUserVehicle = async (vehicleId) => {
    const requestGeneration = sessionGenerationRef.current;
    const userId = user?.id || user?._id;
    if (!userId || !isAuthenticated || !vehicleId) return;
    try {
      const response = await api.delete(`/users/${userId}/vehicles/${vehicleId}`);
      if (!mountedRef.current || requestGeneration !== sessionGenerationRef.current || !isAuthenticated) return;
      if (response.data?.vehicles) {
        setUser((prev) => ({ ...prev, vehicles: response.data.vehicles }));
      } else {
        setUser((prev) => ({ ...prev, vehicles: prev.vehicles.filter((v) => v._id !== vehicleId) }));
      }
    } catch (error) {
      logger.logError(error, { operation: 'removeUserVehicle', vehicleId });
      throw error;
    }
  };

  // --- Emergency Contacts ---

  const saveEmergencyContact = async (contact) => {
    const requestGeneration = sessionGenerationRef.current;
    const userId = user?.id || user?._id;
    if (!userId || !isAuthenticated || !contact || typeof contact !== 'object') return;
    try {
      const response = await api.post(`/users/${userId}/emergency-contacts`, contact);
      if (!mountedRef.current || requestGeneration !== sessionGenerationRef.current || !isAuthenticated) return;
      setUser((prev) => ({ ...prev, emergency_contacts: response.data.emergency_contacts }));
    } catch (error) {
      ErrorService.handleAPIError(error, true, 'UserDataContext');
      logger.logError(error, { operation: 'saveEmergencyContact', contact });
      throw error;
    }
  };

  const updateEmergencyContact = async (contact, contactId) => {
    const requestGeneration = sessionGenerationRef.current;
    const userId = user?.id || user?._id;
    if (!userId || !isAuthenticated || !contact || typeof contact !== 'object' || !contactId) return;
    try {
      const response = await api.put(`/users/${userId}/emergency-contacts/${contactId}`, contact);
      if (!mountedRef.current || requestGeneration !== sessionGenerationRef.current || !isAuthenticated) return;
      setUser((prev) => ({ ...prev, emergency_contacts: response.data.emergency_contacts }));
    } catch (error) {
      logger.logError(error, { operation: 'updateEmergencyContact', contactId });
      throw error;
    }
  };

  const removeEmergencyContact = async (contactId) => {
    const requestGeneration = sessionGenerationRef.current;
    const userId = user?.id || user?._id;
    if (!userId || !isAuthenticated || !contactId) return;
    try {
      const response = await api.delete(`/users/${userId}/emergency-contacts/${contactId}`);
      if (!mountedRef.current || requestGeneration !== sessionGenerationRef.current || !isAuthenticated) return;
      if (response.data?.emergency_contacts) {
        setUser((prev) => ({ ...prev, emergency_contacts: response.data.emergency_contacts }));
      } else {
        setUser((prev) => ({ ...prev, emergency_contacts: prev.emergency_contacts.filter((c) => c._id !== contactId) }));
      }
    } catch (error) {
      logger.logError(error, { operation: 'removeEmergencyContact', contactId });
      throw error;
    }
  };

  // --- Insurance ---

  const saveInsurance = async (insurance) => {
    const requestGeneration = sessionGenerationRef.current;
    const userId = user?.id || user?._id;
    if (!userId || !isAuthenticated || !insurance || typeof insurance !== 'object') return;
    try {
      const response = await api.post(`/users/${userId}/insurance`, insurance);
      if (!mountedRef.current || requestGeneration !== sessionGenerationRef.current || !isAuthenticated) return;
      setUser((prev) => ({ ...prev, insurance: response.data.insurance }));
    } catch (error) {
      ErrorService.handleAPIError(error, true, 'UserDataContext');
      logger.logError(error, { operation: 'saveInsurance', insurance });
      throw error;
    }
  };

  const updateInsurance = async (insurance, insuranceId) => {
    const requestGeneration = sessionGenerationRef.current;
    const userId = user?.id || user?._id;
    if (!userId || !isAuthenticated || !insurance || typeof insurance !== 'object' || !insuranceId) return;
    try {
      const response = await api.put(`/users/${userId}/insurance/${insuranceId}`, insurance);
      if (!mountedRef.current || requestGeneration !== sessionGenerationRef.current || !isAuthenticated) return;
      setUser((prev) => ({ ...prev, insurance: response.data.insurance }));
    } catch (error) {
      logger.logError(error, { operation: 'updateInsurance', insuranceId });
      throw error;
    }
  };

  const removeInsurance = async (insuranceId) => {
    const requestGeneration = sessionGenerationRef.current;
    const userId = user?.id || user?._id;
    if (!userId || !isAuthenticated || !insuranceId) return;
    try {
      const response = await api.delete(`/users/${userId}/insurance/${insuranceId}`);
      if (!mountedRef.current || requestGeneration !== sessionGenerationRef.current || !isAuthenticated) return;
      if (response.data?.insurance) {
        setUser((prev) => ({ ...prev, insurance: response.data.insurance }));
      } else {
        setUser((prev) => ({ ...prev, insurance: prev.insurance.filter((i) => i._id !== insuranceId) }));
      }
    } catch (error) {
      logger.logError(error, { operation: 'removeInsurance', insuranceId });
      throw error;
    }
  };

  // --- Accessibility ---

  const updateAccessibility = async (accessibilityData) => {
    const requestGeneration = sessionGenerationRef.current;
    const userId = user?.id || user?._id;
    if (!userId || !isAuthenticated || !accessibilityData || typeof accessibilityData !== 'object') return;
    try {
      const response = await api.put(`/users/${userId}/accessibility`, accessibilityData);
      if (!mountedRef.current || requestGeneration !== sessionGenerationRef.current || !isAuthenticated) return;
      setUser((prev) => ({ ...prev, accessibility: response.data.accessibility }));
    } catch (error) {
      logger.logError(error, { operation: 'updateAccessibility', accessibilityData });
      throw error;
    }
  };

  // --- Notifications ---

  const fetchUserNotifications = async () => {
    const userId = user?.id || user?._id;
    const requestGeneration = sessionGenerationRef.current;
    if (!userId || !mountedRef.current || !isAuthenticated) return;
    try {
      const response = await api.get(`/notifications/user/${userId}`);
      const currentUserId = user?.id || user?._id;
      if (mountedRef.current && requestGeneration === sessionGenerationRef.current && isAuthenticated && String(currentUserId) === String(userId)) {
        setNotifications((response.data || []).map(normalizeNotification));
      }
    } catch (error) {
      logger.logError(error, { operation: 'fetchUserNotifications' });
    }
  };

  const deleteUserNotifications = async (onlyRead = false) => {
    const requestGeneration = sessionGenerationRef.current;
    const userId = user?.id || user?._id;
    if (!userId || !isAuthenticated) return 0;
    try {
      const response = await api.delete(`/notifications/user/${userId}`, {
        params: onlyRead ? { onlyRead: true } : {},
      });
      if (!mountedRef.current || requestGeneration !== sessionGenerationRef.current || !isAuthenticated) return 0;
      if (onlyRead) {
        setNotifications((prev) => prev.filter((n) => !n.read));
      } else {
        setNotifications([]);
      }
      return response.data.deleted;
    } catch (error) {
      logger.logError(error, { operation: 'deleteUserNotifications', onlyRead });
      throw error;
    }
  };

  const deleteNotificationsByIds = async (ids) => {
    const requestGeneration = sessionGenerationRef.current;
    const userId = user?.id || user?._id;
    if (!userId || !isAuthenticated || !Array.isArray(ids) || ids.length === 0) return;
    try {
      await api.delete(`/notifications/user/${userId}/bulk`, { data: { ids } });
      if (!mountedRef.current || requestGeneration !== sessionGenerationRef.current || !isAuthenticated) return;
      setNotifications((prev) => prev.filter((n) => !ids.includes(n._id)));
    } catch (error) {
      logger.logError(error, { operation: 'deleteNotificationsByIds', ids });
      throw error;
    }
  };

  const addNotification = useCallback((notification) => {
    const normalized = normalizeNotification(notification);
    setNotifications((prev) => {
      if (prev.some((n) => n._id === normalized._id)) return prev;
      return [normalized, ...prev];
    });
  }, []);

  const markNotificationAsRead = async (notificationId) => {
    try {
      await api.put(`/notifications/${notificationId}/read`);
      setNotifications((prev) =>
        prev.map((n) => (n._id === notificationId ? { ...n, read: true } : n))
      );
    } catch (error) {
      logger.logError(error, { operation: 'markNotificationAsRead', notificationId });
      throw error;
    }
  };

  const deleteNotification = async (notificationId) => {
    try {
      await api.delete(`/notifications/${notificationId}`);
      setNotifications((prev) => prev.filter((n) => n._id !== notificationId));
    } catch (error) {
      logger.logError(error, { operation: 'deleteNotification', notificationId });
      throw error;
    }
  };

  const unreadNotificationsCount = notifications.filter((n) => !n.read).length;

  // Auto-fetch user data when authenticated
  useEffect(() => {
    // Bumping the generation invalidates in-flight requests from the previous
    // session. Doing it on every run of this effect also killed requests the
    // NEW session had already started: on login, trip recovery fires as soon as
    // MapScreen mounts, and this effect then ran and discarded its response —
    // leaving an active ride unrecovered, with no retry (the 15s reconcile
    // interval is gated on a service already being known). Only invalidate when
    // the session identity actually changes.
    const sessionKey = isAuthenticated && userToken ? userToken : null;
    if (previousSessionKeyRef.current !== sessionKey) {
      if (previousSessionKeyRef.current !== null) sessionGenerationRef.current += 1;
      previousSessionKeyRef.current = sessionKey;
    }
    if (!isAuthenticated || !userToken) {
      pricesRequestRef.current = null;
      setUser(null);
      setPrices(null);
      setServices([]);
      setServiceStatus(null);
      setServicesPage(1);
      setServicesHasMore(false);
      setNotifications([]);
      setServicesLoadedUserId(null);
      setServicesLoading(false);
      return;
    }

    const requestGeneration = sessionGenerationRef.current;
    if (isAuthenticated && userToken) {
      const loadUserData = async () => {
        const userId = await AsyncStorage.getItem('userId');
        if (userId && mountedRef.current && requestGeneration === sessionGenerationRef.current) {
          fetchUserById(userId);
          getAppStatus(userId);
        }
      };
      loadUserData();
    }
  }, [isAuthenticated, userToken]);

  useEffect(() => {
    const userId = user?.id || user?._id;
    if (isAuthenticated && userId && servicesLoadedUserId !== userId && !servicesLoading) {
      fetchUserServices(userId);
    }
  }, [isAuthenticated, user?.id, user?._id, servicesLoadedUserId, servicesLoading]);

  // Auto-fetch notifications once user is loaded
  useEffect(() => {
    if (user?.id) {
      fetchUserNotifications();
    }
  }, [user?.id]);

  // Keep action identities stable for context consumers. Implementations are
  // refreshed below so wrappers always use the latest user/session closure.
  actionsRef.current = {
    fetchUserById,
    fetchPrices,
    fetchUserServices,
    fetchCurrentTrip,
    loadMoreServices,
    updateUser,
    saveUserFavouriteAddress,
    removeUserFavouriteAddress,
    updateUserFavouriteAddress,
    activateDiscount,
    removeDiscount,
    getAppStatus,
    saveUserVehicle,
    updateUserVehicle,
    removeUserVehicle,
    saveEmergencyContact,
    updateEmergencyContact,
    removeEmergencyContact,
    saveInsurance,
    updateInsurance,
    removeInsurance,
    updateAccessibility,
    fetchUserNotifications,
    addNotification,
    markNotificationAsRead,
    deleteNotification,
    deleteUserNotifications,
    deleteNotificationsByIds,
  };

  const stableActions = useMemo(() => {
    const wrap = (name) => (...args) => actionsRef.current[name](...args);
    return {
      fetchUserById: wrap('fetchUserById'),
      fetchPrices: wrap('fetchPrices'),
      fetchUserServices: wrap('fetchUserServices'),
      fetchCurrentTrip: wrap('fetchCurrentTrip'),
      loadMoreServices: wrap('loadMoreServices'),
      updateUser: wrap('updateUser'),
      saveUserFavouriteAddress: wrap('saveUserFavouriteAddress'),
      removeUserFavouriteAddress: wrap('removeUserFavouriteAddress'),
      updateUserFavouriteAddress: wrap('updateUserFavouriteAddress'),
      activateDiscount: wrap('activateDiscount'),
      removeDiscount: wrap('removeDiscount'),
      getAppStatus: wrap('getAppStatus'),
      saveUserVehicle: wrap('saveUserVehicle'),
      updateUserVehicle: wrap('updateUserVehicle'),
      removeUserVehicle: wrap('removeUserVehicle'),
      saveEmergencyContact: wrap('saveEmergencyContact'),
      updateEmergencyContact: wrap('updateEmergencyContact'),
      removeEmergencyContact: wrap('removeEmergencyContact'),
      saveInsurance: wrap('saveInsurance'),
      updateInsurance: wrap('updateInsurance'),
      removeInsurance: wrap('removeInsurance'),
      updateAccessibility: wrap('updateAccessibility'),
      fetchUserNotifications: wrap('fetchUserNotifications'),
      addNotification: wrap('addNotification'),
      markNotificationAsRead: wrap('markNotificationAsRead'),
      deleteNotification: wrap('deleteNotification'),
      deleteUserNotifications: wrap('deleteUserNotifications'),
      deleteNotificationsByIds: wrap('deleteNotificationsByIds'),
    };
  }, []);

  const value = useMemo(() => ({
    user,
    setUser,
    prices,
    services,
    setServices,
    serviceStatus,
    setServiceStatus,
    isLoading,
    servicesLoading,
    servicesPage,
    servicesHasMore,
    servicesLoadedUserId,
    ...stableActions,
    notifications,
    unreadNotificationsCount,
  }), [user, prices, services, serviceStatus, isLoading, servicesLoading, servicesPage, servicesHasMore, servicesLoadedUserId, notifications, unreadNotificationsCount, stableActions]);

  return <UserDataContext.Provider value={value}>{children}</UserDataContext.Provider>;
};
