import React from "react";
import {
  FlatList,
  Modal,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { scale } from "react-native-size-matters";
import MaterialIcons from "@expo/vector-icons/MaterialIcons";
const Icon = MaterialIcons;
import PlaceSavedItem from "../../cards/placeSavedItem";
import { useSavedPlacesModal } from "./components/useSavedPlacesModal.js";
import AddressModal from "./AddressModal";
import { useLogger } from "../../../hooks/useLogger";
import { colors, borderRadius, shadows, spacing } from "../../../theme";

import { ICON_ADD, getPlaceIcon } from "../../../assets/icons";

const SavedPlacesModal = ({
  visible,
  closeModal,
  addressCallBack,
  mapDrag,
}) => {
  const logger = useLogger("SavedPlacesModal");
  const { models, operations } = useSavedPlacesModal();
  logger.debug("Modal props received", { addressCallBack, mapDrag });

  const renderFlatListItem = ({ item }) => {
    const place = item?.place || {};
    const placeName = place.name || 'Local guardado';
    const isAddHome =
      placeName === "Adicionar Casa" && !place.coordinates;
    const isAddWork =
      placeName === "Adicionar Trabalho" && !place.coordinates;

    if (isAddHome || isAddWork) {
      return (
        <PlaceSavedItem
          key={item._id}
          place={place}
          edit={models.edit}
          onPressEditItem={operations.handleAddFavouriteButtonPress()}
          add={true}
          iconSource={getPlaceIcon(placeName)}
        />
      );
    }

    return (
      <PlaceSavedItem
        key={item._id}
        place={place}
        edit={models.edit}
        onPressEditItem={operations.handleAddressEditButtonPress(
          item.place,
          item._id
        )}
        add={false}
        iconSource={getPlaceIcon(placeName)}
        description={place.description || place.address}
      />
    );
  };

  return (
    <>
      <Modal
        onRequestClose={closeModal}
        visible={visible}
        animationType="slide"
        transparent={true}
      >
        <TouchableOpacity
          style={styles.overlay}
          activeOpacity={1}
          onPress={closeModal}
        >
          <View style={styles.modalContent}>
            <TouchableOpacity activeOpacity={1} style={styles.contentWrapper}>
              {/* Header */}
              <View style={styles.header}>
                <TouchableOpacity
                  style={styles.circleButton}
                  onPress={closeModal}
                  accessibilityLabel="Fechar"
                  accessibilityRole="button"
                >
                  <Icon name="close" size={scale(20)} color={colors.textPrimary} />
                </TouchableOpacity>

                <View style={styles.headerCenter}>
                  <Text style={styles.title}>Lugares Salvos</Text>
                  <Text style={styles.subtitle}>Acelere o pedido de reboques.</Text>
                </View>

                <TouchableOpacity
                  style={styles.circleButton}
                  onPress={operations.handleEditPress}
                  accessibilityLabel="Editar lugares"
                  accessibilityRole="button"
                >
                  <Icon name="edit" size={scale(20)} color={colors.primary} />
                </TouchableOpacity>
              </View>

              {/* List */}
              <View style={styles.listContainer}>
                <FlatList
                  data={models.savedPlaces}
                  renderItem={renderFlatListItem}
                  keyExtractor={(item, index) => String(item?._id ?? `saved-place-${index}`)}
                  keyboardShouldPersistTaps="always"
                  keyboardDismissMode="on-drag"
                  showsVerticalScrollIndicator={false}
                  ListFooterComponent={
                    <PlaceSavedItem
                      place={{ name: "Adicionar" }}
                      add={true}
                      iconSource={ICON_ADD}
                      description="Novo endereço personalizado"
                      onPressEditItem={operations.handleAddFavouriteButtonPress()}
                    />
                  }
                />
              </View>
            </TouchableOpacity>
          </View>
        </TouchableOpacity>
      </Modal>

      <AddressModal
        visible={
          addressCallBack?.callback !== undefined
            ? addressCallBack.callback
            : models.addressModalVisible
        }
        closeModal={operations.handeBackButtonPress}
        onGoHomePress={closeModal}
        type={models.type}
        button={models.button}
        address={addressCallBack.city ? addressCallBack.city : models.address}
        name={models.name}
        instructions={models.instructions}
        placeId={models.placeId}
        onAddressChange={operations.handleNameChangeText}
        onInstructionsChange={operations.handleInstructionsChangeText}
        onPressItem={operations.handlePressItemPress}
        onSaveAddress={operations.handleSaveFavouriteButtonPress}
        onDeleteAddress={operations.handleDeleteFavouriteButtonPress}
        mapDrag={mapDrag}
        callbackAddress={addressCallBack}
        onAtualLocationPress={operations.handleCurrentLocationPress}
      />
    </>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "flex-end",
  },
  modalContent: {
    backgroundColor: colors.background,
    borderTopLeftRadius: scale(25),
    borderTopRightRadius: scale(25),
    height: "85%",
    ...shadows.lg,
  },
  contentWrapper: {
    flex: 1,
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.xl,
  },
  header: {
    flexDirection: "row",
    alignItems: "flex-start",
    justifyContent: "space-between",
    marginBottom: spacing.xl,
  },
  circleButton: {
    width: scale(40),
    height: scale(40),
    borderRadius: scale(20),
    backgroundColor: colors.surface,
    justifyContent: "center",
    alignItems: "center",
    ...shadows.md,
  },
  headerCenter: {
    flex: 1,
    alignItems: "center",
    paddingHorizontal: spacing.sm,
  },
  title: {
    fontSize: scale(18),
    fontWeight: "800",
    color: colors.textPrimary,
  },
  subtitle: {
    fontSize: scale(13),
    color: colors.textSecondary,
    marginTop: scale(2),
    textAlign: "center",
  },
  listContainer: {
    flex: 1,
    paddingBottom: spacing.lg,
  },
});

export default SavedPlacesModal;
