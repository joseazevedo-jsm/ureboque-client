import { useState } from 'react';
import { useUserData } from '../../../context/UserDataContext';

const EMPTY_VEHICLE = {
  id: null,
  brand: '',
  model: '',
  license: '',
  color: '',
  isDefault: false,
};

export const useVehicles = () => {
  const [state, setState] = useState({
    mode: 'closed',
    isLoading: false,
    isEditMode: false,
    currentVehicle: { ...EMPTY_VEHICLE },
  });

  const { user, saveUserVehicle, updateUserVehicle, removeUserVehicle } = useUserData();

  const updateState = (updates) => setState((prev) => ({ ...prev, ...updates }));

  const openList = () => updateState({ mode: 'list', isEditMode: false });
  const close = () => updateState({ mode: 'closed', isEditMode: false, currentVehicle: { ...EMPTY_VEHICLE } });
  const toggleEditMode = () => updateState({ isEditMode: !state.isEditMode });

  const startAdd = () => updateState({ mode: 'add', currentVehicle: { ...EMPTY_VEHICLE } });
  const startEdit = (vehicle) => updateState({
    mode: 'edit',
    currentVehicle: {
      id: vehicle._id,
      brand: vehicle.brand,
      model: vehicle.model,
      license: vehicle.license,
      color: vehicle.color,
      isDefault: vehicle.isDefault,
    },
  });

  const updateCurrentVehicle = (field, value) =>
    updateState({ currentVehicle: { ...state.currentVehicle, [field]: value } });

  const saveVehicle = async () => {
    try {
      updateState({ isLoading: true });
      const payload = {
        brand: state.currentVehicle.brand.trim(),
        model: state.currentVehicle.model.trim(),
        license: state.currentVehicle.license.trim().toUpperCase(),
        color: state.currentVehicle.color.trim(),
        isDefault: state.currentVehicle.isDefault,
      };

      if (state.mode === 'add') {
        await saveUserVehicle(payload);
      } else {
        await updateUserVehicle(payload, state.currentVehicle.id);
      }

      updateState({ mode: 'list', isLoading: false });
    } catch (error) {
      updateState({ isLoading: false });
      throw error;
    }
  };

  const deleteVehicle = async (vehicleId) => {
    try {
      updateState({ isLoading: true });
      await removeUserVehicle(vehicleId);
      updateState({ mode: 'list', isLoading: false });
    } catch (error) {
      updateState({ isLoading: false });
      throw error;
    }
  };

  const setDefaultVehicle = async (vehicleId) => {
    try {
      updateState({ isLoading: true });
      await updateUserVehicle({ isDefault: true }, vehicleId);
      updateState({ isLoading: false });
    } catch (error) {
      updateState({ isLoading: false });
      throw error;
    }
  };

  const vehicles = user?.vehicles || [];
  const defaultVehicle = vehicles.find((v) => v.isDefault) || null;

  const canSave =
    state.currentVehicle.brand.trim() &&
    state.currentVehicle.model.trim() &&
    state.currentVehicle.color.trim() &&
    /^[A-Z0-9-]{5,9}$/.test(state.currentVehicle.license.trim().toUpperCase());

  return {
    state,
    vehicles,
    defaultVehicle,
    canSave,
    openList,
    close,
    toggleEditMode,
    startAdd,
    startEdit,
    saveVehicle,
    deleteVehicle,
    setDefaultVehicle,
    updateCurrentVehicle,
  };
};
