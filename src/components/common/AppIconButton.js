import React from 'react';
import { StyleSheet } from 'react-native';
import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import { AppPressable } from './AppPressable';
import { colors, componentStyles, sizes } from '../../theme';

export function AppIconButton({ icon, label, color, variant = 'surface', selected, style, ...props }) {
  const foreground = color || (variant === 'danger' ? colors.error : variant === 'ghostOnColor' ? colors.surface : colors.textPrimary);
  return (
    <AppPressable
      {...props}
      accessibilityLabel={label}
      accessibilityState={{ ...props.accessibilityState, selected }}
      style={[
        styles.base,
        variant === 'ghost' && styles.ghost,
        variant === 'ghostOnColor' && styles.ghost,
        variant === 'danger' && styles.danger,
        style,
      ]}
    >
      <MaterialIcons name={icon} size={sizes.icon} color={foreground} />
    </AppPressable>
  );
}

const styles = StyleSheet.create({
  base: componentStyles.backButton,
  ghost: { backgroundColor: colors.transparent, shadowOpacity: 0, elevation: 0 },
  danger: { backgroundColor: colors.errorLight },
});
