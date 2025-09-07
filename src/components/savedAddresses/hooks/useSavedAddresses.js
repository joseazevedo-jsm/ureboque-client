import { useState, useContext } from 'react';
import { UserContext } from '../../../context/UserContext';

export const useSavedAddresses = () => {
  // Single state object - replaces 15+ scattered variables
  const [state, setState] = useState({
    // UI State
    mode: 'closed',           // 'closed' | 'list' | 'add' | 'edit' | 'search'
    previousMode: null,       // Track mode before search to return correctly
    isLoading: false,
    error: null,
    
    // Form Data (single source of truth)
    currentAddress: {
      id: null,
      name: '',
      description: '',
      coordinates: null,
      instructions: '',
      type: 'custom'          // 'home' | 'work' | 'custom'
    },
    
    // Search State
    searchResults: [],
    searchQuery: ''
  });

  const { user, saveUserFavouriteAddress, updateUserFavouriteAddress, removeUserFavouriteAddress } = useContext(UserContext);

  // State updater helper
  const updateState = (updates) => setState(prev => ({ ...prev, ...updates }));

  // Modal Controls
  const openList = () => updateState({ mode: 'list' });
  const close = () => updateState({ mode: 'closed', previousMode: null, currentAddress: getEmptyAddress() });

  // Address Management
  const startAdd = (presetData = {}) => updateState({ 
    mode: 'add',
    currentAddress: { ...getEmptyAddress(), ...presetData }
  });

  const startEdit = (address) => updateState({ 
    mode: 'edit',
    currentAddress: { ...address }
  });

  const openSearch = () => updateState({ 
    previousMode: state.mode, // Store current mode before switching to search
    mode: 'search' 
  });

  // Form Handlers
  const updateCurrentAddress = (field, value) => {
    updateState({
      currentAddress: { ...state.currentAddress, [field]: value }
    });
  };

  const saveAddress = async () => {
    try {
      updateState({ isLoading: true, error: null });

      const addressData = {
        place: {
          name: state.currentAddress.name,
          description: state.currentAddress.description,
          coordinates: state.currentAddress.coordinates,
          instructions: state.currentAddress.instructions,
         }
      };

      if (state.mode === 'add') {
        await saveUserFavouriteAddress(addressData);
      } else if (state.mode === 'edit') {
        await updateUserFavouriteAddress(addressData, state.currentAddress.id);
      }

      // Success - return to list
      updateState({ mode: 'list', isLoading: false });
      
    } catch (error) {
      updateState({ isLoading: false, error: error.message });
      throw error; // Let UI handle user notification
    }
  };

  const deleteAddress = async (addressId) => {
    try {
      updateState({ isLoading: true });
      await removeUserFavouriteAddress(addressId);
      updateState({ mode: 'list', isLoading: false });
    } catch (error) {
      updateState({ isLoading: false, error: error.message });
      throw error;
    }
  };

  // Search Handlers
  const searchLocations = async (query) => {
    updateState({ searchQuery: query });
    // Search is handled by useTextSearchQuery in LocationSearch component
    // This function just updates the state for consistency
  };

  const selectSearchResult = (location) => {
    updateState({
      mode: state.previousMode || 'add', // Return to previous mode, default to 'add' if none
      currentAddress: {
        ...state.currentAddress,
        description: location.address,
        coordinates: location.coordinates,
        name: state.currentAddress.name || location.name
      }
    });
  };

  // Helper function
  const getEmptyAddress = () => ({
    id: null,
    name: '',
    description: '',
    coordinates: null,
    instructions: '',
    type: 'custom'
  });

  // Computed values
  const addresses = user?.saved_places || [];
  const canSave = state.currentAddress.name && state.currentAddress.coordinates;

  return {
    // State
    state,
    addresses,
    canSave,
    
    // Modal Controls
    openList,
    close,
    
    // Address Management
    startAdd,
    startEdit,
    saveAddress,
    deleteAddress,
    
    // Form Handlers
    updateCurrentAddress,
    
    // Search
    openSearch,
    searchLocations,
    selectSearchResult
  };
};