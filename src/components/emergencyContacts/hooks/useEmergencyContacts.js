import { useState } from 'react';
import { useUserData } from '../../../context/UserDataContext';

const EMPTY_CONTACT = {
  id: null,
  name: '',
  phone: '',
  relation: '',
};

export const useEmergencyContacts = () => {
  const [state, setState] = useState({
    mode: 'closed',
    isLoading: false,
    isEditMode: false,
    currentContact: { ...EMPTY_CONTACT },
  });

  const { user, saveEmergencyContact, updateEmergencyContact, removeEmergencyContact } = useUserData();

  const updateState = (updates) => setState((prev) => ({ ...prev, ...updates }));

  const openList = () => updateState({ mode: 'list', isEditMode: false });
  const close = () => updateState({ mode: 'closed', isEditMode: false, currentContact: { ...EMPTY_CONTACT } });
  const toggleEditMode = () => updateState({ isEditMode: !state.isEditMode });

  const startAdd = () => updateState({ mode: 'add', currentContact: { ...EMPTY_CONTACT } });
  const startEdit = (contact) => updateState({
    mode: 'edit',
    currentContact: {
      id: contact._id,
      name: contact.name,
      phone: contact.phone,
      relation: contact.relation,
    },
  });

  const updateCurrentContact = (field, value) =>
    updateState({ currentContact: { ...state.currentContact, [field]: value } });

  const saveContact = async () => {
    try {
      updateState({ isLoading: true });
      const payload = {
        name: state.currentContact.name.trim(),
        phone: state.currentContact.phone.trim(),
        relation: state.currentContact.relation.trim(),
      };

      if (state.mode === 'add') {
        await saveEmergencyContact(payload);
      } else {
        await updateEmergencyContact(payload, state.currentContact.id);
      }

      updateState({ mode: 'list', isLoading: false });
    } catch (error) {
      updateState({ isLoading: false });
      throw error;
    }
  };

  const deleteContact = async (contactId) => {
    try {
      updateState({ isLoading: true });
      await removeEmergencyContact(contactId);
      updateState({ mode: 'list', isLoading: false });
    } catch (error) {
      updateState({ isLoading: false });
      throw error;
    }
  };

  const contacts = user?.emergency_contacts || [];

  const canSave =
    state.currentContact.name.trim().length > 0 &&
    state.currentContact.phone.trim().replace(/\D/g, '').length >= 7;

  return {
    state,
    contacts,
    canSave,
    openList,
    close,
    toggleEditMode,
    startAdd,
    startEdit,
    saveContact,
    deleteContact,
    updateCurrentContact,
  };
};
