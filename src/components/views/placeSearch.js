import React from "react";
import { View, StyleSheet, Text, TouchableOpacity, FlatList } from "react-native";
import Icon from "react-native-vector-icons/MaterialIcons";
import { scale } from "react-native-size-matters";
import CardSpots from "../cards/cardSpots";
import { colors, spacing, borderRadius } from "../../theme";

const PlaceSearch = ({favPlaces, handleMapSearchBarPress, handleAddFavouriteButtonPress}) => {
  const renderSpotsItem = ({ item, index }) => {
    const isAddFavorite = item.place.name === "Adicionar Favorito";
    return (
      <CardSpots
        title={item.place.name}
        description={item.place.description}
        onPress={isAddFavorite ? handleAddFavouriteButtonPress : null}
        index={index}
        isAddFavorite={isAddFavorite}
      />
    );
  };

  return (
    <>
      <View style={styles.svgContainer}>
        <Icon name="my-location" size={scale(18)} color={colors.primary} />
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
        contentContainerStyle={{ marginHorizontal: spacing.lg }}
      />
    </>
  );
};

const styles = StyleSheet.create({
  svgContainer: {
    width: scale(318),
    height: scale(50),
    borderRadius: borderRadius.sm,
    borderWidth: scale(4),
    borderColor: colors.primary,
    overflow: "hidden",
    flexDirection: "row",
    alignItems: "center",
    marginHorizontal: spacing.lg,
    paddingHorizontal: spacing.lg,
    marginVertical: spacing.sm,
  },
});

export default PlaceSearch;
