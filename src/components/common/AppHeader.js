import React from 'react';
import { StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { AppText } from './AppText';
import { AppIconButton } from './AppIconButton';
import { colors, spacing, sizes, typography } from '../../theme';

/**
 * Standard screen and full-screen modal header.
 * Symmetric control slots keep the title centered regardless of actions.
 */
export function AppHeader({
  title,
  subtitle,
  leftIcon = 'arrow-back',
  leftLabel = 'Voltar',
  onLeftPress,
  rightIcon,
  rightLabel,
  onRightPress,
  rightSelected,
  rightColor = colors.primary,
  safeArea = true,
  style,
}) {
  const insets = useSafeAreaInsets();

  return (
    <View style={[styles.header, { paddingTop: (safeArea ? insets.top : 0) + spacing.lg }, style]}>
      <AppIconButton
        icon={leftIcon}
        label={leftLabel}
        onPress={onLeftPress}
      />

      <View style={styles.center}>
        <AppText style={styles.title} numberOfLines={1} adjustsFontSizeToFit minimumFontScale={0.85}>
          {title}
        </AppText>
        {subtitle ? (
          <AppText style={styles.subtitle} numberOfLines={1} adjustsFontSizeToFit minimumFontScale={0.8}>
            {subtitle}
          </AppText>
        ) : null}
      </View>

      {rightIcon ? (
        <AppIconButton
          icon={rightIcon}
          label={rightLabel}
          onPress={onRightPress}
          selected={rightSelected}
          color={rightColor}
        />
      ) : (
        <View style={styles.slot} />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  header: {
    width: '100%',
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.xl,
    paddingBottom: spacing.lg,
  },
  center: { flex: 1, alignItems: 'center', paddingHorizontal: spacing.sm },
  title: { ...typography.body, fontWeight: '600', textAlign: 'center' },
  subtitle: { ...typography.caption, marginTop: spacing.xs, color: colors.textSecondary, textAlign: 'center' },
  slot: { width: sizes.control, height: sizes.control },
});
