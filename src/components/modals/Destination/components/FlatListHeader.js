import React from "react";
import { StyleSheet, useWindowDimensions, View } from 'react-native';
import { AppText as Text, AppTextInput as TextInput } from '../../../common/AppText';

import { scale } from "react-native-size-matters";
import MaterialIcons from "@expo/vector-icons/MaterialIcons";
const Icon = MaterialIcons;
import { Picker } from "react-native";
import { useState } from "react";
import { Dropdown } from "react-native-element-dropdown";
import { useLogger } from "../../../../hooks/useLogger";
import { spacing, borderRadius, colors, sizes, typography } from "../../../../theme";

const FlatListHeader = ({
  destinationValue,
  onDestinationTextChange,
  onInputTextChange,
  onFocus,
  inputOrigin,
  inputDestination,
  inputRef,
  inputCurr,
  onInputIndex,
}) => {
  const { width: windowWidth } = useWindowDimensions();
  const logger = useLogger('FlatListHeader');
  logger.debug("Destination value", { inputDestination });

  return (
    <View style={styles.header}>
      <View style={[styles.container, { width: windowWidth - scale(50) }]}>
        <View style={styles.inputBox}>
          <View style={{ width: "100%" }}>
            <View>
              <View style={styles.input}>
                <Icon name="my-location" size={sizes.iconLarge} color={colors.primary} />
                <TextInput
                  style={{
                    marginLeft: spacing.xs,
                    color: "black",
                    fontSize: typography.body.fontSize, lineHeight: typography.body.lineHeight,
                  }}
                  placeholder={
                    inputOrigin && !inputCurr
                      ? inputOrigin
                      : "Localização atual"
                  }
                  placeholderTextColor={colors.textPrimary}
                  onChangeText={onDestinationTextChange}
                  onFocus={() => {
                    onFocus(0);
                    onInputIndex(0);
                  }}
                />
              </View>
              <View style={styles.inputy}>
                <Icon name="location-on" size={sizes.iconLarge} color={colors.primary} />
                <TextInput
                  ref={inputRef}
                  style={{
                    marginLeft: spacing.xs,
                    color: "black",
                    fontSize: typography.body.fontSize, lineHeight: typography.body.lineHeight,
                  }}
                  placeholder={
                    inputDestination ? inputDestination : "Para onde está indo"
                  }
                  placeholderTextColor={colors.textPrimary}
                  onChangeText={onDestinationTextChange}
                  onFocus={() => {
                    onInputTextChange(onFocus);
                    onInputIndex(1);
                  }}
                  autoFocus={true}
                />
              </View>
            </View>
          </View>
        </View>
      </View>
      <View style={styles.divider} />
    </View>
  );
};
const styles = StyleSheet.create({
  header: {
    backgroundColor: colors.surface,
  },
  container: {
    flexDirection: "row",
    alignContent: "center",
  },
  inputBox: {
    borderRadius: borderRadius.sm,
    borderColor: colors.primary,
    borderWidth: scale(4),
    width: "100%",
    flexDirection: "row",
    alignItems: "center",
  },

  input: {
    minHeight: scale(30),
    padding: spacing.sm,
    borderColor: colors.primary,
    borderBottomWidth: scale(2),
    flexDirection: "row",
  },
  inputy: {
    minHeight: scale(30),
    padding: spacing.sm,
    borderColor: colors.primary,
    borderTopWidth: scale(2),
    flexDirection: "row",
  },
  divider: {
    borderBottomColor: colors.legacyBorder,
    borderBottomWidth: 1,
    marginVertical: spacing.xs,
  },
  dropdown: {
    minHeight: scale(30),
    borderRadius: borderRadius.sm,
    borderColor: colors.primary,
    borderWidth: scale(4),
    padding: spacing.sm,
  },
  icon: {
    marginRight: spacing.xs,
  },
  label: {
    position: "absolute",
    backgroundColor: "white",
    left: 22,
    top: 8,
    zIndex: 999,
    paddingHorizontal: spacing.sm,
    fontSize: typography.bodySmall.fontSize, lineHeight: typography.bodySmall.lineHeight,
  },
  placeholderStyle: {
    marginLeft: spacing.xs,
    color: "black",
    fontSize: typography.body.fontSize, lineHeight: typography.body.lineHeight,
  },
  selectedTextStyle: {
    marginLeft: spacing.xs,
    color: "black",
    fontSize: typography.body.fontSize, lineHeight: typography.body.lineHeight,
  },
  iconStyle: {
    width: sizes.icon,
    height: sizes.icon,
  },
  inputSearchStyle: {
    height: sizes.handleWidth,
    fontSize: typography.body.fontSize, lineHeight: typography.body.lineHeight,
  },
});

export default FlatListHeader;
