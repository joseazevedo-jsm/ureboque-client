import React, { useEffect } from "react";
import { Dimensions, FlatList, Modal, StyleSheet, View } from 'react-native';
import { AppText as Text, AppTextInput as TextInput } from '../../common/AppText';
import { AppPressable as TouchableOpacity } from '../../common/AppPressable';

import { scale } from "react-native-size-matters";
import MaterialIcons from "@expo/vector-icons/MaterialIcons";
const Icon = MaterialIcons;
import { useSavedPlacesModal } from "./components/useSavedPlacesModal.js";
import {
  BottomSheetModal,
  BottomSheetModalProvider,
  BottomSheetTextInput,
} from "@gorhom/bottom-sheet";
import { useDestinationModal } from "../Destination/components/useDestinationModal";
import PlaceItem from "../../cards/placeItem";
import { spacing, typography, colors, borderRadius, borderWidths, shadows, sizes } from "../../../theme";
import { useAlert } from "../../../context/AlertContext";

const AddressModal = ({
  visible,
  closeModal,
  onGoHomePress,
  type,
  instructions,
  address,
  name,
  button,
  placeId,
  onAddressChange,
  onInstructionsChange,
  onPressItem,
  mapDrag,
  callbackAddress,
  onSaveAddress,
  onDeleteAddress,
  onAtualLocationPress,
}) => {
  const { models, operations } = useSavedPlacesModal();
  const destination = useDestinationModal();
  const { showAlert } = useAlert();



  const handeBackButtonPress = () => {
    closeModal();
  };



  const renderFlatListItem = ({ item }) => {
    const latitude = Number(item?.geometry?.location?.lat);
    const longitude = Number(item?.geometry?.location?.lng);
    if (!Number.isFinite(latitude) || !Number.isFinite(longitude)) return null;
    return (
      <PlaceItem
        key={item.place_id}
        name={item.name}
        iconUrl={item.icon}
        address={item.formatted_address}
        onPress={onPressItem(
          {
            latitude,
            longitude,
          },
          item.formatted_address,
          models.bottomSheetModalAddAddress,
          name
        )}
      />
    );
  };

  return (
    <Modal onRequestClose={closeModal} visible={visible} animationType="none">
      <View style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity
            style={styles.goback}
            onPress={handeBackButtonPress}
          >
            <Icon name="close" size={20} color={colors.textPrimary} />
          </TouchableOpacity>
          <TouchableOpacity
            style={{ top: scale(15), marginRight: spacing.sm }}
            onPress={() => {
              onDeleteAddress(placeId)
              onGoHomePress()
              closeModal()
            }}
          >
            {button && <Text style={{ fontWeight: "500" }}>Apagar</Text>}
          </TouchableOpacity>
        </View>

        <Text
          style={styles.title}
        >
          {type} ENDEREÇO
        </Text>
        <TextInput
          style={styles.input}
          placeholderTextColor={colors.textMuted}
          placeholder="Nome do endereço"
          defaultValue={name !== "" ? name : ""}
          onChangeText={onAddressChange}
        />
        <View
          style={styles.inputWrap}
        >
          <TouchableOpacity
              style={styles.locationInput}
            onPress={operations.handleLocationPress}
          >
            <Text
              style={{
                ...styles.inputText,
              }}
            >
              {address && address !== "" ? address : "Localização"}
            </Text>
          </TouchableOpacity>
        </View>

        <TextInput
          style={styles.instructions}
          placeholderTextColor={colors.textMuted}
          placeholder="Instruções para o motorista"
          defaultValue={
            instructions !== "" ? instructions : ""
          }
          onChangeText={onInstructionsChange}
        />

        <TouchableOpacity
          style={styles.saveButton}
          onPress={async () => {
            try {
              await onSaveAddress(callbackAddress, type)
              onGoHomePress()
              closeModal()
            } catch (error) {
              showAlert({
                type: 'error',
                title: 'Erro',
                message: 'Não foi possível salvar o endereço. Tente novamente.',
                buttons: [{ text: 'OK' }]
              })
            }
          }}
        >
          <Text style={styles.saveButtonText}>SALVAR</Text>
        </TouchableOpacity>
        <BottomSheetModalProvider>
          <BottomSheetModal
            ref={models.bottomSheetModalAddAddress}
            index={0}
            snapPoints={[Math.round(Dimensions.get('window').height * 0.68)]}
            enableDynamicSizing={false}
            keyboardBehavior="interactive"
            keyboardBlurBehavior="restore"
            android_keyboardInputMode="adjustResize"
          >
            <View style={styles.modalContainer}>
              <View style={styles.searchContainer}>
                <View
                  style={{
                    borderRadius: borderRadius.sm,
                    borderWidth: 2,
                    borderColor: colors.primary,
                    fontSize: typography.body.fontSize, lineHeight: typography.body.lineHeight,
                    padding: spacing.sm,
                    marginBottom: spacing.xl,
                    flexDirection: "row",
                  }}
                >
                  <Icon name="search" size={sizes.iconLarge} color={colors.border} />
                  <BottomSheetTextInput
                    style={{
                      fontSize: typography.bodySmall.fontSize, lineHeight: typography.bodySmall.lineHeight,
                      paddingHorizontal: spacing.sm,
                    }}
                    placeholderTextColor={colors.textMuted}
                    placeholder={"Escolha o seu destino"}
                    onChangeText={
                      destination.operations.handleDestinationInputValueChange
                    }
                  />
                </View>

                <TouchableOpacity onPress={() => {
                  onAtualLocationPress();
                  models.bottomSheetModalAddAddress.current.dismiss();
                }}>
                  <View style={styles.locationButton}>
                    <View style={styles.iconContainer}>
                      <Icon
                        name="navigation"
                        size={sizes.iconLarge}
                        color={colors.primary}
                      />
                    </View>
                    <Text style={styles.locationText}>
                      Localização atual
                    </Text>
                  </View>
                </TouchableOpacity>

                <TouchableOpacity onPress={
                  mapDrag
                }>
                  <View style={styles.locationButton}>
                    <View style={styles.iconContainer}>
                      <Icon name="map" size={sizes.iconLarge} color={colors.primary} />
                    </View>
                    <Text style={styles.locationText}>
                      Definir localização no mapa
                    </Text>
                  </View>
                </TouchableOpacity>
              </View>
              <View style={styles.resultsContainer}>
                <FlatList
                  data={destination.models?.queryResponseDataSave}
                  renderItem={renderFlatListItem}
                  keyboardShouldPersistTaps="always"
                  keyboardDismissMode="on-drag"
                  ItemSeparatorComponent={() => (
                    <View style={{ height: scale(15) }} />
                  )}
                />
              </View>
            </View>
          </BottomSheetModal>
        </BottomSheetModalProvider>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    marginLeft: spacing.sm,
    marginRight: spacing.sm,
  },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingTop: spacing.modalSafeTop, paddingHorizontal: spacing.xxl, paddingBottom: spacing.sm },
  goback: {
    width: sizes.control,
    height: sizes.control,
    borderRadius: borderRadius.full,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.borderLight,
    alignItems: 'center',
    justifyContent: 'center',
    ...shadows.sm,
  },
  title: { ...typography.h3, marginHorizontal: spacing.lg, marginTop: spacing.lg, marginBottom: spacing.lg, alignSelf: 'center' },
  input: { minHeight: sizes.control, borderRadius: borderRadius.md, borderWidth: borderWidths.thin, borderColor: colors.border, fontSize: typography.body.fontSize, lineHeight: typography.body.lineHeight, paddingHorizontal: spacing.lg, paddingVertical: spacing.md, marginHorizontal: spacing.lg, marginBottom: spacing.lg, backgroundColor: colors.surface, color: colors.textPrimary },
  inputWrap: { minHeight: sizes.control, borderRadius: borderRadius.md, borderWidth: borderWidths.thin, borderColor: colors.border, marginHorizontal: spacing.lg, marginBottom: spacing.lg, backgroundColor: colors.surface },
  locationInput: { minHeight: sizes.control, paddingHorizontal: spacing.lg, justifyContent: 'center' },
  inputText: { fontSize: typography.body.fontSize, lineHeight: typography.body.lineHeight, color: colors.textPrimary },
  instructions: { minHeight: 112, borderRadius: borderRadius.md, borderWidth: 1, borderColor: colors.border, fontSize: typography.body.fontSize, lineHeight: typography.body.lineHeight, padding: spacing.lg, marginHorizontal: spacing.lg, marginBottom: spacing.lg, backgroundColor: colors.surface, color: colors.textPrimary, textAlignVertical: 'top' },
  iconContainer: {
    height: scale(45),
    width: scale(45),
    borderRadius: borderRadius.sm,
    borderWidth: 2,
    borderColor: colors.primary,
    alignItems: "center",
    justifyContent: "center",
    marginRight: spacing.sm,
  },
  saveButton: {
    backgroundColor: colors.primary,
    borderRadius: borderRadius.md,
    width: 'auto',
    marginHorizontal: spacing.lg,
    minHeight: sizes.controlLarge,
    alignItems: "center",
    alignSelf: "center",
    paddingVertical: spacing.lg,
    ...shadows.primaryGlow,
  },
  saveButtonText: {
    color: colors.surface,
    fontWeight: "700",
    fontSize: typography.body.fontSize, lineHeight: typography.body.lineHeight,
  },
  modalContainer: {
    backgroundColor: colors.border,
    flex: 1,
  },
  searchContainer: {
    backgroundColor: colors.surface,
    borderRadius: borderRadius.sm,
    marginBottom: spacing.xs,
    padding: spacing.sm,
  },
  locationButton: {
    flexDirection: "row",
    marginBottom: spacing.lg,
    alignItems: "center",
  },
  locationText: {
    color: colors.textPrimary,
    fontSize: typography.bodySmall.fontSize, lineHeight: typography.bodySmall.lineHeight,
    paddingHorizontal: spacing.sm,
    textAlignVertical: "center",
  },
  resultsContainer: {
    backgroundColor: colors.surface,
    borderRadius: borderRadius.sm,
    flex: 1,
  }
});
export default AddressModal;
