import React from 'react';
import { ActivityIndicator, View } from 'react-native';
import { AppPressable } from './AppPressable';
import { AppText } from './AppText';
import { colors, componentStyles, spacing } from '../../theme';

export function AppButton({ children, icon, loading = false, disabled = false, variant = 'primary', style, accessibilityState, ...props }) {
  const secondary = variant === 'secondary';
  const danger = variant === 'danger';
  const quiet = variant === 'neutral' || variant === 'dangerOutline';
  const foreground = disabled ? colors.textSecondary : variant === 'dangerOutline' ? colors.error : variant === 'neutral' ? colors.textPrimary : secondary ? colors.primary : colors.surface;
  return <AppPressable {...props} disabled={disabled || loading} accessibilityState={{ ...accessibilityState, disabled: disabled || loading, busy: loading }}
    style={[secondary || quiet ? componentStyles.buttonSecondary : componentStyles.button,
      variant === 'neutral' && { backgroundColor: colors.surface, borderColor: colors.borderStrong },
      variant === 'dangerOutline' && { backgroundColor: colors.errorLight, borderColor: colors.error },
      danger && { backgroundColor: colors.error }, style, disabled && componentStyles.buttonDisabled]}>
    <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: spacing.sm, maxWidth: '100%' }}>
      {loading ? <ActivityIndicator color={foreground} /> : icon}
      <AppText style={[componentStyles.buttonText, { color: foreground, flexShrink: 1 }]}>{children}</AppText>
    </View>
  </AppPressable>;
}
