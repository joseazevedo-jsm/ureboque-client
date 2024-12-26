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

const SavedPlacesModal = ({
  visible,
  closeModal,
  addressCallBack,
  mapDrag,
}) => {
  const { models, operations } = useSavedPlacesModal();
  console.log(addressCallBack, mapDrag);
  const handeBackButtonPress = () => {
    closeModal();
  };

  const renderFlatListItem = ({ item }) => {
    //console.log(item.place.name);

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
      >
        <View style={styles.container}>
          <View
            style={{ flexDirection: "row", justifyContent: "space-between" }}
          >
            <TouchableOpacity
              style={styles.goback}
              onPress={handeBackButtonPress}
            >
              <Icon name="close" size={scale(25)} />
            </TouchableOpacity>
            <TouchableOpacity
              style={{ top: scale(15), marginRight: scale(10) }}
              onPress={operations.handleEditPress}
            >
              <Text style={{ fontWeight: "500" }}>Editar</Text>
            </TouchableOpacity>
          </View>

          <Text
            style={{
              fontSize: scale(20),
              marginLeft: scale(10),
              marginTop: scale(25),
              color: "#0089FF",
              fontWeight: "700",
            }}
          >
            LUGAGES SALVOS
          </Text>
          <Text
            style={{
              marginLeft: scale(10),
              fontSize: scale(11),
            }}
          >
            O motorista irá levá-lo exatamente onde você está indo!
          </Text>
          <View
            style={{
              marginLeft: scale(10),
              marginTop: scale(40),
              height: "75%",
            }}
          >
            <FlatList
              data={models.savedPlaces}
              renderItem={renderFlatListItem}
              keyExtractor={(item) => item._id.toString()}
              keyboardShouldPersistTaps="always"
              keyboardDismissMode="on-drag"
              ItemSeparatorComponent={() => (
                <View style={{ height: scale(15) }} />
              )}
            />
            <TouchableOpacity
              style={{
                borderColor: "#0089FF",
                borderWidth: scale(3),
                borderRadius: scale(7),
                width: scale(300),
                alignItems: "center",
                alignSelf: "center",
                padding: scale(18),
              }}
              onPress={operations.handleAddFavouriteButtonPress()}
            >
              <Text style={{ color: "#0089FF", fontWeight: "700" }}>
                ADICIONAR LUGAR
              </Text>
            </TouchableOpacity>
          </View>
        </View>
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
  container: {
    flex: 1,
  },
  goback: {
    width: scale(40),
    height: scale(40),
    borderRadius: scale(7),
    backgroundColor: "#fff",
    top: scale(15),
    marginLeft: scale(10),
  },
});
export default SavedPlacesModal;
