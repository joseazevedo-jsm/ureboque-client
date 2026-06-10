import React, { createContext, useContext, useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import api from '../services/APIService';
import { useAuth } from './AuthContext';
import { useLogger } from '../hooks/useLogger';
import ErrorService from '../services/ErrorService';

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

  const SERVICES_PAGE_LIMIT = 20;

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
    try {
      const response = await api.put(`/promotions/${code}/remove/${user.id}`);
      logger.info('UserDataContext', 'Discount operation completed', response.data.discount);
      const newDiscount = response.data.discount;
      setUser((prevState) => ({
        ...prevState,
        discount: newDiscount,
      }));
    } catch (error) {
      logger.error('UserDataContext', 'API operation failed', error);
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
      });

      logger.logApiResponse('GET', url, response.status, response.data, timer.end());

      if (response.data) {
        const servicesData = Array.isArray(response.data) ? response.data : response.data.services ?? [];
        const hasMore = servicesData.length >= SERVICES_PAGE_LIMIT;

        setServices((prev) => (page === 1 || refreshing ? servicesData : [...prev, ...servicesData]));
        setServicesPage(page);
        setServicesHasMore(hasMore);

        logger.info('User services loaded', { page, count: servicesData.length, hasMore, userId });

        if (page === 1 || refreshing) {
          const lastService = servicesData[0];
          if (lastService?.service?.status && lastService?.service?.driver && !lastService?.service?.review?.rating) {
            setServiceStatus(lastService);
          }
        }
      } else {
        logger.warn('No services data in response');
        if (page === 1 || refreshing) setServices([]);
        setServicesHasMore(false);
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
  };

  return <UserDataContext.Provider value={value}>{children}</UserDataContext.Provider>;
};