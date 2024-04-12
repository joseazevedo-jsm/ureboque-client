import React from "react";
import { View, StyleSheet, Text, TouchableOpacity, FlatList } from "react-native";
import Icon from "react-native-vector-icons/MaterialIcons";
import { scale } from "react-native-size-matters";
import CardSpots from "../cards/cardSpots";

const PlaceSearch = ({favPlaces, handleMapSearchBarPress, handleAddFavouriteButtonPress}) => {
  const renderSpotsItem = ({ item }) => {
    return item.place.name === "Adicionar Favorito" ? (
      <CardSpots
        title={item.place.name}
        description={item.place.description}
        onPress={handleAddFavouriteButtonPress}
      />
    ) : (
      <CardSpots
        title={item.place.name}
        description={item.place.description}
        onPress={null}
      />
    );
  };

  return (
    <>
      <View style={styles.svgContainer}>
        <Icon name="my-location" size={scale(18)} color="#0089FF" />
        <TouchableOpacity
          style={{marginLeft: scale(10) }}
          onPress={handleMapSearchBarPress}
        >
          <Text style={{ fontSize: scale(15) }}>De onde vai partir?</Text>
        </TouchableOpacity>
      </View>

      <FlatList
        data={favPlaces}
        renderItem={renderSpotsItem}
        keyExtractor={(item) => item._id.toString()}
        horizontal={true}
        contentContainerStyle={{ marginHorizontal: scale(15) }}
      />
    </>
  );
};

const styles = StyleSheet.create({
  svgContainer: {
    width: scale(318),
    height: scale(50),
    borderRadius: scale(7),
    borderWidth: scale(4),
    borderColor: "#0089ff",
    overflow: "hidden",
    flexDirection: "row",
    alignItems: "center",
    marginHorizontal: scale(15),
    paddingHorizontal: scale(16),
    marginVertical: scale(10),
  },
});

export default PlaceSearch;
