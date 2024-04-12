import AsyncStorage from "@react-native-async-storage/async-storage";
import axios from "axios";
import React, { createContext, useEffect, useState } from "react";
import { io } from "socket.io-client";

const IP = process.env.EXPO_PUBLIC_UREBOQUE_API;
const socketID = io(`${IP}`);

console.log("IP: ", IP);
const api = axios.create({
  baseURL: IP,
});
// Create the API context
export const UserContext = createContext();

// Create a provider component for the API context
export const UserContextProvider = ({ children }) => {
  const [socket, setSocket] = useState(socketID);
  const [user, setUser] = useState();
  const [isLoading, setIsLoading] = useState();
  const [userToken, setUserToken] = useState(null);
  const [serviceStatus, setServiceStatus] = useState(null);
  const [prices, setPrices] = useState(null);

  // Define functions to interact with your API
  const fetchUsers = async () => {
    // Make an API call to fetch users from your Express API
    // Update the 'users' state with the fetched data
  };

  const fetchUserById = async (userId) => {
    try {
      const response = await api.get(`/users/${userId}`);
      console.log(response.data);
      const data = response.data;
      setUser(data);
    } catch (error) {
      console.error("Error fetching user by ID:", error.response.data.error);
    }
  };

  const fetchPrices = async () => {
    try {
      const response = await api.get("/prices/all");
      console.log(response.data);
      const data = response.data;
      setPrices(data);
    } catch (error) {
      console.error("Error fetching prices:", error.response.data.error);
    }
  };


  const saveUserFavouriteAddress = async (place) => {
    try {
      const response = await api.put(`/users/${user.id}/places`, place);
      console.log(response.data);
      setUser((prevState) => ({
        ...prevState,
        saved_places: response.data.saved_places,
      }));
      console.log(user);
    } catch (error) {
      // Handle error
      console.error(error);
    }
  };

  const activateDiscount = async (code) => {
    try {
      const response = await api.post(
        `/promotions/${code}/activate/${user.id}`
      );

      // Log the entire response to inspect its structure
      console.log("API Response:", response.data.discount);

      // Assuming the response structure is correct
      const newDiscount = response.data.discount;

      // Update the state using the new discount value
      setUser((prevState) => ({
        ...prevState,
        discount: newDiscount,
      }));
    } catch (error) {
      // Handle error
      console.error(error);
    }
  };

  const removeDiscount = async (code) => {
    try {
      const response = await api.put(`/promotions/${code}/remove/${user.id}`);

      // Log the entire response to inspect its structure
      console.log("API Response:", response.data.discount);

      // Assuming the response structure is correct
      const newDiscount = response.data.discount;

      // Update the state using the new discount value
      setUser((prevState) => ({
        ...prevState,
        discount: newDiscount,
      }));
    } catch (error) {
      // Handle error
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

  const login = async (token, id) => {
    try {
      setIsLoading(true);
      setUserToken(token);
      AsyncStorage.setItem("userToken", token);
      AsyncStorage.setItem("userId", id);
      getAppStatus(id);
      setIsLoading(false);
    } catch (e) {
      console.log("login in error ", e);
    }
  };

  const logout = async () => {
    try {
      setIsLoading(true);
      setUserToken(null);
      AsyncStorage.removeItem("userToken");
      setIsLoading(false);
    } catch (e) {
      console.log("logout in error ", e);
    }
  };

  const isLoggedIn = async () => {
    try {
      setIsLoading(true);
      const userToken = await AsyncStorage.getItem("userToken");
      const userId = await AsyncStorage.getItem("userId");

      if (userToken && userId) {
        console.log("User is logged in. Token:", userToken);

        // Make an HTTP request to get the appStatus
        getAppStatus(userId);

        // Fetch user data
        fetchUserById(userId).then((response) => {
          setUserToken(userToken);
          setIsLoading(false);
        });
      } else {
        setIsLoading(false);
      }
    } catch (e) {
      console.log("isLogged in error ", e);
    }
  };

  const getAppStatus = async (userId) => {
    try {
    const response = await api.get(`service/getLastService/${userId}`);

    if (response.status === 200) {
      const { status, review } = response.data.service;
      console.log("status: ", status);
      // Check appStatus and act accordingly
      // App is in ongoing state, you can perform specific actions here.
      if (status && !review.rating) setServiceStatus(response.data);
      console.log("App is in ", status, " state.");
    }
  } catch (error) {
    console.error("Error getting app status:", error);
  }
  };

  useEffect(() => {
    if (userToken === null) isLoggedIn();
  }, []);

  // Provide the API context value to consuming components
  const userContextValue = {
    socket,
    user,
    setUser,
    fetchUserById,
    fetchUsers,
    updateUser,
    saveUserFavouriteAddress,
    activateDiscount,
    removeDiscount,
    userToken,
    setUserToken,
    login,
    logout,
    isLoading,
    serviceStatus,
    setServiceStatus,
    prices,
    fetchPrices
  };

  return (
    <UserContext.Provider value={userContextValue}>
      {children}
    </UserContext.Provider>
  );
};
