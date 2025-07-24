import { useRef, useState, useCallback } from "react";

/**
 * Hook to manage bottom sheet presentation and state
 * @returns {Object} Bottom sheet refs, state, and management functions
 */
export const useBottomSheetManager = () => {
  // Define refs for all bottom sheets
  const mainBottomSheetRef = useRef(null);
  const carTypeSelectionSheetRef = useRef(null);
  const userCarInfoSheetRef = useRef(null);
  const paymentOptionsSheetRef = useRef(null);
  const rideSearchSheetRef = useRef(null);
  const tripStartedSheetRef = useRef(null);
  const driverArrivingSheetRef = useRef(null);
  const tripEndingSheetRef = useRef(null);
  const detailsBottomSheetRef = useRef(null);
  const dragMarkerBottomSheetRef = useRef(null);
  
  // Track active bottom sheet
  const [activeBottomSheet, setActiveBottomSheet] = useState(null);
  
  /**
   * Present a specific bottom sheet
   */
  const presentBottomSheet = useCallback((sheetName) => {
    // Dismiss active sheet if any
    if (activeBottomSheet) {
      const currentRef = getSheetRefByName(activeBottomSheet);
      if (currentRef?.current) {
        currentRef.current.dismiss();
      }
    }
    
    // Present the new sheet
    const sheetRef = getSheetRefByName(sheetName);
    if (sheetRef?.current) {
      sheetRef.current.present();
      setActiveBottomSheet(sheetName);
      return true;
    }
    
    return false;
  }, [activeBottomSheet]);
  
  /**
   * Dismiss the active bottom sheet
   */
  const dismissActiveBottomSheet = useCallback(() => {
    if (activeBottomSheet) {
      const sheetRef = getSheetRefByName(activeBottomSheet);
      if (sheetRef?.current) {
        sheetRef.current.dismiss();
      }
      setActiveBottomSheet(null);
      return true;
    }
    return false;
  }, [activeBottomSheet]);
  
  /**
   * Get ref for a sheet by name
   */
  const getSheetRefByName = useCallback((sheetName) => {
    switch (sheetName) {
      case 'main':
        return mainBottomSheetRef;
      case 'carTypeSelection':
        return carTypeSelectionSheetRef;
      case 'userCarInfo':
        return userCarInfoSheetRef;
      case 'paymentOptions':
        return paymentOptionsSheetRef;
      case 'rideSearch':
        return rideSearchSheetRef;
      case 'tripStarted':
        return tripStartedSheetRef;
      case 'driverArriving':
        return driverArrivingSheetRef;
      case 'tripEnding':
        return tripEndingSheetRef;
      case 'details':
        return detailsBottomSheetRef;
      case 'dragMarker':
        return dragMarkerBottomSheetRef;
      default:
        console.warn(`Unknown sheet name: ${sheetName}`);
        return null;
    }
  }, []);
  
  /**
   * Transition from one sheet to another with smooth animation
   */
  const transitionToSheet = useCallback((fromSheet, toSheet, delay = 300) => {
    const fromRef = getSheetRefByName(fromSheet);
    const toRef = getSheetRefByName(toSheet);
    
    if (fromRef?.current && toRef?.current) {
      fromRef.current.dismiss();
      
      // Use requestAnimationFrame for smoother transitions
      setTimeout(() => {
        requestAnimationFrame(() => {
          toRef.current.present();
          setActiveBottomSheet(toSheet);
        });
      }, delay);
      
      return true;
    }
    
    return false;
  }, [getSheetRefByName]);
  
  /**
   * Reset all bottom sheets to their initial state
   */
  const resetBottomSheets = useCallback(() => {
    // Dismiss all sheets except main
    [
      'carTypeSelection', 
      'userCarInfo', 
      'paymentOptions', 
      'rideSearch',
      'tripStarted', 
      'driverArriving', 
      'tripEnding', 
      'details', 
      'dragMarker'
    ].forEach(sheetName => {
      const ref = getSheetRefByName(sheetName);
      if (ref?.current) {
        ref.current.dismiss();
      }
    });
    
    // Present the main sheet
    if (mainBottomSheetRef.current) {
      setTimeout(() => {
        mainBottomSheetRef.current.present();
        setActiveBottomSheet('main');
      }, 300);
    }
  }, [getSheetRefByName]);

  return {
    // Refs for all sheets
    mainBottomSheetRef,
    carTypeSelectionSheetRef,
    userCarInfoSheetRef,
    paymentOptionsSheetRef,
    rideSearchSheetRef,
    tripStartedSheetRef,
    driverArrivingSheetRef,
    tripEndingSheetRef,
    detailsBottomSheetRef,
    dragMarkerBottomSheetRef,
    
    // State
    activeBottomSheet,
    
    // Functions
    presentBottomSheet,
    dismissActiveBottomSheet,
    transitionToSheet,
    resetBottomSheets,
    
    // Helper
    isSheetActive: (sheetName) => activeBottomSheet === sheetName
  };
}; 