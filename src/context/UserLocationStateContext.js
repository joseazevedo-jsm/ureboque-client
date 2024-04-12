import React, { useContext, createContext, useState } from 'react';

const UserLocationStateContext = createContext(null);

export const UserLocationStateContextProvider = ({ children }) => {
  const useUserLocationStateContextValue = () => {
    const [userLocation, setUserLocation] = useState();

    return { userLocation, setUserLocation };
  };

  const userLocationStateContextValue = useUserLocationStateContextValue();

  return (
    <UserLocationStateContext.Provider value={userLocationStateContextValue}>
      {children}
    </UserLocationStateContext.Provider>
  );
};

export const useUserLocationStateContext = () => {
  const context = useContext(UserLocationStateContext);

  if (!context) {
    throw new Error(
      'useUserLocationStateContext must be used inside UserLocationStateContextProvider',
    );
  }

  return context;
};
