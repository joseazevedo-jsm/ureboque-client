import React from 'react';
import { Modal, View, Text, StyleSheet } from 'react-native';
import { useSavedAddresses } from './hooks/useSavedAddresses';
import AddressesList from './components/AddressesList';
import AddressForm from './components/AddressForm';
import LocationSearch from './components/LocationSearch';
import { colors } from '../../theme';

const SavedAddressesModal = ({ visible, onClose, onMapDragRequest }) => {
  const savedAddresses = useSavedAddresses();
  const [isInMapDragMode, setIsInMapDragMode] = React.useState(false);

  // When parent closes, ensure internal state is reset
  React.useEffect(() => {
    if (!visible && !isInMapDragMode) {
      // Only reset state if we're not in map drag mode
      savedAddresses.close();
    } else if (visible && savedAddresses.state.mode === 'closed') {
      savedAddresses.openList();
    }
  }, [visible, isInMapDragMode]);

  const handleClose = () => {
    savedAddresses.close();
    setIsInMapDragMode(false);
    onClose();
  };

  const handleMapDragRequest = (callback) => {
    // Set flag before initiating map drag
    setIsInMapDragMode(true);

    // Wrap the callback to clear the flag when done
    onMapDragRequest((selectedLocation) => {
      setIsInMapDragMode(false);
      callback(selectedLocation);
    });
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
        return <LocationSearch {...savedAddresses} onClose={handleClose} onMapDragRequest={handleMapDragRequest} />;

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
    backgroundColor: colors.background,
    padding: 20
  },
  placeholderText: {
    fontSize: 24,
    fontWeight: 'bold',
    color: colors.primary,
    marginBottom: 20,
    textAlign: 'center'
  },
  debugText: {
    fontSize: 16,
    color: colors.textSecondary,
    marginBottom: 10,
    textAlign: 'center'
  }
});

export default SavedAddressesModal;