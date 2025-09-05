import React from 'react';
import { Modal, View, Text, StyleSheet } from 'react-native';
import { useSavedAddresses } from './hooks/useSavedAddresses';
import AddressesList from './components/AddressesList';
import AddressForm from './components/AddressForm';
import LocationSearch from './components/LocationSearch';

const SavedAddressesModal = ({ visible, onClose, onMapDragRequest }) => {
  const savedAddresses = useSavedAddresses();

  // When parent closes, ensure internal state is reset
  React.useEffect(() => {
    if (!visible) {
      savedAddresses.close();
    } else if (visible && savedAddresses.state.mode === 'closed') {
      savedAddresses.openList();
    }
  }, [visible]);

  const handleClose = () => {
    savedAddresses.close();
    onClose();
  };

  const renderContent = () => {
    switch (savedAddresses.state.mode) {
      case 'list':
        // Phase 2: Render AddressesList component
        return <AddressesList {...savedAddresses} onClose={handleClose} />;
      
      case 'add':
      case 'edit':
        // Phase 3: Render AddressForm component
        return <AddressForm {...savedAddresses} onClose={handleClose} />;
      
      case 'search':
        // Phase 4: Render LocationSearch component
        return <LocationSearch {...savedAddresses} onClose={handleClose} onMapDragRequest={onMapDragRequest} />;
      
      default:
        return null;
    }
  };

  return (
    <Modal
      visible={visible && savedAddresses.state.mode !== 'closed'}
      animationType="slide"
      onRequestClose={handleClose}
    >
      {renderContent()}
    </Modal>
  );
};

const styles = StyleSheet.create({
  placeholder: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f0f0f0',
    padding: 20
  },
  placeholderText: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#0089FF',
    marginBottom: 20,
    textAlign: 'center'
  },
  debugText: {
    fontSize: 16,
    color: '#666',
    marginBottom: 10,
    textAlign: 'center'
  }
});

export default SavedAddressesModal;