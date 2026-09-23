import React from 'react';
import { View, StyleSheet } from 'react-native';
import { AppText as Text } from '../common/AppText';

import { scale } from 'react-native-size-matters';
import { spacing, colors, borderRadius, typography } from '../../theme';

const CustomMarker = ({ title, time, color = colors.primary }) => {
  return (
    <View style={styles.wrapper}>
      {/* Info Bubble */}
      {time ? (
        <View style={styles.infoContainer}>
          <View style={styles.leftContainer}>
            <Text style={styles.title}>{title}</Text>
          </View>
          <View style={[styles.rightContainer, { backgroundColor: color }]}>
            <Text style={styles.time}>{time}</Text>
          </View>
        </View>
      ) : (
        <View style={[styles.uniformContainer, { backgroundColor: color }]}>
          <Text style={[styles.title, { color: colors.surface }]}>{title}</Text>
        </View>
      )}

      {/* Pin */}
      <View style={[styles.pin, { backgroundColor: color }]}>
        {/* Outer Circle */}
        <View style={[styles.pinOuterCircle, { backgroundColor: color }]}>
          {/* Inner White Circle */}
          <View style={styles.pinInnerCircle} />
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  wrapper: {
    alignItems: 'center',
  },
  infoContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: borderRadius.xxl,
    marginBottom: spacing.xs,
    overflow: 'hidden',
  },
  uniformContainer: {
    paddingVertical: spacing.xs,
    paddingHorizontal: spacing.sm,
    borderRadius: borderRadius.xxl,
    marginBottom: spacing.xs,
    overflow: "hidden",
  },
  leftContainer: {
    backgroundColor: colors.surface,
    paddingVertical: spacing.xs,
    paddingHorizontal: spacing.sm,
    borderTopLeftRadius: borderRadius.xxl,
    borderBottomLeftRadius: borderRadius.xxl,
  },
  rightContainer: {
    paddingVertical: spacing.xs,
    paddingHorizontal: spacing.sm,
    borderTopRightRadius: borderRadius.xxl,
    borderBottomRightRadius: borderRadius.xxl,
  },
  title: {
    color: colors.textPrimary,
    fontSize: typography.caption.fontSize, lineHeight: typography.caption.lineHeight,
    fontWeight: 'bold',
  },
  time: {
    color: colors.surface,
    fontSize: typography.caption.fontSize, lineHeight: typography.caption.lineHeight,
  },
  pin: {
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
    width: scale(4),
    height: scale(36),
  },
  pinOuterCircle: {
    width: scale(20),
    height: scale(20),
    borderRadius: borderRadius.md,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'absolute',
    top: 0,
  },
  pinInnerCircle: {
    width: scale(10),
    height: scale(10),
    backgroundColor: colors.surface,
    borderRadius: borderRadius.full,
  },
});

export default CustomMarker;
