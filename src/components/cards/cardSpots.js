import React, { memo, useCallback } from "react";
import { Image, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { Icon } from "react-native-elements/dist/icons/Icon";
import { scale } from "react-native-size-matters";
import { colors, spacing, borderRadius } from "../../theme";

// card view that receives props like title, description
const CardSpots = memo(({ title, description, onPress }) => {
  const handlePress = useCallback(() => {
    onPress();
  }, [onPress]);

  return (
    <TouchableOpacity onPress={handlePress}>
      <View style={styles.container}>
        <Text style={styles.title}>{title}</Text>
        <Text style={styles.description}>{description}</Text>
        <View style={styles.bottom}>
          <Image
            style={styles.image}
            source={require("../../../resources/icons/UREB_CARD.png")}
            resizeMode="cover"
          />
          <Icon
            name="location-on"
            size={scale(23)}
            color={colors.primary}
            style={styles.icon}
          />
        </View>
      </View>
    </TouchableOpacity>
  );
});

const styles = StyleSheet.create({
  container: {
    borderWidth: scale(4),
    padding: spacing.xs,
    width: scale(150),
    height: scale(100),
    borderRadius: borderRadius.sm,
    borderColor: colors.primary,
    marginRight: spacing.sm,
  },
  title: {
    fontSize: scale(12),
    fontWeight: "bold",
  },
  image: {
    marginLeft: spacing.sm,
  },
  icon: {
    marginLeft: scale(22),
  },
  bottom: {
    position: "absolute",
    flexDirection: "row",
    top: scale(60),
  },
  description: {
    fontSize: scale(8),
  },
});
export default CardSpots;
