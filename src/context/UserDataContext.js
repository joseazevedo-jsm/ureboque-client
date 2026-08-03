import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import api from '../services/APIService';
import { useAuth } from './AuthContext';
import { useLogger } from '../hooks/useLogger';
import ErrorService from '../services/ErrorService';
import { ACTIVE_SERVICE_STATUSES } from '../utils/serviceState';

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

  const SERVICES_PAGE_LIMIT = 20;
  const ACTIVE_SERVICE_MAX_AGE_MS = 12 * 60 * 60 * 1000;

  const isRecoverableActiveService = (item) => {
    const service = item?.service;
    if (!ACTIVE_SERVICE_STATUSES.includes(service?.status) || !service?.driver || service?.review?.rating) {
      return false;
    }
    const createdAt = service?.createdAt ? new Date(service.createdAt).getTime() : 0;
    return createdAt > 0 && Date.now() - createdAt <= ACTIVE_SERVICE_MAX_AGE_MS;
  };

  const fetchUserById = async (userId) => {
    const timer = logger.startTimer('fetch_user_by_id');
    logger.logApiRequest('GET', `/users/${userId}`);

    try {
      setIsLoading(true);
      logger.logStateChange('isLoading', false, true, 'fetch_user_started');

      const response = await api.get(`/users/${userId}`);
      const data = response.data;

      logger.logApiResponse('GET', `/users/${userId}`, response.status, data, timer.end());
      setUser(data);
      logger.logStateChange('user', null, 'loaded', 'user_data_fetched');

    } catch (error) {
      logger.logError(error, { operation: 'fetchUserById', userId });
    } finally {
      setIsLoading(false);
      logger.logStateChange('isLoading', true, false, 'fetch_user_finished');
    }
  };

  const fetchPrices = async () => {
    try {
      const response = await api.get("/prices/all");
      logger.info('UserDataContext', 'Prices fetched successfully', response.data);
      const data = response.data;
      setPrices(data);
    } catch (error) {
      logger.error('Error fetching prices', error.response?.data?.error);
    }
  };

  const saveUserFavouriteAddress = async (place) => {
    const timer = logger.startTimer('save_favourite_address');
    logger.info('Saving favourite address', { placeName: place.name, userId: user?.id });
    logger.logApiRequest('PUT', `/users/${user.id}/places`, place);

    try {
      const response = await api.put(`/users/${user.id}/places`, place);
      logger.logApiResponse('PUT', `/users/${user.id}/places`, response.status, response.data, timer.end());

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
    try {
      const response = await api.delete(`/users/${user.id}/places/${placeId}`);

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
    try {
      const response = await api.put(`/users/${user.id}/places/${placeId}`, place);
      logger.info('Update API response received', response.data);

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
    try {
      const response = await api.post(
        `/promotions/${code}/activate/${user.id}`
      );
      logger.info('UserDataContext', 'Discount operation completed', response.data.discount);
      const newDiscount = response.data.discount;
      setUser((prevState) => ({
        ...prevState,
        discount: newDiscount,
      }));
      return { success: true };
    } catch (error) {
      logger.error('UserDataContext', 'API operation failed', error);
      const serverError = error.response?.data?.error;
      let errorMessage = 'Falha ao activar código promocional';

      // Translate common server errors to Portuguese
      if (serverError) {
        switch (serverError) {
          case 'User who generated the code cannot use it':
            errorMessage = 'O utilizador que gerou o código não pode utilizá-lo';
            break;
          case 'Promotion code not found':
            errorMessage = 'Código promocional não encontrado';
            break;
          case 'Promotion code expired':
            errorMessage = 'Código promocional expirado';
            break;
          case 'Promotion code already used':
            errorMessage = 'Código promocional já utilizado';
            break;
          case 'Invalid promotion code':
            errorMessage = 'Código promocional inválido';
            break;
          default:
            errorMessage = serverError;
        }
      }

      throw new Error(errorMessage);
    }
  };

  const removeDiscount = async (code) => {
    logger.info('[DEBUG] removeDiscount called', { code, userId: user.id });
    try {
      const response = await api.put(`/promotions/${code}/remove/${user.id}`);
      logger.info('[DEBUG] removeDiscount response', response.data);
      const newDiscount = response.data.discount;
      setUser((prevState) => ({
        ...prevState,
        discount: newDiscount,
      }));
    } catch (error) {
      logger.error('[DEBUG] removeDiscount failed', { status: error.response?.status, data: error.response?.data });
    }
  };

  const updateUser = async (userId, userData) => {
    const timer = logger.startTimer('update_user');
    logger.info('Updating user data', { userId, fields: Object.keys(userData) });
    logger.logApiRequest('PUT', `/users/${userId}`, userData);

    try {
      setIsLoading(true);
      const response = await api.put(`/users/${userId}`, userData);

      logger.logApiResponse('PUT', `/users/${userId}`, response.status, response.data, timer.end());

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
      setIsLoading(false);
    }
  };

  const fetchUserServices = async (userId, { page = 1, refreshing = false } = {}) => {
    const url = `/service/allMonthlyClient/${userId}`;
    const timer = logger.startTimer('fetch_user_services');
    logger.logApiRequest('GET', url);

    try {
      setServicesLoading(true);

      const response = await api.get(`service/allMonthlyClient/${userId}`, {
        params: { page, limit: SERVICES_PAGE_LIMIT },
        validateStatus: (status) => (status >= 200 && status < 300) || status === 404,
      });

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
      ErrorService.handleAPIError(error, false, 'UserDataContext');
      logger.logError(error, { operation: 'fetchUserServices', userId, page });
      if (page === 1 || refreshing) setServices([]);
      setServicesHasMore(false);
    } finally {
      setServicesLoading(false);
    }
  };

  const loadMoreServices = async (userId) => {
    if (!servicesHasMore || servicesLoading) return;
    await fetchUserServices(userId, { page: servicesPage + 1 });
  };

  const getAppStatus = async (userId) => {
    await fetchUserServices(userId);
  };

  // --- Vehicles ---

  const saveUserVehicle = async (vehicle) => {
    const timer = logger.startTimer('save_vehicle');
    logger.logApiRequest('POST', `/users/${user.id}/vehicles`, vehicle);
    try {
      const response = await api.post(`/users/${user.id}/vehicles`, vehicle);
      logger.logApiResponse('POST', `/users/${user.id}/vehicles`, response.status, response.data, timer.end());
      setUser((prev) => ({ ...prev, vehicles: response.data.vehicles }));
    } catch (error) {
      ErrorService.handleAPIError(error, true, 'UserDataContext');
      logger.logError(error, { operation: 'saveUserVehicle', vehicle });
      throw error;
    }
  };

  const updateUserVehicle = async (vehicle, vehicleId) => {
    const timer = logger.startTimer('update_vehicle');
    logger.logApiRequest('PUT', `/users/${user.id}/vehicles/${vehicleId}`, vehicle);
    try {
      const response = await api.put(`/users/${user.id}/vehicles/${vehicleId}`, vehicle);
      logger.logApiResponse('PUT', `/users/${user.id}/vehicles/${vehicleId}`, response.status, response.data, timer.end());
      setUser((prev) => ({ ...prev, vehicles: response.data.vehicles }));
    } catch (error) {
      ErrorService.handleAPIError(error, true, 'UserDataContext');
      logger.logError(error, { operation: 'updateUserVehicle', vehicleId });
      throw error;
    }
  };

  const removeUserVehicle = async (vehicleId) => {
    try {
      const response = await api.delete(`/users/${user.id}/vehicles/${vehicleId}`);
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
    try {
      const response = await api.post(`/users/${user.id}/emergency-contacts`, contact);
      setUser((prev) => ({ ...prev, emergency_contacts: response.data.emergency_contacts }));
    } catch (error) {
      ErrorService.handleAPIError(error, true, 'UserDataContext');
      logger.logError(error, { operation: 'saveEmergencyContact', contact });
      throw error;
    }
  };

  const updateEmergencyContact = async (contact, contactId) => {
    try {
      const response = await api.put(`/users/${user.id}/emergency-contacts/${contactId}`, contact);
      setUser((prev) => ({ ...prev, emergency_contacts: response.data.emergency_contacts }));
    } catch (error) {
      logger.logError(error, { operation: 'updateEmergencyContact', contactId });
      throw error;
    }
  };

  const removeEmergencyContact = async (contactId) => {
    try {
      const response = await api.delete(`/users/${user.id}/emergency-contacts/${contactId}`);
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
    try {
      const response = await api.post(`/users/${user.id}/insurance`, insurance);
      setUser((prev) => ({ ...prev, insurance: response.data.insurance }));
    } catch (error) {
      ErrorService.handleAPIError(error, true, 'UserDataContext');
      logger.logError(error, { operation: 'saveInsurance', insurance });
      throw error;
    }
  };

  const updateInsurance = async (insurance, insuranceId) => {
    try {
      const response = await api.put(`/users/${user.id}/insurance/${insuranceId}`, insurance);
      setUser((prev) => ({ ...prev, insurance: response.data.insurance }));
    } catch (error) {
      logger.logError(error, { operation: 'updateInsurance', insuranceId });
      throw error;
    }
  };

  const removeInsurance = async (insuranceId) => {
    try {
      const response = await api.delete(`/users/${user.id}/insurance/${insuranceId}`);
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
    try {
      const response = await api.put(`/users/${user.id}/accessibility`, accessibilityData);
      setUser((prev) => ({ ...prev, accessibility: response.data.accessibility }));
    } catch (error) {
      logger.logError(error, { operation: 'updateAccessibility', accessibilityData });
      throw error;
    }
  };

  // --- Notifications ---

  // Normalise backend field isRead → read so all consumers use a single field name
  const normalizeNotification = (n) => ({
    ...n,
    read: n.read ?? n.isRead ?? false,
  });

  const fetchUserNotifications = async () => {
    try {
      const response = await api.get(`/notifications/user/${user.id}`);
      setNotifications((response.data || []).map(normalizeNotification));
    } catch (error) {
      logger.logError(error, { operation: 'fetchUserNotifications' });
    }
  };

  const deleteUserNotifications = async (onlyRead = false) => {
    try {
      const response = await api.delete(`/notifications/user/${user.id}`, {
        params: onlyRead ? { onlyRead: true } : {},
      });
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
    try {
      await api.delete(`/notifications/user/${user.id}/bulk`, { data: { ids } });
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
    if (isAuthenticated && userToken) {
      const loadUserData = async () => {
        const userId = await AsyncStorage.getItem('userId');
        if (userId) {
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

  const value = {
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
    fetchUserById,
    fetchPrices,
    fetchUserServices,
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
    notifications,
    unreadNotificationsCount,
    fetchUserNotifications,
    addNotification,
    markNotificationAsRead,
    deleteNotification,
    deleteUserNotifications,
    deleteNotificationsByIds,
  };

  return <UserDataContext.Provider value={value}>{children}</UserDataContext.Provider>;
};
