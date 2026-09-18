import React from "react";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { FlatList, Modal, StyleSheet, View } from 'react-native';
import { AppText as Text } from '../../common/AppText';
import { AppPressable as TouchableOpacity } from '../../common/AppPressable';
import { AppHeader } from '../../common/AppHeader';

import MaterialIcons from "@expo/vector-icons/MaterialIcons";
const Icon = MaterialIcons;
import PlaceSavedItem from "../../cards/placeSavedItem";
import { useSavedPlacesModal } from "./components/useSavedPlacesModal.js";
import AddressModal from "./AddressModal";
import { useLogger } from "../../../hooks/useLogger";
import { colors, spacing, borderRadius, shadows, typography, sizes, layout } from "../../../theme";

import { ICON_ADD, getPlaceIcon } from "../../../assets/icons";

const SavedPlacesModal = ({
  visible,
  closeModal,
  addressCallBack,
  mapDrag,
}) => {
  const insets = useSafeAreaInsets();
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
          <View style={[styles.modalContent, { paddingBottom: insets.bottom }]}>
            <TouchableOpacity activeOpacity={1} style={styles.contentWrapper}>
              <AppHeader title="Lugares Salvos" subtitle="Acelere o pedido de reboques."
                leftIcon="close" leftLabel="Fechar lugares salvos" onLeftPress={closeModal}
                rightIcon={models.edit ? 'done' : 'edit'} rightLabel={models.edit ? 'Concluir edição' : 'Editar lugares'}
                rightSelected={models.edit} onRightPress={operations.handleEditPress} safeArea={false} />

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
        address={addressCallBack?.city ? addressCallBack.city : models.address}
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
    backgroundColor: colors.overlay,
    justifyContent: "flex-end",
  },
  modalContent: {
    backgroundColor: colors.background,
    borderTopLeftRadius: borderRadius.xxl,
    borderTopRightRadius: borderRadius.xxl,
    height: "85%",
    width: "100%",
    maxWidth: layout.sheetMaxWidth,
    alignSelf: "center",
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
    width: sizes.control,
    height: sizes.control,
    borderRadius: borderRadius.full,
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
    ...typography.h3,
    color: colors.textPrimary,
  },
  subtitle: {
    ...typography.caption,
    color: colors.textSecondary,
    marginTop: spacing.xs,
    textAlign: "center",
  },
  listContainer: {
    flex: 1,
    paddingBottom: spacing.lg,
  },
});

export default SavedPlacesModal;
