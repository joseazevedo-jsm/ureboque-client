import React from "react";
import { View, StyleSheet, FlatList } from 'react-native';
import { AppText as Text } from '../common/AppText';
import { AppPressable as TouchableOpacity } from '../common/AppPressable';

import MaterialIcons from "@expo/vector-icons/MaterialIcons";
const Icon = MaterialIcons;
import { scale } from "react-native-size-matters";
import CardSpots from "../cards/cardSpots";
import { colors, spacing, borderRadius, borderWidths, shadows, typography, sizes } from "../../theme";

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
          <Icon name="search" size={sizes.icon} color={colors.primary} />
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
    fontSize: typography.body.fontSize, lineHeight: typography.body.lineHeight,
    fontWeight: "700",
    color: colors.textPrimary,
  },
  seeAll: {
    fontSize: typography.bodySmall.fontSize, lineHeight: typography.bodySmall.lineHeight,
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
    minHeight: sizes.control,
    borderRadius: borderRadius.full,
    backgroundColor: colors.surface,
    borderWidth: borderWidths.thin,
    borderColor: colors.borderLight,
    paddingLeft: spacing.lg,
    paddingRight: spacing.sm,
    ...shadows.md,
  },
  searchLeft: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
  },
  searchText: {
    marginLeft: spacing.sm,
    fontSize: typography.bodySmall.fontSize, lineHeight: typography.bodySmall.lineHeight,
    color: colors.textMuted,
  },
  pillDivider: {
    width: borderWidths.thin,
    height: scale(24),
    backgroundColor: colors.borderLight,
    marginHorizontal: spacing.sm,
  },
  searchArrow: {
    width: scale(34),
    height: scale(34),
    borderRadius: borderRadius.lg,
    backgroundColor: colors.primary,
    justifyContent: "center",
    alignItems: "center",
  },
});

export default PlaceSearch;
