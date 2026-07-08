import React from 'react';
import { Modal, View, StyleSheet } from 'react-native';
import { useEmergencyContacts } from './hooks/useEmergencyContacts';
import ContactsList from './components/ContactsList';
import ContactForm from './components/ContactForm';
import { colors } from '../../theme';

const EmergencyContactsModal = ({ visible, onClose }) => {
  const hook = useEmergencyContacts();
  const { state, openList, close } = hook;

  React.useEffect(() => {
    if (visible && state.mode === 'closed') openList();
    if (!visible && state.mode !== 'closed') close();
  }, [visible]);

  const handleClose = () => {
    close();
    onClose();
  };

  return (
    <Modal
      visible={visible && state.mode !== 'closed'}
      animationType="slide"
      onRequestClose={handleClose}
    >
      <View style={styles.container}>
        {state.mode === 'list' && <ContactsList {...hook} onClose={handleClose} />}
        {(state.mode === 'add' || state.mode === 'edit') && (
          <ContactForm {...hook} onClose={hook.openList} />
        )}
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
});

export default EmergencyContactsModal;
