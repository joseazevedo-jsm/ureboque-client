import React, { memo } from "react";
import { View, StyleSheet, Image } from 'react-native';
import { AppText as Text } from '../common/AppText';
import { AppPressable as TouchableOpacity } from '../common/AppPressable';

import MaterialIcons from "@expo/vector-icons/MaterialIcons";
const Icon = MaterialIcons;
import { typography, sizes, colors, spacing } from "../../theme";

const RouteItem = memo(({ origin, destination }) => {
  return (
    <View>
      <View style={styles.placeContainer}>
        <Icon name="circle" size={sizes.iconSmall} color={colors.primary} style={styles.originIcon} />
        <Text style={styles.place}>{origin}</Text>
      </View>
      <View>
        <Image
          source={require("../../../resources/icons/lineRouteDots.png")}
          style={styles.lineImage}
        />
      </View>
      <View style={styles.placeContainer}>
        <Icon name="location-on" size={sizes.iconLarge} color={colors.primary} />
        <Text style={styles.placeDestination}>{destination}</Text>
      </View>
    </View>
  );
});

const styles = StyleSheet.create({
  placeContainer: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: spacing.xs
  },
  place: {
    ...typography.bodySmall,
    color: colors.textPrimary,
    flex: 1,
    paddingHorizontal: spacing.sm,
  },
  placeDestination: {
    ...typography.bodySmall,
    color: colors.textPrimary,
    flex: 1,
    paddingHorizontal: spacing.xs,
  },
  originIcon: {
    marginLeft: spacing.xs
  },
  lineImage: {
    marginLeft: spacing.md,
    height: spacing.xxl
  }
});

export default RouteItem;
