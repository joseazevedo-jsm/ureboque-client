import { Platform } from 'react-native';

// Client design system. Logical dp/sp: never scale tokens with viewport width.
export const colors = {
  primary: '#006DDB', primaryDark: '#0056AD', primaryLight: '#E8F3FF', accent: '#008CFF',
  background: '#F5F8FC', surface: '#FFFFFF', surfaceRaised: '#FFFFFF',
  textPrimary: '#123B66', textSecondary: '#526579', textMuted: '#607185', textDisabled: '#718096',
  success: '#237A47', successLight: '#EAF6EE', error: '#C62828', errorLight: '#FFF1F1',
  warning: '#8A5700', warningLight: '#FFF6DF',
  border: '#D8E2ED', borderLight: '#E5ECF3', borderStrong: '#7A8DA3',
  legacyGray: '#526579', legacyBorder: '#D8E2ED',
  overlay: 'rgba(18,59,102,0.40)', glass: 'rgba(255,255,255,0.98)',
  overlayStrong: 'rgba(0,0,0,0.50)', overlaySoft: 'rgba(0,0,0,0.15)',
  overlayLoading: 'rgba(0,0,0,0.20)', overlayLoadingStrong: 'rgba(0,0,0,0.30)',
  surfaceTint15: 'rgba(255,255,255,0.15)', surfaceTint20: 'rgba(255,255,255,0.20)',
  surfaceTint30: 'rgba(255,255,255,0.30)', surfaceTint40: 'rgba(255,255,255,0.40)',
  surfaceTint60: 'rgba(255,255,255,0.60)', surfaceTint70: 'rgba(255,255,255,0.70)',
  surfaceTint75: 'rgba(255,255,255,0.75)', surfaceTint82: 'rgba(255,255,255,0.82)',
  surfaceTint85: 'rgba(255,255,255,0.85)', surfaceTint90: 'rgba(255,255,255,0.90)',
  glassAndroid: 'rgba(255,255,255,0.94)', transparent: 'rgba(255,255,255,0)',
  primaryTint12: 'rgba(0,109,219,0.12)',
  mapAccuracyStroke: 'rgba(0,109,219,0.50)', mapAccuracyFill: 'rgba(0,109,219,0.20)',
  mapNeutralHue: '#E7ECF0',
  originBubble: '#E8F3FF', destinationBubble: '#E8F3FF', destinationPin: '#006DDB',
  mapOptionBubble: '#EAF6EE', mapOptionIcon: '#237A47',
  errorSurface: '#FFF1F1', errorBorder: '#C62828', disabledSurface: '#E5ECF3', focus: '#0056AD',
};
export const spacing = {
  none: 0, xxs: 4, xs: 4, sm: 8, md: 12, lg: 16, xl: 20, xxl: 24, xxxl: 32,
  jumbo: 40, huge: 48, massive: 64,
  // Compatibility only. New headers use actual safe-area insets plus spacing.lg.
  safeTop: Platform.select({ ios: 44, android: 24, default: 0 }),
  safeBottom: Platform.select({ ios: 34, android: 16, default: 16 }),
  modalSafeTop: Platform.select({ ios: 56, android: 56, default: 24 }), headerHeight: 56,
};
export const borderRadius = { none: 0, sm: 8, md: 12, lg: 16, xl: 16, xxl: 24, full: 9999 };
export const borderWidths = { none: 0, thin: 1, focus: 2 };
export const fonts = {
  regular: 'Poppins_400Regular', medium: 'Poppins_500Medium',
  semiBold: 'Poppins_600SemiBold', bold: 'Poppins_700Bold',
};
const type = (fontSize, lineHeight, fontFamily = fonts.regular, color = colors.textPrimary) =>
  ({ fontSize, lineHeight, fontFamily, fontWeight: 'normal', color });
export const typography = {
  h1: type(28, 36, fonts.semiBold), h2: type(24, 32, fonts.semiBold), h3: type(20, 28, fonts.semiBold),
  hero: type(32, 40, fonts.semiBold),
  body: type(16, 24), bodySmall: type(14, 20, fonts.regular, colors.textSecondary),
  caption: type(12, 16, fonts.regular, colors.textSecondary), label: type(14, 20, fonts.semiBold),
  sectionTitle: type(14, 20, fonts.semiBold, colors.textSecondary),
};
const shadow = (y, blur, opacity, elevation) => Platform.select({
  web: { boxShadow: `0px ${y}px ${blur}px rgba(18,59,102,${opacity})` },
  default: { shadowColor: colors.textPrimary, shadowOffset: { width: 0, height: y }, shadowOpacity: opacity, shadowRadius: blur, elevation },
});
export const shadows = { none: { shadowOpacity: 0, elevation: 0 }, sm: shadow(2, 8, 0.06, 1), md: shadow(4, 12, 0.08, 3), lg: shadow(8, 24, 0.12, 6) };
// Legacy names deliberately resolve to neutral elevation, never colored glow.
shadows.primaryGlow = shadows.sm;
shadows.successGlow = shadows.sm;
export const sizes = { control: 48, controlLarge: 56, iconSmall: 16, icon: 20, iconLarge: 24, iconXL: 32, illustration: 64, avatar: 72, placeCardWidth: 176, placeCardMinHeight: 112, handleWidth: 40, handleHeight: 4 };
export const layout = { contentMaxWidth: 720, formMaxWidth: 560, sheetMaxWidth: 560, tablet: 768, desktop: 1200, pageMargin: 24, compactMargin: 16 };
export const fontWeights = { light: '400', normal: '400', medium: '500', semiBold: '600', bold: '700', extraBold: '700' };
export const keyboardConfig = { behavior: Platform.select({ ios: 'padding', android: 'height', default: 'height' }), keyboardVerticalOffset: 0 };
export const interactions = { activeOpacity: 0.72, disabledOpacity: 0.5 };
export const componentStyles = {
  container: { flex: 1, backgroundColor: colors.background },
  content: { width: '100%', maxWidth: layout.contentMaxWidth, alignSelf: 'center', paddingHorizontal: spacing.xxl },
  input: { ...typography.body, minHeight: sizes.control, paddingVertical: spacing.md, paddingHorizontal: spacing.lg, backgroundColor: colors.surface, borderRadius: borderRadius.md, borderWidth: borderWidths.thin, borderColor: colors.borderStrong },
  inputLabel: { ...typography.label, marginBottom: spacing.sm },
  button: { minHeight: sizes.controlLarge, backgroundColor: colors.primary, paddingVertical: spacing.lg, paddingHorizontal: spacing.xxl, borderRadius: borderRadius.md, alignItems: 'center', justifyContent: 'center' },
  buttonText: { ...typography.body, fontFamily: fonts.semiBold, color: colors.surface, textAlign: 'center' },
  buttonDisabled: { backgroundColor: colors.disabledSurface, ...shadows.none },
  buttonSecondary: { minHeight: sizes.controlLarge, backgroundColor: colors.primaryLight, paddingVertical: spacing.lg, paddingHorizontal: spacing.xxl, borderRadius: borderRadius.md, alignItems: 'center', justifyContent: 'center', borderWidth: borderWidths.thin, borderColor: colors.primary },
  buttonSecondaryText: { ...typography.body, fontFamily: fonts.semiBold, color: colors.primary, textAlign: 'center' },
  backButton: { width: sizes.control, height: sizes.control, borderRadius: borderRadius.full, backgroundColor: colors.surface, alignItems: 'center', justifyContent: 'center', ...shadows.sm },
  card: { backgroundColor: colors.surface, borderRadius: borderRadius.lg, borderWidth: borderWidths.thin, borderColor: colors.borderLight, padding: spacing.lg, ...shadows.sm },
  header: { minHeight: sizes.controlLarge, paddingVertical: spacing.lg, paddingHorizontal: spacing.xxl, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  headerText: typography.h3,
  sheet: { width: '100%', maxWidth: layout.sheetMaxWidth, alignSelf: 'center', backgroundColor: colors.surface, borderTopLeftRadius: borderRadius.xxl, borderTopRightRadius: borderRadius.xxl, ...shadows.lg },
};
export const animations = {
  spring: { press: { damping: 24, stiffness: 400 }, release: { damping: 24, stiffness: 300 }, enter: { damping: 28, stiffness: 180 } },
  stagger: { list: 35, form: 35, fast: 20 }, duration: { fast: 120, normal: 200, slow: 280 },
};
export default { colors, spacing, borderRadius, borderWidths, fonts, typography, shadows, sizes, layout, fontWeights, keyboardConfig, interactions, componentStyles, animations };
