import { useState } from 'react';
import { useUserData } from '../../../context/UserDataContext';

const EMPTY_INSURANCE = {
  id: null,
  company: '',
  policyNumber: '',
  vehicleLicense: '',
};

export const useInsurance = () => {
  const [state, setState] = useState({
    mode: 'closed',
    isLoading: false,
    isEditMode: false,
    currentInsurance: { ...EMPTY_INSURANCE },
  });

  const { user, saveInsurance, updateInsurance, removeInsurance } = useUserData();

  const updateState = (updates) => setState((prev) => ({ ...prev, ...updates }));

  const openList = () => updateState({ mode: 'list', isEditMode: false });
  const close = () => updateState({ mode: 'closed', isEditMode: false, currentInsurance: { ...EMPTY_INSURANCE } });
  const toggleEditMode = () => updateState({ isEditMode: !state.isEditMode });

  const startAdd = () => updateState({ mode: 'add', currentInsurance: { ...EMPTY_INSURANCE } });
  const startEdit = (insurance) => updateState({
    mode: 'edit',
    currentInsurance: {
      id: insurance._id,
      company: insurance.company,
      policyNumber: insurance.policyNumber,
      vehicleLicense: insurance.vehicleLicense,
    },
  });

  const updateCurrentInsurance = (field, value) =>
    updateState({ currentInsurance: { ...state.currentInsurance, [field]: value } });

  const saveInsuranceRecord = async () => {
    try {
      updateState({ isLoading: true });
      const payload = {
        company: state.currentInsurance.company.trim(),
        policyNumber: state.currentInsurance.policyNumber.trim(),
        vehicleLicense: state.currentInsurance.vehicleLicense.trim().toUpperCase(),
      };

      if (state.mode === 'add') {
        await saveInsurance(payload);
      } else {
        await updateInsurance(payload, state.currentInsurance.id);
      }

      updateState({ mode: 'list', isLoading: false });
    } catch (error) {
      updateState({ isLoading: false });
      throw error;
    }
  };

  const deleteInsuranceRecord = async (insuranceId) => {
    try {
      updateState({ isLoading: true });
      await removeInsurance(insuranceId);
      updateState({ mode: 'list', isLoading: false });
    } catch (error) {
      updateState({ isLoading: false });
      throw error;
    }
  };

  const insurances = user?.insurance || [];

  const canSave =
    state.currentInsurance.company.trim().length > 0 &&
    state.currentInsurance.policyNumber.trim().length > 0 &&
    state.currentInsurance.vehicleLicense.trim().length > 0;

  return {
    state,
    insurances,
    canSave,
    openList,
    close,
    toggleEditMode,
    startAdd,
    startEdit,
    saveInsuranceRecord,
    deleteInsuranceRecord,
    updateCurrentInsurance,
  };
};
