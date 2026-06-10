import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { scale } from 'react-native-size-matters';
import { colors, borderRadius } from '../../theme';

const CustomMarker = ({ title, time, color }) => {
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
    marginBottom: scale(5),
    overflow: 'hidden',
  },
  uniformContainer: {
    paddingVertical: scale(5),
    paddingHorizontal: scale(10),
    borderRadius: borderRadius.xxl,
    marginBottom: scale(5),
    overflow: "hidden",
  },
  leftContainer: {
    backgroundColor: colors.surface,
    paddingVertical: scale(5),
    paddingHorizontal: scale(10),
    borderTopLeftRadius: borderRadius.xxl,
    borderBottomLeftRadius: borderRadius.xxl,
  },
  rightContainer: {
    paddingVertical: scale(5),
    paddingHorizontal: scale(10),
    borderTopRightRadius: borderRadius.xxl,
    borderBottomRightRadius: borderRadius.xxl,
  },
  title: {
    color: colors.textPrimary,
    fontSize: scale(12),
    fontWeight: 'bold',
  },
  time: {
    color: colors.surface,
    fontSize: scale(10),
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
    borderRadius: scale(10),
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