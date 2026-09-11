import React from "react";
import {
  FlatList,
  Modal,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  TextInput,
  KeyboardAvoidingView,
  Platform,
  TouchableWithoutFeedback,
  Keyboard,
} from "react-native";
import { scale } from "react-native-size-matters";
import MaterialIcons from "@expo/vector-icons/MaterialIcons";
const Icon = MaterialIcons;
import { useDestinationModal } from "./components/useDestinationModal";
import { colors, spacing, shadows, borderRadius, animations } from "../../../theme";
import Animated, { FadeInDown } from "react-native-reanimated";

const DestinationModal = ({
  visible,
  closeModal,
  onPlaceItemPress,
  onMarkerDragPress,
  onLocationTextInputFocus,
  origin,
  destination,
  inputCurr,
  activeInputIndex,
  userLocation,
}) => {
  const { models, operations } = useDestinationModal(
    inputCurr,
    activeInputIndex,
    origin,
    destination,
    userLocation
  );

  return (
    <Modal animationType="slide" transparent={false} visible={visible} onRequestClose={closeModal}>
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={styles.container}
      >
        <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
          <View style={{ flex: 1 }}>
            {/* Header */}
            <View style={styles.header}>
              <TouchableOpacity onPress={closeModal} style={styles.closeButton}>
                <Icon name="close" size={scale(20)} color={colors.textPrimary} />
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
                <View style={[styles.iconBubble, { backgroundColor: colors.originBubble }]}>
                  <Icon name="my-location" size={scale(20)} color={colors.primary} />
                </View>
                <View style={styles.textInputContainer}>
                  <Text style={styles.label}>De onde?</Text>
                  <TextInput
                    style={styles.textInput}
                    placeholder={origin || "De onde vamos sair?"}
                    value={models.originInputValue}
                    placeholderTextColor={colors.textMuted}
                    onChangeText={operations.handleOriginChange}
                    onFocus={() => {
                      operations.handleOriginFocus();
                      onLocationTextInputFocus(0);
                    }}
                    selectTextOnFocus={true}
                    clearButtonMode="while-editing"
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
                <View style={[styles.iconBubble, { backgroundColor: colors.destinationBubble }]}>
                  <Icon name="place" size={scale(20)} color={colors.error} />
                </View>
                <View style={styles.textInputContainer}>
                  <Text style={styles.label}>Para onde?</Text>
                  <TextInput
                    style={styles.textInput}
                    placeholder={destination || "Para onde está indo?"}
                    placeholderTextColor={colors.textMuted}
                    value={models.destinationInputValue}
                    onChangeText={operations.handleDestinationChange}
                    onFocus={() => {
                      operations.handleDestinationFocus();
                      onLocationTextInputFocus(1);
                    }}
                    autoFocus={true}
                  />
                </View>
              </TouchableOpacity>
            </View>

            <View style={styles.divider} />

            {/* Results List */}
            <View style={styles.listContainer}>
              <Text style={styles.sectionTitle}>Sugestões</Text>
              {models.searchFailed && (
                <Text style={styles.searchErrorText}>
                  Não foi possível pesquisar endereços. Verifique a sua ligação à internet.
                </Text>
              )}
              <FlatList
                data={models.places}
                initialNumToRender={5}
                maxToRenderPerBatch={5}
                enableEmptySections={true}
                renderItem={({ item, index }) => (
                  <Animated.View entering={FadeInDown.delay(index * animations.stagger.fast).springify().damping(28).stiffness(180)}>
                    <TouchableOpacity
                      style={styles.suggestionItem}
                      onPress={() => {
                        if (item.isMapOption) {
                          onMarkerDragPress();
                          return;
                        }
                        onPlaceItemPress(item, models.activeInput);
                        if (models.activeInput === 'origin') {
                          operations.handleDestinationFocus();
                        }
                      }}
                    >
                      <View style={[styles.iconBubble, { backgroundColor: item.isMapOption ? colors.mapOptionBubble : colors.background }]}>
                        <Icon
                          name={item.place_id === -1 ? "map" : item.place_id === 0 ? "my-location" : "place"}
                          size={scale(20)}
                          color={item.isMapOption ? colors.mapOptionIcon : colors.textSecondary}
                        />
                      </View>
                      <View style={styles.suggestionText}>
                        <Text style={styles.suggestionTitle} numberOfLines={1}>{item.name}</Text>
                        {item.formatted_address && (
                          <Text style={styles.suggestionAddress} numberOfLines={1}>{item.formatted_address}</Text>
                        )}
                      </View>
                      {item.distanceKm != null && (
                        <Text style={styles.suggestionDistance}>
                          {item.distanceKm < 1
                            ? `${Math.round(item.distanceKm * 1000)} m`
                            : `${item.distanceKm.toFixed(1)} km`}
                        </Text>
                      )}
                      <Icon name="chevron-right" size={scale(20)} color={colors.textDisabled} />
                    </TouchableOpacity>
                  </Animated.View>
                )}
                keyboardShouldPersistTaps="always"
                showsVerticalScrollIndicator={false}
              />
            </View>
          </View>
        </TouchableWithoutFeedback>
      </KeyboardAvoidingView>
    </Modal>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
    paddingTop: spacing.modalSafeTop,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.sm,
    marginBottom: spacing.xs,
  },
  closeButton: {
    width: scale(36),
    height: scale(36),
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: borderRadius.full,
    backgroundColor: colors.surface,
    ...shadows.sm,
  },
  headerTitle: {
    fontSize: scale(14),
    fontWeight: '800',
    color: colors.textPrimary,
    letterSpacing: 0.5,
  },
  inputsGroup: {
    backgroundColor: colors.surface,
    marginHorizontal: spacing.xl,
    borderRadius: borderRadius.xxl,
    padding: spacing.md,
    ...shadows.md,
    marginBottom: spacing.md,
  },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: scale(6),
    borderRadius: borderRadius.lg,
    backgroundColor: colors.background,
  },
  inputRowActive: {
    backgroundColor: colors.originBubble,
    borderWidth: 1.5,
    borderColor: colors.primary,
  },
  textInputContainer: {
    flex: 1,
    marginLeft: spacing.md,
  },
  label: {
    fontSize: scale(10),
    color: colors.textSecondary,
    fontWeight: '600',
    marginBottom: scale(1),
    textTransform: 'uppercase',
  },
  textInput: {
    fontSize: scale(14),
    color: colors.textPrimary,
    fontWeight: '600',
    paddingVertical: scale(2),
  },
  activeInput: {
    color: colors.textPrimary,
  },
  iconBubble: {
    width: scale(34),
    height: scale(34),
    borderRadius: borderRadius.xl,
    justifyContent: 'center',
    alignItems: 'center',
  },
  connectorLine: {
    width: 2,
    height: scale(12),
    backgroundColor: colors.borderLight,
    marginLeft: scale(23),
    marginVertical: scale(2),
  },
  divider: {
    height: 1,
    backgroundColor: colors.borderLight,
    marginVertical: spacing.md,
    marginHorizontal: spacing.xl,
  },
  listContainer: {
    flex: 1,
    paddingHorizontal: spacing.xl,
  },
  searchErrorText: {
    fontSize: scale(13),
    color: '#F44336',
    marginBottom: spacing.md,
    marginLeft: scale(4),
  },
  sectionTitle: {
    fontSize: scale(14),
    fontWeight: '700',
    color: colors.textSecondary,
    marginBottom: spacing.md,
    marginLeft: scale(4),
  },
  suggestionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    padding: spacing.md,
    borderRadius: borderRadius.md,
    marginBottom: spacing.sm,
  },
  suggestionText: {
    flex: 1,
    marginLeft: spacing.md,
  },
  suggestionTitle: {
    fontSize: scale(14),
    fontWeight: '600',
    color: colors.textPrimary,
  },
  suggestionAddress: {
    fontSize: scale(12),
    color: colors.textSecondary,
    marginTop: scale(2),
  },
  suggestionDistance: {
    fontSize: scale(12),
    color: colors.textMuted,
    marginRight: spacing.xs,
  },
});

export default DestinationModal;
