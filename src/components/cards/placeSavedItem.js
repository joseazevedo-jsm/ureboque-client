import React, { memo, useMemo, useCallback } from "react";
import { Image, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { Icon } from "react-native-elements/dist/icons/Icon";
import { scale } from "react-native-size-matters";
import { colors, spacing, borderRadius, shadows } from "../../theme";

const ADD_DESCRIPTIONS = {
  "Adicionar Casa": "Adicione o endereço de casa",
  "Adicionar Trabalho": "Adicione endereço do serviço",
};

const PlaceSavedItem = memo(({ place, edit, onPressEditItem, add, iconSource, description }) => {
  const handlePress = useCallback(() => {
    onPressEditItem?.(place);
  }, [onPressEditItem, place]);

  const resolvedDescription = useMemo(() => {
    if (description) return description;
    if (add && ADD_DESCRIPTIONS[place.name]) return ADD_DESCRIPTIONS[place.name];
    return place.description || place.address || null;
  }, [description, add, place]);

  const isGenericAdd = place.name === "Adicionar";

  return (
    <TouchableOpacity
      style={styles.card}
      onPress={handlePress}
      activeOpacity={0.75}
    >
      {iconSource ? (
        <Image
          source={iconSource}
          style={styles.icon}
          resizeMode="contain"
        />
      ) : (
        <View style={styles.addIconBox}>
          <Icon name="add" size={scale(28)} color={colors.surface} />
        </View>
      )}

      <View style={styles.textContainer}>
        <Text style={[styles.name, isGenericAdd && styles.nameAdd]} numberOfLines={1}>
          {place.name}
        </Text>
        {resolvedDescription ? (
          <Text style={styles.description} numberOfLines={2}>
            {resolvedDescription}
          </Text>
        ) : null}
      </View>

      {edit && !add && (
        <Icon name="edit" size={scale(20)} color={colors.textMuted} />
      )}
    </TouchableOpacity>
  );
});

const styles = StyleSheet.create({
  card: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: colors.surface,
    borderRadius: borderRadius.lg,
    borderWidth: 1,
    borderColor: colors.borderLight,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    marginBottom: spacing.md,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 6,
  },
  icon: {
    width: scale(56),
    height: scale(56),
    marginRight: spacing.md,
  },
  addIconBox: {
    width: scale(56),
    height: scale(56),
    borderRadius: scale(12),
    backgroundColor: colors.primary,
    justifyContent: "center",
    alignItems: "center",
    marginRight: spacing.md,
  },
  textContainer: {
    flex: 1,
  },
  name: {
    fontSize: scale(14),
    fontWeight: "700",
    color: colors.textPrimary,
  },
  nameAdd: {
    color: colors.primary,
  },
  description: {
    fontSize: scale(12),
    color: colors.textSecondary,
    marginTop: scale(2),
    lineHeight: scale(17),
  },
});

export default PlaceSavedItem;
