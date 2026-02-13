import { Platform } from 'react-native';
import { scale } from 'react-native-size-matters';

// Design Tokens for Ureboque App
// Based on the modern design system used in ProfileScreen, HistoryScreen, MapScreen

export const colors = {
  // Primary
  primary: '#0089FF',
  primaryDark: '#0066CC',
  primaryLight: '#E8F4FF',

  // Background
  background: '#F8FAFC',
  surface: '#FFFFFF',

  // Text
  textPrimary: '#1E293B',
  textSecondary: '#64748B',
  textMuted: '#94A3B8',
  textDisabled: '#CBD5E0',

  // States
  success: '#4CAF50',
  successLight: '#E8F5E8',
  error: '#F44336',
  errorLight: '#FFF5F5',
  warning: '#FF9800',
  warningLight: '#FFF8E1',

  // Borders
  border: 'rgba(0,0,0,0.05)',
  borderLight: '#E2E8F0',

  // Legacy (for reference, avoid using in new code)
  legacyGray: '#707070',
  legacyBorder: '#ccc',

  // Overlays
  overlay: 'rgba(0, 0, 0, 0.5)',
  glass: 'rgba(255, 255, 255, 0.9)',
};


export const spacing = {
  xs: scale(4),
  sm: scale(8),
  md: scale(12),
  lg: scale(16),
  xl: scale(20),
  xxl: scale(24),
  xxxl: scale(32),

  // Layout
  safeTop: Platform.select({ ios: scale(44), android: scale(24) }),
  safeBottom: Platform.select({ ios: scale(34), android: scale(16) }),
  modalSafeTop: Platform.select({ ios: scale(50), android: scale(20) }),
  headerHeight: scale(60),
};

export const borderRadius = {
  sm: scale(8),
  md: scale(12),
  lg: scale(14),
  xl: scale(16),
  xxl: scale(20),
  full: scale(50),
};

export const typography = {
  h1: {
    fontSize: scale(28),
    fontWeight: '800',
    color: colors.textPrimary,
    letterSpacing: 0.5,
  },
  h2: {
    fontSize: scale(24),
    fontWeight: 'bold',
    color: colors.textPrimary,
  },
  h3: {
    fontSize: scale(20),
    fontWeight: '700',
    color: colors.textPrimary,
  },
  body: {
    fontSize: scale(16),
    color: colors.textPrimary,
  },
  bodySmall: {
    fontSize: scale(14),
    color: colors.textSecondary,
  },
  caption: {
    fontSize: scale(12),
    color: colors.textSecondary,
  },
  label: {
    fontSize: scale(13),
    fontWeight: '600',
    color: colors.textPrimary,
  },
  sectionTitle: {
    fontSize: scale(14),
    fontWeight: '700',
    color: colors.textSecondary,
    letterSpacing: 1,
    textTransform: 'uppercase',
  },
};

export const shadows = {
  sm: Platform.select({
    ios: {
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.05,
      shadowRadius: 3,
    },
    android: {
      elevation: 2,
    },
  }),
  md: Platform.select({
    ios: {
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.1,
      shadowRadius: 6,
    },
    android: {
      elevation: 4,
    },
  }),
  lg: Platform.select({
    ios: {
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 10 },
      shadowOpacity: 0.15,
      shadowRadius: 12,
    },
    android: {
      elevation: 8,
    },
  }),
  primaryGlow: Platform.select({
    ios: {
      shadowColor: colors.primary,
      shadowOffset: { width: 0, height: 8 },
      shadowOpacity: 0.3,
      shadowRadius: 12,
    },
    android: {
      elevation: 8,
      shadowColor: colors.primary, // Android 9+ supports colored shadows
    },
  }),
  successGlow: Platform.select({
    ios: {
      shadowColor: colors.success,
      shadowOffset: { width: 0, height: 8 },
      shadowOpacity: 0.3,
      shadowRadius: 12,
    },
    android: {
      elevation: 8,
      shadowColor: colors.success,
    },
  }),
};

// Font weights - Platform-specific mapping for consistent rendering
export const fontWeights = {
  light: Platform.select({ ios: '300', android: '300' }),
  normal: Platform.select({ ios: '400', android: 'normal' }),
  medium: Platform.select({ ios: '500', android: '500' }),
  semiBold: Platform.select({ ios: '600', android: '600' }),
  bold: Platform.select({ ios: '700', android: 'bold' }),
  extraBold: Platform.select({ ios: '800', android: '800' }),
};

// Keyboard configuration - Unified KeyboardAvoidingView behavior
export const keyboardConfig = {
  behavior: Platform.select({ ios: 'padding', android: 'height' }),
  keyboardVerticalOffset: Platform.select({ ios: 0, android: 10 }),
};

// Interaction constants - Standardized touch feedback
export const interactions = {
  activeOpacity: 0.7,
};

// Common component styles
export const componentStyles = {
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },

  input: {
    fontSize: scale(15),
    color: colors.textPrimary,
    paddingVertical: scale(14),
    paddingHorizontal: scale(16),
    backgroundColor: colors.surface,
    borderRadius: borderRadius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    ...shadows.sm,
  },

  inputLabel: {
    fontSize: scale(13),
    fontWeight: '600',
    color: colors.textPrimary,
    marginBottom: scale(8),
  },

  button: {
    backgroundColor: colors.primary,
    paddingVertical: scale(16),
    borderRadius: borderRadius.xl,
    alignItems: 'center',
    ...shadows.primaryGlow,
  },

  buttonText: {
    color: colors.surface,
    fontSize: scale(16),
    fontWeight: '700',
    letterSpacing: 0.5,
  },

  buttonDisabled: {
    backgroundColor: colors.textDisabled,
    shadowOpacity: 0,
    elevation: 0,
  },

  buttonSecondary: {
    backgroundColor: colors.surface,
    paddingVertical: scale(16),
    borderRadius: borderRadius.xl,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.border,
    ...shadows.md,
  },

  buttonSecondaryText: {
    color: colors.primary,
    fontSize: scale(16),
    fontWeight: '600',
  },

  backButton: {
    padding: scale(8),
    borderRadius: borderRadius.xxl,
    backgroundColor: colors.surface,
    ...shadows.md,
  },

  card: {
    backgroundColor: colors.surface,
    borderRadius: borderRadius.xl,
    borderWidth: 1,
    borderColor: colors.border,
    paddingVertical: scale(16),
    paddingHorizontal: scale(20),
    ...shadows.md,
  },

  header: {
    paddingTop: scale(60),
    paddingBottom: scale(20),
    paddingHorizontal: scale(24),
    backgroundColor: 'transparent',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },

  headerText: {
    fontWeight: '800',
    fontSize: scale(18),
    color: colors.textPrimary,
    letterSpacing: 0.5,
  },
};

// Export all for convenience
export default {
  colors,
  spacing,
  borderRadius,
  typography,
  shadows,
  fontWeights,
  keyboardConfig,
  interactions,
  componentStyles,
};
