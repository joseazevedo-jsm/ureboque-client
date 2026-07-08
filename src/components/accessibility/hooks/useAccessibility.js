import { useState, useEffect } from 'react';
import { useUserData } from '../../../context/UserDataContext';

const DEFAULT_ACCESSIBILITY = {
  wheelchair: false,
  deaf: false,
  pregnant: false,
  visualImpairment: false,
  customEnabled: false,
  customText: '',
};

export const useAccessibility = () => {
  const [state, setState] = useState({
    isLoading: false,
    accessibility: { ...DEFAULT_ACCESSIBILITY },
  });

  const { user, updateAccessibility } = useUserData();

  const updateState = (updates) => setState((prev) => ({ ...prev, ...updates }));

  // Sync with user data whenever user changes
  useEffect(() => {
    if (user?.accessibility) {
      updateState({ accessibility: { ...DEFAULT_ACCESSIBILITY, ...user.accessibility } });
    }
  }, [user?.accessibility]);

  const toggleField = async (field) => {
    const newValue = !state.accessibility[field];
    const optimisticData = { ...state.accessibility, [field]: newValue };
    updateState({ isLoading: true, accessibility: optimisticData });

    try {
      await updateAccessibility(optimisticData);
      updateState({ isLoading: false });
    } catch (error) {
      // Revert on error
      updateState({ isLoading: false, accessibility: state.accessibility });
      throw error;
    }
  };

  const setCustomText = (text) =>
    updateState({ accessibility: { ...state.accessibility, customText: text } });

  const saveCustomText = async () => {
    try {
      updateState({ isLoading: true });
      await updateAccessibility(state.accessibility);
      updateState({ isLoading: false });
    } catch (error) {
      updateState({ isLoading: false });
      throw error;
    }
  };

  return {
    state,
    toggleField,
    setCustomText,
    saveCustomText,
  };
};
