import React from 'react';
import { 
  View, 
  Text, 
  TextInput, 
  TouchableOpacity, 
  StyleSheet,
  Alert
} from 'react-native';
import { scale } from 'react-native-size-matters';
import Icon from 'react-native-vector-icons/MaterialIcons';

const AddressForm = ({ 
  state, 
  updateCurrentAddress, 
  saveAddress, 
  deleteAddress,
  openSearch,
  onClose 
}) => {
  const isEdit = state.mode === 'edit';
  const { currentAddress } = state;

  const handleSave = async () => {
    try {
      await saveAddress();
      // Success handled in hook - returns to list
    } catch (error) {
      Alert.alert("Erro", "Não foi possível salvar o endereço. Tente novamente.");
    }
  };

  const handleDelete = async () => {
    Alert.alert(
      "Confirmar",
      "Deseja realmente excluir este endereço?",
      [
        { text: "Cancelar", style: "cancel" },
        {
          text: "Excluir",
          style: "destructive",
          onPress: async () => {
            try {
              await deleteAddress(currentAddress.id);
            } catch (error) {
              Alert.alert("Erro", "Não foi possível excluir o endereço.");
            }
          }
        }
      ]
    );
  };

  // Calculate if save button should be enabled
  const canSave = currentAddress.name && currentAddress.coordinates;

  return (
    <View style={styles.container}>
      {/* Header - Same design as current AddressModal */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.closeButton} onPress={onClose}>
          <Icon name="close" size={scale(25)} />
        </TouchableOpacity>
        {isEdit && (
          <TouchableOpacity style={styles.deleteButton} onPress={handleDelete}>
            <Text style={styles.deleteText}>Apagar</Text>
          </TouchableOpacity>
        )}
      </View>

      {/* Title */}
      <Text style={styles.title}>
        {isEdit ? 'EDITAR' : 'NOVO'} ENDEREÇO
      </Text>

      {/* Name Input - Same design */}
      <TextInput
        style={styles.nameInput}
        placeholderTextColor="#808080"
        placeholder="Nome do endereço"
        value={currentAddress.name}
        onChangeText={(text) => updateCurrentAddress('name', text)}
      />

      {/* Address Input - Same design */}
      <View style={styles.addressContainer}>
        <TouchableOpacity style={styles.addressButton} onPress={openSearch}>
          <Text style={styles.addressText}>
            {currentAddress.description || "Localização"}
          </Text>
        </TouchableOpacity>
      </View>

      {/* Instructions Input - Same design */}
      <TextInput
        style={styles.instructionsInput}
        placeholderTextColor="#808080"
        placeholder="Instruções para o motorista"
        value={currentAddress.instructions}
        onChangeText={(text) => updateCurrentAddress('instructions', text)}
        multiline
      />

      {/* Save Button - Same design */}
      <TouchableOpacity 
        style={[styles.saveButton, !canSave && styles.saveButtonDisabled]}
        onPress={handleSave}
        disabled={state.isLoading || !canSave}
      >
        <Text style={styles.saveButtonText}>
          {state.isLoading ? 'SALVANDO...' : 'SALVAR'}
        </Text>
      </TouchableOpacity>
    </View>
  );
};

// Keep all existing styles from AddressModal.js
const styles = StyleSheet.create({
  container: {
    flex: 1,
    marginLeft: scale(10),
    marginRight: scale(10),
  },
  header: {
    flexDirection: "row", 
    justifyContent: "space-between"
  },
  closeButton: {
    width: scale(40),
    height: scale(40),
    borderRadius: scale(7),
    backgroundColor: "#fff",
    top: scale(15),
    marginLeft: scale(10),
    alignItems: 'center',
    justifyContent: 'center'
  },
  deleteButton: {
    top: scale(15), 
    marginRight: scale(10)
  },
  deleteText: {
    fontWeight: "500"
  },
  title: {
    fontSize: scale(20),
    marginLeft: scale(10),
    marginTop: scale(25),
    marginBottom: scale(20),
    alignSelf: "center",
    color: "#0089FF",
    fontWeight: "700",
  },
  nameInput: {
    borderRadius: scale(7),
    borderWidth: scale(3),
    borderColor: "#0089FF",
    fontSize: scale(18),
    padding: scale(8),
    marginBottom: scale(30),
  },
  addressContainer: {
    borderRadius: scale(7),
    borderWidth: scale(3),
    borderColor: "#0089FF",
    marginBottom: scale(30),
  },
  addressButton: {
    fontSize: scale(18),
    color: "#808080",
    padding: scale(8),
    marginBottom: scale(15),
  },
  addressText: {
    fontSize: scale(18),
  },
  instructionsInput: {
    borderRadius: scale(7),
    borderWidth: scale(3),
    borderColor: "#0089FF",
    fontSize: scale(18),
    paddingBottom: scale(70),
    padding: scale(8),
    marginBottom: scale(180),
  },
  saveButton: {
    backgroundColor: "#0089FF",
    borderRadius: scale(7),
    width: scale(300),
    alignItems: "center",
    alignSelf: "center",
    padding: scale(18),
  },
  saveButtonDisabled: {
    backgroundColor: "#ccc"
  },
  saveButtonText: {
    color: "#FFF", 
    fontWeight: "700"
  }
});

export default AddressForm;