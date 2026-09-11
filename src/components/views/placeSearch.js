import React from "react";
import { View, StyleSheet, Text, TouchableOpacity, FlatList } from "react-native";
import MaterialIcons from "@expo/vector-icons/MaterialIcons";
const Icon = MaterialIcons;
import { scale } from "react-native-size-matters";
import CardSpots from "../cards/cardSpots";
import { colors, spacing, borderRadius, shadows } from "../../theme";

import { getPlaceIcon } from "../../assets/icons";

const PlaceSearch = ({ favPlaces, handleMapSearchBarPress, handleAddFavouriteButtonPress, onSeeAll }) => {
  const renderSpotsItem = ({ item, index }) => {
    const place = item?.place || {};
    const placeName = place.name || 'Local guardado';
    const isAddFavorite = placeName === "Adicionar Favorito";
    return (
      <CardSpots
        title={placeName}
        description={place.description || place.address}
        onPress={isAddFavorite ? handleAddFavouriteButtonPress : null}
        index={index}
        isAddFavorite={isAddFavorite}
        iconSource={getPlaceIcon(placeName)}
      />
    );
  };

  return (
    <>
      {/* Header row */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Rebocar para</Text>
        <TouchableOpacity onPress={onSeeAll || handleAddFavouriteButtonPress}>
          <Text style={styles.seeAll}>Ver tudo</Text>
        </TouchableOpacity>
      </View>

      {/* Horizontal cards */}
      <FlatList
        data={favPlaces}
        renderItem={renderSpotsItem}
        keyExtractor={(item, index) => String(item?._id ?? `favorite-${index}`)}
        horizontal={true}
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.listContent}
      />

      {/* Pill search bar */}
      <TouchableOpacity
        style={styles.searchBar}
        onPress={handleMapSearchBarPress}
        activeOpacity={0.8}
      >
        <View style={styles.searchLeft}>
          <Icon name="search" size={scale(18)} color={colors.primary} />
          <Text style={styles.searchText}>Para onde está indo?</Text>
        </View>
        <View style={styles.pillDivider} />
        <View style={styles.searchArrow}>
          <Icon name="chevron-right" size={scale(20)} color={colors.surface} />
        </View>
      </TouchableOpacity>
    </>
  );
};

const styles = StyleSheet.create({
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.md,
    paddingTop: spacing.sm,
  },
  headerTitle: {
    fontSize: scale(16),
    fontWeight: "700",
    color: colors.textPrimary,
  },
  seeAll: {
    fontSize: scale(14),
    color: colors.primary,
    fontWeight: "600",
  },
  listContent: {
    paddingHorizontal: spacing.lg,
  },
  searchBar: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginHorizontal: spacing.lg,
    marginTop: spacing.md,
    marginBottom: spacing.sm,
    height: scale(52),
    borderRadius: borderRadius.full,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.borderLight,
    paddingLeft: spacing.lg,
    paddingRight: spacing.sm,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.14,
    shadowRadius: 14,
    elevation: 10,
  },
  searchLeft: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
  },
  searchText: {
    marginLeft: spacing.sm,
    fontSize: scale(15),
    color: colors.textMuted,
  },
  pillDivider: {
    width: 1,
    height: scale(24),
    backgroundColor: colors.borderLight,
    marginHorizontal: spacing.sm,
  },
  searchArrow: {
    width: scale(34),
    height: scale(34),
    borderRadius: scale(17),
    backgroundColor: colors.primary,
    justifyContent: "center",
    alignItems: "center",
  },
});

export default PlaceSearch;
