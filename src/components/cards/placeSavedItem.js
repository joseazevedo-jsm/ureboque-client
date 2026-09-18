import React, { memo, useMemo, useCallback } from "react";
import { Image, StyleSheet, View } from 'react-native';
import { AppText as Text } from '../common/AppText';
import { AppPressable as TouchableOpacity } from '../common/AppPressable';

import { Icon } from "react-native-elements/dist/icons/Icon";
import { colors, spacing, borderRadius, shadows, typography, sizes } from "../../theme";

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
      accessibilityRole="button"
      accessibilityLabel={`${edit && !add ? "Editar " : ""}${place.name}`}
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
          <Icon name="add" size={sizes.iconLarge} color={colors.surface} />
        </View>
      )}

      <View style={styles.textContainer}>
        <Text style={[styles.name, isGenericAdd && styles.nameAdd]}>
          {place.name}
        </Text>
        {resolvedDescription ? (
          <Text style={styles.description}>
            {resolvedDescription}
          </Text>
        ) : null}
      </View>

      {edit && !add && (
        <Icon name="edit" size={sizes.icon} color={colors.textMuted} />
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
    paddingVertical: spacing.lg,
    marginBottom: spacing.md,
    ...shadows.sm,
  },
  icon: {
    width: sizes.illustration,
    height: sizes.illustration,
    marginRight: spacing.md,
  },
  addIconBox: {
    width: sizes.illustration,
    height: sizes.illustration,
    borderRadius: borderRadius.md,
    backgroundColor: colors.primary,
    justifyContent: "center",
    alignItems: "center",
    marginRight: spacing.md,
  },
  textContainer: {
    flex: 1,
  },
  name: {
    ...typography.body,
    color: colors.textPrimary,
  },
  nameAdd: {
    color: colors.primary,
  },
  description: {
    ...typography.bodySmall,
    color: colors.textSecondary,
    marginTop: spacing.xs,
  },
});

export default PlaceSavedItem;
