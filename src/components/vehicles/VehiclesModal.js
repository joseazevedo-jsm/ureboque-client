import React from 'react';
import { Modal, View, StyleSheet } from 'react-native';
import { useVehicles } from './hooks/useVehicles';
import VehiclesList from './components/VehiclesList';
import VehicleForm from './components/VehicleForm';
import { colors } from '../../theme';

const VehiclesModal = ({ visible, onClose }) => {
  const hook = useVehicles();
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
        {state.mode === 'list' && <VehiclesList {...hook} onClose={handleClose} />}
        {(state.mode === 'add' || state.mode === 'edit') && (
          <VehicleForm {...hook} onClose={hook.openList} />
        )}
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
});

export default VehiclesModal;
