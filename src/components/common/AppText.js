import React, { createContext, forwardRef, useContext, useState } from 'react';
import { Text as NativeText, TextInput as NativeTextInput, StyleSheet } from 'react-native';
import { colors, fonts, typography, borderWidths } from '../../theme';

const TextStyleContext = createContext(null);
export function resolveTextStyle(style, inherited) {
  const flat = StyleSheet.flatten(style) || {};
  const base = inherited || typography.body;
  const weight = flat.fontWeight;
  const fontFamily = weight && weight !== 'normal'
    ? (weight === 'bold' || Number(weight) >= 700 ? fonts.bold : Number(weight) >= 600 ? fonts.semiBold : Number(weight) >= 500 ? fonts.medium : fonts.regular)
    : flat.fontFamily || base.fontFamily || fonts.regular;
  const fontSize = flat.fontSize || base.fontSize;
  const lineHeight = flat.lineHeight || (fontSize <= 12 ? 16 : fontSize <= 14 ? 20 : fontSize <= 16 ? 24 : fontSize <= 20 ? 28 : fontSize + 8);
  return { ...base, ...flat, fontFamily, fontWeight: 'normal', fontSize, lineHeight };
}
export const AppText = forwardRef(function AppText({ style, children, ...props }, ref) {
  const inherited = useContext(TextStyleContext);
  const resolved = resolveTextStyle(style, inherited);
  return <TextStyleContext.Provider value={resolved}><NativeText ref={ref} {...props} style={resolved}>{children}</NativeText></TextStyleContext.Provider>;
});
export const AppTextInput = forwardRef(function AppTextInput({ style, onFocus, onBlur, placeholderTextColor = colors.textMuted, ...props }, ref) {
  const [focused, setFocused] = useState(false);
  return <NativeTextInput ref={ref} {...props} placeholderTextColor={placeholderTextColor}
    selectionColor={colors.primary}
    onFocus={event => { setFocused(true); onFocus?.(event); }}
    onBlur={event => { setFocused(false); onBlur?.(event); }}
    style={[resolveTextStyle(style), focused && { borderColor: colors.focus, borderWidth: borderWidths.focus }]} />;
});
