import React, { useEffect } from "react";
import {
  FlatList,
  Modal,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { scale } from "react-native-size-matters";
import Icon from "react-native-vector-icons/MaterialIcons";
import PlaceSavedItem from "../../cards/placeSavedItem";
import { useSavedPlacesModal } from "./components/useSavedPlacesModal.js";
import {
  BottomSheetModal,
  BottomSheetModalProvider,
  BottomSheetTextInput,
} from "@gorhom/bottom-sheet";
import { useDestinationModal } from "../Destination/components/useDestinationModal";
import PlaceItem from "../../cards/placeItem";

const AddressModal = ({
  visible,
  closeModal,
  type,
  address,
  name,
  description,
  button,
  onPlaceItemPress,
  onSaveAddress,
  mapDrag,
  callbackAddress,
}) => {
  const { models, operations } = useSavedPlacesModal();
  const destination = useDestinationModal();
  const handeBackButtonPress = () => {
    closeModal();
  };

  // useEffect(() => {
  //   console.log("coords", coords);
  //   if (coords) {
  //     operations.addCoords(coords);
  //   }
  // }, [coords])

  const renderFlatListItem = ({ item }) => {
    return (
      <PlaceItem
        key={item.place_id}
        name={item.name}
        iconUrl={item.icon}
        address={item.formatted_address}
        onPress={onPlaceItemPress(
          {
            latitude: item.geometry.location.lat,
            longitude: item.geometry.location.lng,
          },
          item.formatted_address,
          models.bottomSheetModalAddAddress,
          models.name
        )}
      />
    );
  };

  return (
    <Modal onRequestClose={closeModal} visible={visible} animationType="none">
      <View style={styles.container}>
        <View style={{ flexDirection: "row", justifyContent: "space-between" }}>
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
            {button && <Text style={{ fontWeight: "500" }}>Apagar</Text>}
          </TouchableOpacity>
        </View>

        <Text
          style={{
            fontSize: scale(20),
            marginLeft: scale(10),
            marginTop: scale(25),
            marginBottom: scale(20),
            alignSelf: "center",
            color: "#0089FF",
            fontWeight: "700",
          }}
        >
          {type} ENDEREÇO
        </Text>
        <TextInput
          style={{
            borderRadius: scale(7),
            borderWidth: scale(3),
            borderColor: "#0089FF",
            fontSize: scale(18),
            padding: scale(8),
            marginBottom: scale(30),
          }}
          placeholderTextColor="#808080"
          defaultValue={name !== "" ? name : "Nome"}
          // value={models.name ? models.name : "Nome"}
          onChangeText={operations.handleNameChangeText}
        />
        <View
          style={{
            borderRadius: scale(7),
            borderWidth: scale(3),
            borderColor: "#0089FF",
            marginBottom: scale(30),
          }}
        >
          <TouchableOpacity
            style={{
              fontSize: scale(18),
              color: "#808080",
              padding: scale(8),
              marginBottom: scale(15),
            }}
            onPress={operations.handleLocationPress}
          >
            <Text
              style={{
                fontSize: scale(18),
              }}
            >
              {address && address !== "" ? address : "Localização"}
            </Text>
          </TouchableOpacity>
        </View>

        <TextInput
          style={{
            borderRadius: scale(7),
            borderWidth: scale(3),
            borderColor: "#0089FF",
            fontSize: scale(18),
            paddingBottom: scale(100),
            padding: scale(8),
            marginBottom: scale(180),
          }}
          placeholderTextColor="#808080"
          defaultValue={
            description !== "" ? description : "Instruções para o motorista"
          }
        />

        <TouchableOpacity
          style={{
            backgroundColor: "#0089FF",
            borderRadius: scale(7),
            width: scale(300),
            alignItems: "center",
            alignSelf: "center",
            padding: scale(18),
          }}
          onPress={operations.handleSaveFavouriteButtonPress(callbackAddress,type)}
        >
          <Text style={{ color: "#FFF", fontWeight: "700" }}>SALVAR</Text>
        </TouchableOpacity>
        <BottomSheetModalProvider>
          <BottomSheetModal
            ref={models.bottomSheetModalAddAddress}
            index={0}
            snapPoints={[scale(575)]}
          >
            <View
              style={{
                backgroundColor: "#ccc",
                flex: 1,
              }}
            >
              <View
                style={{
                  backgroundColor: "#fff",
                  borderRadius: scale(5),
                  marginBottom: scale(3),
                }}
              >
                <View
                  style={{
                    borderRadius: scale(7),
                    borderWidth: scale(3),
                    borderColor: "#0089FF",
                    fontSize: scale(18),
                    padding: scale(8),
                    marginBottom: scale(20),
                    flexDirection: "row",
                  }}
                >
                  <Icon name="search" size={scale(25)} color="#ccc" />
                  <BottomSheetTextInput
                    style={{
                      fontSize: scale(15),
                      paddingHorizontal: scale(10),
                    }}
                    placeholderTextColor="#808080"
                    placeholder={"Escolha o seu destino"}
                    onChangeText={
                      destination.operations.handleDestinationInputValueChange
                    }
                  />
                </View>

                <TouchableOpacity>
                  <View
                    style={{ flexDirection: "row", marginBottom: scale(15) }}
                  >
                    <View style={styles.iconContainer}>
                      <Icon
                        name="navigation"
                        size={scale(30)}
                        color="#0089FF"
                      />
                    </View>
                    <Text
                      style={{
                        color: "#000",
                        fontSize: scale(15),
                        paddingHorizontal: scale(10),
                        textAlignVertical: "center",
                      }}
                    >
                      Localização atual
                    </Text>
                  </View>
                </TouchableOpacity>

                <TouchableOpacity onPress={
                  mapDrag
                }>
                  <View style={{ flexDirection: "row", marginBottom:scale(10) }}>
                    <View style={styles.iconContainer}>
                      <Icon name="map" size={scale(30)} color="#0089FF" />
                    </View>
                    <Text
                      style={{
                        color: "#000",
                        fontSize: scale(15),
                        paddingHorizontal: scale(10),
                        textAlignVertical: "center",
                      }}
                    >
                      Definir localização no mapa
                    </Text>
                  </View>
                </TouchableOpacity>
              </View>
              <View style={{ backgroundColor: "#fff", borderRadius: scale(5) }}>
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
    marginLeft: scale(10),
    marginRight: scale(10),
  },
  goback: {
    width: scale(40),
    height: scale(40),
    borderRadius: scale(7),
    backgroundColor: "#fff",
    top: scale(15),
    marginLeft: scale(10),
  },
  iconContainer: {
    height: scale(45),
    width: scale(45),
    borderRadius: scale(7),
    borderWidth: scale(2),
    borderColor: "#0089FF",
    alignItems: "center",
    justifyContent: "center",
    marginRight: scale(7),
  },
});
export default AddressModal;
