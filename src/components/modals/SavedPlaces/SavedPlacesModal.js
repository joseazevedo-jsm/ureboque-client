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
import Icon from "react-native-vector-icons/MaterialIcons";
import PlaceSavedItem from "../../cards/placeSavedItem";
import { useSavedPlacesModal } from "./components/useSavedPlacesModal.js";
import AddressModal from "./AddressModal";
import { useLogger } from "../../../hooks/useLogger";
import { colors, borderRadius, shadows } from "../../../theme";

const SavedPlacesModal = ({
  visible,
  closeModal,
  addressCallBack,
  mapDrag,
}) => {
  const logger = useLogger('SavedPlacesModal');

  const { models, operations } = useSavedPlacesModal();
  logger.debug("Modal props received", { addressCallBack, mapDrag });
  const handeBackButtonPress = () => {
    closeModal();
  };

  const renderFlatListItem = ({ item }) => {
    if (item.place.name === "Adicionar Casa" && !item.place.coordinates) {
      return (
        <PlaceSavedItem
          key={item.id}
          place={item.place}
          edit={models.edit}
          onPressEditItem={operations.handleAddFavouriteButtonPress()}
          add={true}
        />
      );
    }

    if (item.place.name === "Adicionar Trabalho" && !item.place.coordinates) {
      return (
        <PlaceSavedItem
          key={item.id}
          place={item.place}
          edit={models.edit}
          onPressEditItem={operations.handleAddFavouriteButtonPress()}
          add={true}
        />
      );
    }

    return (
      <PlaceSavedItem
        key={item.id}
        place={item.place}
        edit={models.edit}
        onPressEditItem={operations.handleAddressEditButtonPress(
          item.place,
          item._id
        )}
        add={false}
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
            <View style={styles.contentWrapper}>
              <View style={styles.header}>
                <TouchableOpacity
                  style={styles.goback}
                  onPress={handeBackButtonPress}
                >
                  <Icon name="close" size={scale(25)} color={colors.textPrimary} />
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.editButton}
                  onPress={operations.handleEditPress}
                >
                  <Text style={styles.editText}>Editar</Text>
                </TouchableOpacity>
              </View>

              <Text style={styles.title}>LUGARES SALVOS</Text>
              <Text style={styles.subtitle}>
                O motorista irá levá-lo exatamente onde você está indo!
              </Text>

              <View style={styles.listContainer}>
                <FlatList
                  data={models.savedPlaces}
                  renderItem={renderFlatListItem}
                  keyExtractor={(item) => item._id.toString()}
                  keyboardShouldPersistTaps="always"
                  keyboardDismissMode="on-drag"
                  ItemSeparatorComponent={() => (
                    <View style={{ height: scale(15) }} />
                  )}
                  showsVerticalScrollIndicator={false}
                />
                <TouchableOpacity
                  style={styles.addButton}
                  onPress={operations.handleAddFavouriteButtonPress()}
                >
                  <Text style={styles.addButtonText}>
                    ADICIONAR LUGAR
                  </Text>
                </TouchableOpacity>
              </View>
            </View>
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
    ...shadows.xl,

  },
  contentWrapper: {
    flex: 1,
    paddingHorizontal: scale(20),
    paddingTop: scale(30),
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: scale(20),
  },
  goback: {
    width: scale(40),
    height: scale(40),
    borderRadius: scale(20),
    backgroundColor: colors.surface,
    justifyContent: "center",
    alignItems: "center",
    ...shadows.sm,
  },
  editButton: {
    padding: scale(8),
  },
  editText: {
    fontWeight: "700",
    color: colors.primary,
    fontSize: scale(14),
  },
  title: {
    fontSize: scale(22),
    color: colors.primary,
    fontWeight: "800",
    marginTop: scale(20),
  },
  subtitle: {
    fontSize: scale(12),
    color: colors.textMuted,
    marginTop: scale(8),
    lineHeight: scale(18),
  },
  listContainer: {
    flex: 1,
    marginTop: scale(40),
    paddingBottom: scale(20),
  },
  addButton: {
    borderColor: colors.primary,
    borderWidth: 2,
    borderRadius: borderRadius.md,
    width: "100%",
    alignItems: "center",
    alignSelf: "center",
    padding: scale(16),
    backgroundColor: colors.surface,
    marginTop: scale(15),
    marginBottom: scale(10),
    ...shadows.sm,
  },
  addButtonText: {
    color: colors.primary,
    fontWeight: "700",
    fontSize: scale(14),
  },
});
export default SavedPlacesModal;
