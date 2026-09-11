import React, { createContext, useContext, useState, useCallback, useMemo } from 'react';

const TripStateContext = createContext(null);

export const useTripState = () => {
  const context = useContext(TripStateContext);
  if (!context) {
    throw new Error('useTripState must be used within a TripStateProvider');
  }
  return context;
};

export const TripStateProvider = ({ children }) => {
  const [isTripActive, setTripActive] = useState(false);
  const [tripStatus, setTripStatus] = useState(null);

  const updateTripActive = useCallback((active) => {
    setTripActive(active);
  }, []);

  const updateTripStatus = useCallback((status) => {
    setTripStatus(status);
  }, []);

  const value = useMemo(() => ({
    isTripActive,
    tripStatus,
    setTripActive: updateTripActive,
    setTripStatus: updateTripStatus,
  }), [isTripActive, tripStatus, updateTripActive, updateTripStatus]);

  return (
    <TripStateContext.Provider
      value={value}
    >
      {children}
    </TripStateContext.Provider>
  );
};
