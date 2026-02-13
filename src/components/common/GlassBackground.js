import React from 'react';
import { Platform, View, StyleSheet } from 'react-native';
import { BlurView } from 'expo-blur';
import { scale } from 'react-native-size-matters';

/**
 * GlassBackground - Platform-optimized frosted glass effect
 *
 * iOS: Uses native UIBlurEffect for true Gaussian blur
 * Android: Uses semi-transparent overlay (BlurView doesn't blur on Android)
 *
 * The Android opacity is set higher (0.85) to compensate for lack of real blur,
 * creating a similar visual effect where the background isn't visible through.
 */
export const GlassBackground = ({ style, borderRadius = scale(32) }) => (
  <BlurView
    intensity={Platform.select({ ios: 40, android: 100 })}
    tint={Platform.select({ ios: 'light', android: 'systemThickMaterialLight' })}
    style={[
      style,
      {
        borderRadius,
        overflow: 'hidden',
        backgroundColor: Platform.select({
          ios: 'rgba(255,255,255,0.7)',
          android: 'rgba(255,255,255,0.94)'
        })
      }
    ]}
  />
);

/**
 * GlassHandle - Drag handle for bottom sheets with glass effect
 */
export const GlassHandle = () => (
  <View style={styles.handleContainer}>
    <View style={styles.handleIndicator} />
  </View>
);

/**
 * GlassOverlay - Full-screen blur overlay for modals
 * Use as backdrop for modal content
 */
export const GlassOverlay = ({ style, children }) => (
  <BlurView
    intensity={Platform.select({ ios: 40, android: 80 })}
    tint={Platform.select({ ios: 'dark', android: 'systemMaterialDark' })}
    style={[StyleSheet.absoluteFill, style]}
  >
    {children}
  </BlurView>
);

const styles = StyleSheet.create({
  handleContainer: {
    alignItems: 'center',
    paddingTop: scale(12),
    paddingBottom: scale(8),
  },
  handleIndicator: {
    width: scale(40),
    height: scale(4),
    backgroundColor: 'rgba(0,0,0,0.15)',
    borderRadius: scale(2),
  },
});

export default GlassBackground;
