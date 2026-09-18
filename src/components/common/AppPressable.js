import React, { forwardRef, useState } from 'react';
import { TouchableOpacity, Platform } from 'react-native';
import { colors, interactions, borderWidths } from '../../theme';

// Compatibility surface for existing touchables; preserves handlers, refs and layout.
export const AppPressable = forwardRef(function AppPressable({ style, onFocus, onBlur, disabled, accessibilityState, activeOpacity = interactions.activeOpacity, ...props }, ref) {
  const [focused, setFocused] = useState(false);
  return <TouchableOpacity ref={ref} activeOpacity={activeOpacity} {...props} disabled={disabled}
    accessibilityRole={props.accessibilityRole || (props.onPress ? 'button' : undefined)}
    accessibilityState={{ ...accessibilityState, disabled: Boolean(disabled) }}
    onFocus={event => { setFocused(true); onFocus?.(event); }}
    onBlur={event => { setFocused(false); onBlur?.(event); }}
    style={[style, disabled && { opacity: interactions.disabledOpacity }, focused && Platform.select({
      web: { outlineColor: colors.focus, outlineWidth: borderWidths.focus, outlineStyle: 'solid', outlineOffset: 2 },
      default: { borderColor: colors.focus, borderWidth: borderWidths.focus },
    })]} />;
});
