import { useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import Geocoder from "react-native-geocoding";
import { Keyboard } from "react-native";

// Initialize Geocoder with environment variable
Geocoder.init(process.env.EXPO_PUBLIC_GOOGLE_MAPS_API_KEY);

/**
 * Hook to manage location search functionality
 * @param {Object} mapRef - Reference to the map component
 * @param {Function} setMapMarkers - Function to update map markers
 * @param {Function} onLocationSelect - Callback when locations are selected
 * @returns {Object} Location search state and functions
 */
export const useLocationSearch = (mapRef, setMapMarkers, onLocationSelect = () => {}) => {
  const dispatch = useDispatch();
  const { userLocation } = useSelector((state) => state.location);
  
  // Location state
  const [originCity, setOriginCity] = useState(null);
  const [destinationCity, setDestinationCity] = useState(null);
  const [originCoords, setOriginCoords] = useState(null);
  const [destinationCoords, setDestinationCoords] = useState(null);
  const [isCurrLocation, setIsCurrLocation] = useState(null);
  const [markerCity, setMarkerCity] = useState();
  const [markerVisible, setMarkerVisible] = useState(false);
  const [inputLocationObject, setInputLocationObject] = useState(null);
  // Add new state to track marker coordinates for reuse
  const [markerCoords, setMarkerCoords] = useState(null);
  // Change to state variable to track the origin of marker drag (destination or savedPlaces)
  const [markerDragOrigin, setMarkerDragOrigin] = useState(null);

  /**
   * Get address details from latitude and longitude
   */
  const getAddressFromCoordinates = async (lat, lng) => {
    try {
      const response = await Geocoder.from(lat, lng);
      const address = response.results[0]?.address_components[1]?.long_name;
      setMarkerCity(address);
      return address;
    } catch (error) {
      console.log("Error fetching address:", error);
      return null;
    }
  };

  /**
   * Handle press on map search bar
   */
  const handleMapSearchBarPress = async () => {
    if (!userLocation) return;
    
    const address = await getAddressFromCoordinates(
      userLocation.latitude, 
      userLocation.longitude
    );
    
    setOriginCity(address);
    setOriginCoords({
      latitude: userLocation.latitude,
      longitude: userLocation.longitude,
    });
    
    if (address) {
      setIsCurrLocation({
        latitude: userLocation.latitude,
        longitude: userLocation.longitude,
      });
      return true; // Indicate success for modal visibility
    }
    
    return false;
  };

  /**
   * Handle when a location item is pressed
   */
  const handlePressItemPress = (coords, address, inputRef) => {
    if (inputLocationObject === 0) {
      // Origin location selected
      setOriginCoords(coords);
      setOriginCity(address);
      setIsCurrLocation();
      if (inputRef && inputRef.current) {
        inputRef.current.focus();
      }
    } else if (inputLocationObject === 1) {
      // Destination location selected
      let finalCoords = coords;
      let finalAddress = address;

      // If current location is selected as destination
      if (address === "CurrLocation" && userLocation) {
        finalCoords = {
          latitude: userLocation.latitude,
          longitude: userLocation.longitude,
        };
        finalAddress = markerCity;
      }

      setDestinationCity(finalAddress);
      
      // Set map markers if both origin and destination are present
      if (originCoords) {
        setMapMarkers([originCoords, finalCoords]);
        onLocationSelect({
          origin: {
            name: originCity,
            coordinates: originCoords
          },
          destination: {
            name: finalAddress,
            coordinates: finalCoords
          }
        });
        
        // Hide keyboard
        Keyboard.dismiss();
        return true; // Indicate success for modal dismissal
      }
    }
    
    return false;
  };

  /**
   * Handle when marker drag button is pressed
   */
  const handleMarkerDragPress = () => {
    setMarkerVisible(true);
    return true; // Return true to indicate bottom sheet should be presented
  };

  /**
   * Handle when marker for saved places is dragged
   */
  const handleMarkerDragSavedPlaces = (savedPlacePos = 1) => {
    setInputLocationObject(null);
    setMarkerVisible(true);
    return { pos: savedPlacePos, city: "", callback: false };
  };

  /**
   * Handle when marker drag ends
   */
  const handleMarkerDragEnd = async ({ latitude, longitude }, savedPlaceInfo = null) => {
    try {
      // Get address from coordinates using existing method
      const address = await getAddressFromCoordinates({ latitude, longitude });
      setMarkerCity(address);
      
      // Always store the current marker coordinates for any scenario
      setMarkerCoords({ latitude, longitude });
      
      if (savedPlaceInfo && savedPlaceInfo.pos > 0) {
        // For saved places drag
        return {  
          pos: savedPlaceInfo.pos,
          city: address,  
          coordinates: { latitude, longitude },
          callback: false,
        };
      } else if (inputLocationObject === 0) {
        // For origin location
         setOriginCoords({ latitude, longitude });
      } else if (inputLocationObject === 1) {
        // For destination location
         setDestinationCoords({ latitude, longitude });
      }
      
      return address;
    } catch (error) {
      console.log("Error in handleMarkerDragEnd:", error);
      // Set fallback values
      setMarkerCity("Selected Location");
      setMarkerCoords({ latitude, longitude });
      
      return "Selected Location";
    }
  };

  /**
   * Handle when user confirms draggable marker position
   */
  const handleConfirmDraggablePress = (savedPlaceInfo = null) => {
    if (savedPlaceInfo && savedPlaceInfo.pos > 0) {
      setMarkerVisible(false);
      return {
        pos: savedPlaceInfo.pos,
        city: markerCity,
        coordinates: savedPlaceInfo.coordinates,
        callback: true,
      };
    }
     
    if (inputLocationObject === 0) {
      // Set origin
      setIsCurrLocation();
      setOriginCity(markerCity);
      if (destinationCity != null) {
        setMapMarkers([originCoords, destinationCoords]);
        onLocationSelect({
          origin: {
            name: markerCity,
            coordinates: originCoords
          },
          destination: {
            name: destinationCity,
            coordinates: destinationCoords
          }
        });
        setMarkerVisible(false);
        return true;
      }
    } else if (inputLocationObject === 1) {
      // Set destination
      setDestinationCity(markerCity);
      if (originCity != null) {
        setMapMarkers([originCoords, destinationCoords]);
        onLocationSelect({
          origin: {
            name: originCity,
            coordinates: originCoords
          },
          destination: {
            name: markerCity,
            coordinates: destinationCoords
          }
        });
        setMarkerVisible(false);
        return true;
      }
    }
    
    setMarkerVisible(false);
    return false;
  };

  /**
   * Handle focus on location input field
   */
  const handleLocationTextInputFocus = (value) => {
    setInputLocationObject(value);
  };

  /**
   * Reset all location state
   */
  const resetLocationState = () => {
    setOriginCity(null);
    setDestinationCity(null);
    setOriginCoords(null);
    setDestinationCoords(null);
    setIsCurrLocation(null);
    setMarkerVisible(false);
    setInputLocationObject(null);
  };

  /**
   * Handle scenario when there's a service assigned at the start of the app
   * Sets origin and destination based on existing service data
   */
  const handleExistingServiceAtStart = (serviceData) => {
    if (!serviceData || !serviceData.origin || !serviceData.destination) {
      return false;
    }

    // Set origin information
    if (serviceData.origin.coordinates) {
      setOriginCoords({
        latitude: serviceData.origin.coordinates.latitude,
        longitude: serviceData.origin.coordinates.longitude,
      });
      setOriginCity(serviceData.origin.name || '');
    }

    // Set destination information
    if (serviceData.destination.coordinates) {
      setDestinationCoords({
        latitude: serviceData.destination.coordinates.latitude,
        longitude: serviceData.destination.coordinates.longitude,
      });
      setDestinationCity(serviceData.destination.name || '');
    }

    // Set map markers if both origin and destination are present
    if (serviceData.origin.coordinates && serviceData.destination.coordinates) {
      setMapMarkers([
        {
          latitude: serviceData.origin.coordinates.latitude,
          longitude: serviceData.origin.coordinates.longitude,
        },
        {
          latitude: serviceData.destination.coordinates.latitude,
          longitude: serviceData.destination.coordinates.longitude,
        }
      ]);

      // Call the location select callback
      onLocationSelect({
        origin: {
          name: serviceData.origin.name || '',
          coordinates: {
            latitude: serviceData.origin.coordinates.latitude,
            longitude: serviceData.origin.coordinates.longitude,
          }
        },
        destination: {
          name: serviceData.destination.name || '',
          coordinates: {
            latitude: serviceData.destination.coordinates.latitude,
            longitude: serviceData.destination.coordinates.longitude,
          }
        }
      });

      return true;
    }

    return false;
  };

  return {
    // State
    originCity,
    destinationCity,
    originCoords,
    destinationCoords,
    isCurrLocation,
    markerCity,
    markerVisible,
    inputLocationObject,
    markerCoords,
    markerDragOrigin,
    
    // Actions
    setOriginCity,
    setDestinationCity,
    setOriginCoords,
    setDestinationCoords,
    setMarkerCity,
    setMarkerVisible,
    setInputLocationObject,
    setMarkerCoords,
    setMarkerDragOrigin,
    setIsCurrLocation,
    
    // Functions
    getAddressFromCoordinates,
    handleMapSearchBarPress,
    handlePressItemPress,
    handleMarkerDragPress,
    handleMarkerDragSavedPlaces,
    handleMarkerDragEnd,
    handleConfirmDraggablePress,
    handleLocationTextInputFocus,
    resetLocationState,
    handleExistingServiceAtStart
  };
}; 