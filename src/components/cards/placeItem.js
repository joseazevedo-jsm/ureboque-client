import React, { memo, useCallback, useMemo } from "react";
import { Image, StyleSheet, View } from 'react-native';
import { AppText as Text } from '../common/AppText';
import { AppPressable as TouchableOpacity } from '../common/AppPressable';

import { Icon } from "react-native-elements/dist/icons/Icon";
import { scale } from "react-native-size-matters";
import { colors, spacing, borderRadius, sizes, typography } from "../../theme";

const PlaceItem = memo(({ name, address, iconUrl, onPress, saved }) => {
  const handlePress = useCallback(() => {
    onPress();
  }, [onPress]);

  const iconComponent = useMemo(() => {
    if (saved) {
      return <Icon name={iconUrl} size={sizes.iconLarge} color={colors.primary} />;
    } else if (iconUrl) {
      return <Image source={{ uri: iconUrl }} style={styles.iconImage} />;
    } else {
      return <Icon name="location-on" size={sizes.iconLarge} color={colors.primary} />;
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
    minHeight: sizes.illustration,
    paddingVertical: spacing.sm,
  },
  iconContainer: {
    height: sizes.handleWidth,
    width: sizes.handleWidth,
    borderRadius: borderRadius.full,
    borderColor: colors.primary,
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
    marginRight: spacing.sm,
  },
  iconImage: {
    tintColor: colors.primary,
    height: sizes.iconLarge,
    width: sizes.iconLarge,
  },
  textContainer: {
    flex: 1,
    flexShrink: 1,
  },
  nameStyle: {
    marginBottom: spacing.xs,
    fontSize: typography.bodySmall.fontSize, lineHeight: typography.bodySmall.lineHeight,
    fontWeight: "600",
  },
  addressStyle: {
    marginBottom: spacing.xs,
    fontSize: typography.caption.fontSize, lineHeight: typography.caption.lineHeight,
  },
  divider: {
    borderBottomColor: colors.borderLight,
    borderBottomWidth: 1,
    marginVertical: spacing.xs,
  },
});
export default PlaceItem;
