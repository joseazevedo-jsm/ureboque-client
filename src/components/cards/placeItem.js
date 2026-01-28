import React, { memo, useCallback, useMemo } from "react";
import { Image, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { Icon } from "react-native-elements/dist/icons/Icon";
import { scale } from "react-native-size-matters";
import { colors, spacing, borderRadius } from "../../theme";

const PlaceItem = memo(({ name, address, iconUrl, onPress, saved }) => {
  const handlePress = useCallback(() => {
    onPress();
  }, [onPress]);

  const iconComponent = useMemo(() => {
    if (saved) {
      return <Icon name={iconUrl} size={scale(25)} color={colors.primary} />;
    } else if (iconUrl) {
      return <Image source={{ uri: iconUrl }} style={styles.iconImage} />;
    } else {
      return <Icon name="location-on" size={scale(25)} color={colors.primary} />;
    }
  }, [saved, iconUrl]);

  return (
    <TouchableOpacity onPress={handlePress}>
      <View style={styles.container}>
        <View style={styles.iconContainer}>
          {iconComponent}
        </View>
        <View style={styles.textContainer}>
          <Text style={styles.nameStyle}>
            {name}
          </Text>
          <Text style={styles.addressStyle}>
            {address}
          </Text>
          <View style={styles.divider} />
        </View>
      </View>
    </TouchableOpacity>
  );
});

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    alignItems: "center",
    height: scale(60),
  },
  iconContainer: {
    height: scale(45),
    width: scale(45),
    borderRadius: borderRadius.sm,
    borderColor: colors.primary,
    borderWidth: scale(3),
    alignItems: "center",
    justifyContent: "center",
    marginRight: spacing.sm,
  },
  iconImage: {
    tintColor: colors.primary,
    height: scale(25),
    width: scale(25),
  },
  textContainer: {
    flex: 1,
    flexShrink: 1,
  },
  nameStyle: {
    marginBottom: scale(1),
    fontSize: scale(12),
    fontWeight: "bold",
  },
  addressStyle: {
    marginBottom: scale(1),
    fontSize: scale(10),
  },
  divider: {
    borderBottomColor: colors.borderLight,
    borderBottomWidth: 1,
    marginVertical: spacing.xs,
  },
});
export default PlaceItem;
{
  /* 
          <Icon
            name="location-on"
            size={scale(25)}
            color={colors.primary}
            style={styles.icon}
          /> */
}
