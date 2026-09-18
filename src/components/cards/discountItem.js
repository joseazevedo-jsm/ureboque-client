import React, { memo } from "react";
import { View, StyleSheet } from 'react-native';
import { AppText as Text } from '../common/AppText';

import { scale } from "react-native-size-matters";
import { colors, shadows, spacing } from "../../theme";

const DiscountItem = memo(({ code, description }) => {
  return (
    <View style={styles.container}>
      <Text style={styles.code}>{code}</Text>
      <Text style={styles.description}>{description}</Text>
    </View>
  );
});

const styles = StyleSheet.create({
  container: {
    paddingVertical: spacing.xs,
    paddingHorizontal: spacing.sm,
    marginVertical: spacing.lg,
    marginHorizontal: scale(0),
    backgroundColor: colors.surface,
    ...shadows.sm,
  },
  code:{
    fontWeight:"bold",
    paddingVertical: spacing.sm
  },
  description:{
    paddingVertical: spacing.xl
  }
});

export default DiscountItem;
