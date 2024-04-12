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
import FlatListHeader from "./components/FlatListHeader";
import { useDestinationModal } from "./components/useDestinationModal";
import PlaceItem from "../../cards/placeItem";
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
  const handeBackButtonPress = () => {
    closeModal();
  };
  // console.log("MODAL",origin,destination)

  const renderFlatListItem = ({ item }) => {
    if (item.place_id === -1) {
      return (
        <PlaceItem
          key={item.place_id}
          name={item.name}
          iconUrl={"map"}
          address={item.formatted_address}
          onPress={onMarkerDragPress}
          saved={true}
        />
      );
    } else if (item.place_id === 0) {
      return (
        <PlaceItem
          key={item.place_id}
          name={item.name}
          iconUrl={"navigation"}
          address={item.formatted_address}
          onPress={() => {
            operations.handleOnIsCurrLocation(true);
            models.inputIndex === 1 &&
              onPlaceItemPress(
                {},
                "CurrLocation",
                models.textInputDestinationRef
              );
          }}
          saved={true}
        />
      );
    }

    return (
      <PlaceItem
        key={item.place_id}
        name={item.name}
        iconUrl={item?.icon}
        address={item.formatted_address}
        onPress={() => {
          onPlaceItemPress(
            {
              latitude: item?.geometry.location.lat,
              longitude: item?.geometry.location.lng,
            },
            item.name,
            models.textInputDestinationRef
          );
          models.inputIndex === 0 && operations.handleOnIsCurrLocation(false);
          
        }}
        saved={false}
      />
    );
  };

  return (
    <Modal onRequestClose={closeModal} visible={visible} animationType="slide">
      <View style={styles.container}>
        <TouchableOpacity style={styles.goback} onPress={handeBackButtonPress}>
          <Icon name="close" size={scale(25)} />
        </TouchableOpacity>
        <Text
          style={{
            fontSize: scale(20),
            alignSelf: "center",
            top: scale(60),
            color: "#0089FF",
            fontWeight: "700",
          }}
        >
          REBOCAR
        </Text>
        <View
          style={{
            alignItems: "center",
            width: "100%",
            top: scale(80),
            height: "88%",
          }}
        >
          <FlatList
            stickyHeaderIndices={[0]}
            data={models.queryResponseData}
            renderItem={renderFlatListItem}
            keyboardShouldPersistTaps="always"
            keyboardDismissMode="on-drag"
            ItemSeparatorComponent={() => (
              <View style={{ height: scale(13) }} />
            )}
            ListHeaderComponent={
              <FlatListHeader
                destination={models.destinationInputValue}
                onDestinationTextChange={
                  operations.handleDestinationInputValueChange
                }
                onInputTextChange={operations.handleInputTextChange}
                onFocus={onLocationTextInputFocus}
                inputOrigin={origin}
                inputDestination={destination}
                inputRef={models.textInputDestinationRef}
                inputCurr={inputCurr}
                onInputIndex={operations.handleOnSelectInputIndex}
              />
            }
          />
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  goback: {
    width: scale(40),
    height: scale(40),
    position: "absolute",
    borderRadius: scale(7),
    backgroundColor: "#fff",
    top: scale(35),
    alignItems: "center",
    justifyContent: "center",
    left: scale(20),
  },
});
export default DestinationModal;
