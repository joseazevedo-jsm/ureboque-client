import React from "react";
import {
  FlatList,
  Modal,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  TextInput, // Added TextInput
  Platform, // Added Platform
} from "react-native";
import { scale } from "react-native-size-matters";
import Icon from "react-native-vector-icons/MaterialIcons";
import { useDestinationModal } from "./components/useDestinationModal";

const DestinationModal = ({
  visible,
  closeModal,
  onPlaceItemPress,
  onMarkerDragPress,
  onLocationTextInputFocus,
  origin,
  destination,
  inputCurr,
}) => {
  const { models, operations } = useDestinationModal();

  return (
    <Modal animationType="slide" transparent={false} visible={visible} onRequestClose={closeModal}>
      <View style={styles.container}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={closeModal} style={styles.closeButton}>
            <Icon name="close" size={scale(24)} color="#1E293B" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>PARA ONDE VAMOS?</Text>
          <View style={{ width: scale(40) }} />
        </View>

        {/* Inputs Group */}
        <View style={styles.inputsGroup}>
          {/* Origin Input */}
          <TouchableOpacity
            style={[styles.inputRow, models.activeInput === 'origin' && styles.inputRowActive]}
            onPress={operations.handleOriginFocus}
            activeOpacity={0.7}
          >
            <View style={[styles.iconBubble, { backgroundColor: '#E0F2FE' }]}>
              <Icon name="my-location" size={scale(20)} color="#0089FF" />
            </View>
            <View style={styles.textInputContainer}>
              <Text style={styles.label}>De onde?</Text>
              <TextInput
                style={styles.textInput}
                placeholder="Localização atual"
                value={models.activeInput === 'origin' ? models.origin : origin}
                placeholderTextColor="#94A3B8"
                onChangeText={operations.handleOriginChange}
                onFocus={operations.handleOriginFocus}
              />
            </View>
          </TouchableOpacity>

          <View style={styles.connectorLine} />

          {/* Destination Input */}
          <TouchableOpacity
            style={[styles.inputRow, models.activeInput === 'destination' && styles.inputRowActive]}
            onPress={operations.handleDestinationFocus}
            activeOpacity={0.7}
          >
            <View style={[styles.iconBubble, { backgroundColor: '#FEE2E2' }]}>
              <Icon name="place" size={scale(20)} color="#EF4444" />
            </View>
            <View style={styles.textInputContainer}>
              <Text style={styles.label}>Para onde?</Text>
              <TextInput
                style={styles.textInput}
                placeholder="Para onde está indo?"
                placeholderTextColor="#94A3B8"
                value={models.destination}
                onChangeText={operations.handleDestinationChange}
                onFocus={operations.handleDestinationFocus}
                autoFocus={true}
              />
            </View>
          </TouchableOpacity>
        </View>

        {/* Drag on Map Option */}
        <TouchableOpacity style={styles.mapOption} onPress={onMarkerDragPress}>
          <View style={[styles.iconBubble, { backgroundColor: '#F0FDF4' }]}>
            <Icon name="map" size={scale(20)} color="#16A34A" />
          </View>
          <Text style={styles.mapOptionText}>Definir localização no mapa</Text>
          <Icon name="chevron-right" size={scale(20)} color="#CBD5E1" />
        </TouchableOpacity>

        <View style={styles.divider} />

        {/* Results List */}
        <View style={styles.listContainer}>
          <Text style={styles.sectionTitle}>Sugestões</Text>
          <FlatList
            data={models.places}
            initialNumToRender={5}
            maxToRenderPerBatch={5}
            enableEmptySections={true}
            renderItem={({ item, index }) => (
              <TouchableOpacity
                key={index}
                style={styles.suggestionItem}
                onPress={() => {
                  onPlaceItemPress(item, models.activeInput);
                  if (models.activeInput === 'origin') {
                    operations.handleDestinationFocus();
                  }
                }}
              >
                <View style={[styles.iconBubble, { backgroundColor: '#F1F5F9' }]}>
                  <Icon
                    name={item.place_id === -1 ? "map" : item.place_id === 0 ? "my-location" : "place"}
                    size={scale(20)}
                    color="#64748B"
                  />
                </View>
                <View style={styles.suggestionText}>
                  <Text style={styles.suggestionTitle} numberOfLines={1}>{item.name}</Text>
                  {item.formatted_address && (
                    <Text style={styles.suggestionAddress} numberOfLines={1}>{item.formatted_address}</Text>
                  )}
                </View>
                <Icon name="chevron-right" size={scale(20)} color="#CBD5E1" />
              </TouchableOpacity>
            )}
            keyboardShouldPersistTaps="always"
            showsVerticalScrollIndicator={false}
          />
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F8FAFC", // Slate 50
    paddingTop: Platform.OS === 'ios' ? scale(50) : scale(20),
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: scale(20),
    marginBottom: scale(20),
  },
  closeButton: {
    padding: scale(8),
    borderRadius: scale(20),
    backgroundColor: '#fff',
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  headerTitle: {
    fontSize: scale(16),
    fontWeight: '800',
    color: '#1E293B',
    letterSpacing: 0.5,
  },
  inputsGroup: {
    backgroundColor: '#fff',
    marginHorizontal: scale(20),
    borderRadius: scale(20),
    padding: scale(16),
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 12,
    elevation: 4,
    marginBottom: scale(20),
  },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: scale(10),
    borderRadius: scale(14),
    backgroundColor: '#F8FAFC',
  },
  inputRowActive: {
    backgroundColor: '#E0F2FE',
    borderWidth: 1.5,
    borderColor: '#0089FF',
  },
  textInputContainer: {
    flex: 1,
    marginLeft: scale(16),
  },
  label: {
    fontSize: scale(11),
    color: '#64748B',
    fontWeight: '600',
    marginBottom: scale(2),
    textTransform: 'uppercase',
  },
  textInput: {
    fontSize: scale(16),
    color: '#1E293B',
    fontWeight: '600',
    paddingVertical: scale(4),
  },
  activeInput: {
    color: '#1E293B',
  },
  iconBubble: {
    width: scale(40),
    height: scale(40),
    borderRadius: scale(16),
    justifyContent: 'center',
    alignItems: 'center',
  },
  connectorLine: {
    width: 2,
    height: scale(20),
    backgroundColor: '#E2E8F0', // Slate 200
    marginLeft: scale(30), // Center with bubble
    marginVertical: scale(4),
  },
  mapOption: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    marginHorizontal: scale(20),
    padding: scale(12),
    borderRadius: scale(16),
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.03,
    shadowRadius: 6,
    elevation: 2,
  },
  mapOptionText: {
    flex: 1,
    fontSize: scale(15),
    fontWeight: '600',
    color: '#1E293B',
    marginLeft: scale(16),
  },
  divider: {
    height: 1,
    backgroundColor: '#E2E8F0',
    marginVertical: scale(24),
    marginHorizontal: scale(20),
  },
  listContainer: {
    flex: 1,
    paddingHorizontal: scale(20),
  },
  sectionTitle: {
    fontSize: scale(14),
    fontWeight: '700',
    color: '#64748B',
    marginBottom: scale(12),
    marginLeft: scale(4),
  },
  suggestionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    padding: scale(12),
    borderRadius: scale(12),
    marginBottom: scale(8),
  },
  suggestionText: {
    flex: 1,
    marginLeft: scale(12),
  },
  suggestionTitle: {
    fontSize: scale(14),
    fontWeight: '600',
    color: '#1E293B',
  },
  suggestionAddress: {
    fontSize: scale(12),
    color: '#64748B',
    marginTop: scale(2),
  },
});

export default DestinationModal;
