import React from "react";
import {
  FlatList,
  Modal,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  StatusBar
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
  onDestinationSelected,
}) => {
  const { models, operations } = useDestinationModal();

  const handleBackButtonPress = () => {
    closeModal();
  };

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
            if (models.inputIndex === 1) {
              const success = onPlaceItemPress(
                {},
                "CurrLocation",
                models.textInputDestinationRef
              );
              if (success && onDestinationSelected) {
                onDestinationSelected();
              }
            }
          }}
          saved={true}
        />
      );
    }

    return (
      <PlaceItem
        key={item.place_id}
        name={item.name || "Unnamed Place"}
        iconUrl={item?.icon || "place"}
        address={item.formatted_address || "No address"}
        onPress={() => {
          const location = item?.geometry?.location || {};
          const success = onPlaceItemPress(
            {
              latitude: location.lat || 0,
              longitude: location.lng || 0,
            },
            item.name || "Unnamed Place",
            models.textInputDestinationRef
          );
          operations.handleSetResponseData();
          models.inputIndex === 0 && operations.handleOnIsCurrLocation(false);
          
          // If destination was successfully selected (both origin and destination available)
          // Call the destination selected handler which handles the transition
          if (success && models.inputIndex === 1 && onDestinationSelected) {
            onDestinationSelected();
          }
        }}
        saved={false}
      />
    );
  };

  return (
    <Modal onRequestClose={closeModal} visible={visible} animationType="slide">
      <View style={styles.container}>
        <StatusBar barStyle="dark-content" />
        <TouchableOpacity style={styles.goback} onPress={handleBackButtonPress}>
          <Icon name="close" size={scale(25)} />
        </TouchableOpacity>
        <Text style={styles.title}>REBOCAR</Text>
        <View style={styles.listContainer}>
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
  title: {
    fontSize: scale(20),
    alignSelf: "center",
    top: scale(60),
    color: "#0089FF",
    fontWeight: "700",
  },
  listContainer: {
    alignItems: "center",
    width: "100%",
    top: scale(80),
    height: "88%",
  },
});

export default DestinationModal;
