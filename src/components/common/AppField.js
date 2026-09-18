import React, { forwardRef } from 'react';
import { View } from 'react-native';
import { AppText, AppTextInput } from './AppText';
import { colors, componentStyles, spacing, typography } from '../../theme';

// Persistent labels and one field recipe for every editable form.
export const AppField = forwardRef(function AppField({ label, hint, error, style, containerStyle, ...props }, ref) {
  return <View style={[{ gap: spacing.sm }, containerStyle]}>
    <AppText style={typography.label}>{label}</AppText>
    <AppTextInput ref={ref} {...props} accessibilityLabel={props.accessibilityLabel || label}
      accessibilityHint={error || hint || props.accessibilityHint}
      style={[componentStyles.input, style, error && { borderColor: colors.error }]} />
    {error || hint ? <AppText accessibilityLiveRegion={error ? 'polite' : 'none'} style={[typography.bodySmall, error && { color: colors.error }]}>{error || hint}</AppText> : null}
  </View>;
});
