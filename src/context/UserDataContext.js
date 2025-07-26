import React, { createContext, useContext, useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import api from '../services/APIService';
import { useAuth } from './AuthContext';

const UserDataContext = createContext();

export const useUserData = () => {
  const context = useContext(UserDataContext);
  if (!context) {
    throw new Error('useUserData must be used within a UserDataProvider');
  }
  return context;
};

export const UserDataProvider = ({ children }) => {
  const { userToken, isAuthenticated } = useAuth();
  const [user, setUser] = useState(null);
  const [prices, setPrices] = useState(null);
  const [serviceStatus, setServiceStatus] = useState(null);
  const [isLoading, setIsLoading] = useState(false);

  const fetchUserById = async (userId) => {
    try {
      const response = await api.get(`/users/${userId}`);
      console.log(response.data);
      const data = response.data;
      setUser(data);
    } catch (error) {
      console.error("Error fetching user by ID:", error.response?.data?.error);
    }
  };

  const fetchPrices = async () => {
    try {
      const response = await api.get("/prices/all");
      console.log(response.data);
      const data = response.data;
      setPrices(data);
    } catch (error) {
      console.error("Error fetching prices:", error.response?.data?.error);
    }
  };

  const saveUserFavouriteAddress = async (place) => {
    try {
      console.log("new place ", place);
      const response = await api.put(`/users/${user.id}/places`, place);
      console.log("response ", response.data);
      setUser((prevState) => ({
        ...prevState,
        saved_places: response.data.saved_places,
      }));
    } catch (error) {
      console.error(error);
    }
  };

  const removeUserFavouriteAddress = async (placeId) => {
    try {
      const response = await api.delete(`/users/${user.id}/places/${placeId}`);
      console.log("response ", response.data);
      setUser((prevState) => ({
        ...prevState,
        saved_places: response.data.saved_places,
      }));
    } catch (error) {
      console.error(error);
    }
  };

  const updateUserFavouriteAddress = async (place, placeId) => {
    try {
      const response = await api.put(`/users/${user.id}/places/${placeId}`, place);
      console.log("response ", response.data);
      setUser((prevState) => ({
        ...prevState,
        saved_places: response.data.saved_places,
      }));
    } catch (error) {
      console.error(error);
    }
  };

  const activateDiscount = async (code) => {
    try {
      const response = await api.post(
        `/promotions/${code}/activate/${user.id}`
      );
      console.log("API Response:", response.data.discount);
      const newDiscount = response.data.discount;
      setUser((prevState) => ({
        ...prevState,
        discount: newDiscount,
      }));
    } catch (error) {
      console.error(error);
    }
  };

  const removeDiscount = async (code) => {
    try {
      const response = await api.put(`/promotions/${code}/remove/${user.id}`);
      console.log("API Response:", response.data.discount);
      const newDiscount = response.data.discount;
      setUser((prevState) => ({
        ...prevState,
        discount: newDiscount,
      }));
    } catch (error) {
      console.error(error);
    }
  };

  const updateUser = async (userId, userData) => {
    console.log("userData ", userData);
    try {
      const response = await api.put(`/users/${userId}`, userData);
      console.log("updated: ", response.data);
      setUser((prevState) => ({
        ...prevState,
        name: response.data.user.name,
        email: response.data.user.email,
        phone: response.data.user.phone,
        photo: response.data.user.photo
      }));
    } catch (error) {
      console.error("Error updating user:", error);
    }
  };

  const getAppStatus = async (userId) => {
    try {
      const response = await api.get(`service/getLastService/${userId}`);
      if (response.status === 200) {
        const { status, review } = response.data.service;
        console.log("status: ", status);
        if (status && !review.rating) setServiceStatus(response.data);
        console.log("App is in ", status, " state.");
      }
    } catch (error) {
      console.error("Error getting app status:", error);
    }
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
    serviceStatus,
    setServiceStatus,
    isLoading,
    fetchUserById,
    fetchPrices,
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