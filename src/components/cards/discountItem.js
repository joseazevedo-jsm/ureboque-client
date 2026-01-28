import React, { memo } from "react";
import { View, Text, StyleSheet } from "react-native";
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
    paddingHorizontal: scale(10),
    marginVertical: spacing.lg,
    marginHorizontal: scale(0),
    backgroundColor: colors.surface,
    ...shadows.sm,
  },
  code:{
    fontWeight:"bold",
    paddingVertical: scale(10)
  },
  description:{
    paddingVertical: spacing.xl
  }
});

export default DiscountItem;
