import React, { createContext, useContext, useEffect, useState, useCallback, useMemo } from 'react';
import AuthEventService from '../services/AuthEventService';

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

  // Publish trip liveness to the auth layer: with an active trip, an
  // invalid-token event must defer the forced logout until the trip ends
  // instead of unmounting the map mid-assist (AuthEventService bridges the
  // provider-ordering gap — AuthContext sits above this provider).
  useEffect(() => {
    AuthEventService.setTripActive(isTripActive);
  }, [isTripActive]);

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
