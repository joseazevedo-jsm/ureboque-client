import React, { createContext, useEffect } from "react";
import {  useAuth } from './AuthContext';
import {   useUserData } from './UserDataContext';
import {  useSocket } from './SocketContext';

// Create the legacy API context for backward compatibility
export const UserContext = createContext();

// Create a provider component that just provides the legacy compatibility layer
export const UserContextProvider = ({ children }) => {
  return (
    <LegacyUserProvider>
      {children}
    </LegacyUserProvider>
  );
};

// Legacy provider that exposes the old UserContext interface
const LegacyUserProvider = ({ children }) => {
  // Get data from the new contexts
  const auth = useAuth();
  const userData = useUserData();
  const socketData = useSocket();

  // Subscribe to notification socket events after login
  useEffect(() => {
    const { socket } = socketData;
    const userId = userData.user?.id;
    const { addNotification } = userData;
    if (!socket || !userId) return;

    socket.emit('subscribeToNotifications', { userId });
    socket.on('newNotification', addNotification);

    return () => {
      socket.off('newNotification', addNotification);
    };
  }, [socketData.socket, userData.user?.id, userData.addNotification]);

  // Legacy interface - map new context methods to old interface
  const legacyLogin = async (token, id) => {
    return await auth.login(token, id);
  };

  const legacyLogout = async () => {
    return await auth.logout();
  };

  // Provide the legacy API context value to consuming components
  const userContextValue = {
    socket: socketData.socket,
    user: userData.user,
    setUser: userData.setUser,
    fetchUserById: userData.fetchUserById,
    updateUser: userData.updateUser,
    saveUserFavouriteAddress: userData.saveUserFavouriteAddress,
    removeUserFavouriteAddress: userData.removeUserFavouriteAddress,
    updateUserFavouriteAddress: userData.updateUserFavouriteAddress,
    activateDiscount: userData.activateDiscount,
    removeDiscount: userData.removeDiscount,
    userToken: auth.userToken,
    login: legacyLogin,
    logout: legacyLogout,
    isLoading: auth.isLoading || userData.isLoading,
    serviceStatus: userData.serviceStatus,
    setServiceStatus: userData.setServiceStatus,
    prices: userData.prices,
    fetchPrices: userData.fetchPrices
  };

  return (
    <UserContext.Provider value={userContextValue}>
      {children}
    </UserContext.Provider>
  );
};
