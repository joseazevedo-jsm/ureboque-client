import React, { memo, useMemo, useCallback } from "react";
import { Image, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { Icon } from "react-native-elements/dist/icons/Icon";
import { scale } from "react-native-size-matters";
import { colors, spacing, borderRadius } from "../../theme";

const PlaceSavedItem = memo(({ place, edit, onPressEditItem, add }) => {
  const iconName = useMemo(() => {
    if (place.name.includes("Casa")) return "house";
    if (place.name.includes("Trabalho")) return "work";
    return "bookmark-outline";
  }, [place.name]);

  const handleEditPress = useCallback(() => {
    onPressEditItem?.(place);
  }, [onPressEditItem, place]);

  return (
    <>
      <View style={styles.container}>
        <View style={styles.iconContainer}>
          <Icon name={iconName} size={scale(30)} color={colors.primary} />
        </View>
        <View style={styles.textContainer}>
          <Text style={styles.placeName}>
            {place.name}
          </Text>
          {add && (
            <TouchableOpacity onPress={handleEditPress}>
              <Icon name="add" size={scale(30)} color={colors.textMuted} />
            </TouchableOpacity>
          )}
          {edit && !add && (
            <TouchableOpacity onPress={handleEditPress}>
              <Icon name="edit-off" size={scale(30)} color={colors.textMuted} />
            </TouchableOpacity>
          )}
        </View>
      </View>
      <View style={styles.divider} />
    </>
  );
});

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    alignItems: "center",
    height: scale(70),
  },
  iconContainer: {
    height: scale(45),
    width: scale(45),
    borderRadius: borderRadius.sm,
    borderWidth: scale(2),
    borderColor: colors.primary,
    alignItems: "center",
    justifyContent: "center",
    marginRight: spacing.sm,
  },
  iconImage: {
    tintColor: colors.surface,
    height: scale(25),
    width: scale(25),
  },
  textContainer: {
    flex: 1,
    flexShrink: 1,
    flexDirection: "row",
    justifyContent: "space-between",
    marginRight: scale(10),
  },
  placeName: {
    fontSize: scale(12),
    fontWeight: "bold",
    textAlignVertical: "center",
  },
  divider: {
    borderBottomColor: colors.borderLight,
    borderBottomWidth: scale(1),
    marginRight: scale(10),
  },
});
export default PlaceSavedItem;
