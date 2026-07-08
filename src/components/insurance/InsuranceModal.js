import React from 'react';
import { Modal, View, StyleSheet } from 'react-native';
import { useInsurance } from './hooks/useInsurance';
import InsuranceList from './components/InsuranceList';
import InsuranceForm from './components/InsuranceForm';
import { colors } from '../../theme';

const InsuranceModal = ({ visible, onClose }) => {
  const hook = useInsurance();
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
        {state.mode === 'list' && <InsuranceList {...hook} onClose={handleClose} />}
        {(state.mode === 'add' || state.mode === 'edit') && (
          <InsuranceForm {...hook} onClose={hook.openList} />
        )}
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
});

export default InsuranceModal;
