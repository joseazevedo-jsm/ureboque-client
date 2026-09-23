import React, { memo, useCallback, useMemo } from "react";
import { Image, StyleSheet, View } from 'react-native';
import { AppText as Text } from '../common/AppText';

import { scale } from "react-native-size-matters";
import { useLogger } from "../../hooks/useLogger";
import { ScalePressable } from "../common/ScalePressable";
import { colors, shadows, spacing, borderRadius, typography, sizes } from "../../theme";

// Memoized image sources for performance
const imageMap = {
  JEEP: require("../../../resources/icons/UREB_JEEP.png"),
  DEFAULT: require("../../../resources/icons/UREB_TUR.png")
};

const CarTypes = memo(({ typeCar, descr, descr2, price, route, onPress }) => {
  const logger = useLogger('CarTypes');

  const formattedPrice = useMemo(() => price.toLocaleString(), [price]);
  const carImage = useMemo(() => typeCar === "JEEP" ? imageMap.JEEP : imageMap.DEFAULT, [typeCar]);

  return (
    <ScalePressable onPress={onPress} style={styles.container}>
      <View style={styles.cardGradient}>
        <View style={styles.contentRow}>
          <Image
            source={carImage}
            style={styles.image}
            resizeMode="contain"
          />

          <View style={styles.infoContainer}>
            {/* Without these the label breaks mid-word at larger text sizes
                ("TURISMO" rendered as "TURISM / O"). Shrink to fit instead. */}
            <Text style={styles.title} numberOfLines={1} adjustsFontSizeToFit minimumFontScale={0.75}>
              {typeCar}
            </Text>
            <Text style={styles.subtext}>{descr}</Text>
            <Text style={styles.subtext}>{descr2}</Text>
          </View>

          <View style={styles.priceContainer}>
            <Text style={styles.currency}>AOA</Text>
            <Text style={styles.price}>{formattedPrice}</Text>
          </View>
        </View>
      </View>
    </ScalePressable>
  );
});

const styles = StyleSheet.create({
  container: {
    marginBottom: spacing.xs,
    marginHorizontal: spacing.xl,
  },
  cardGradient: {
    backgroundColor: colors.surface,
    borderRadius: borderRadius.xxl,
    padding: spacing.md,
    borderWidth: 1,
    borderColor: colors.borderLight,
    ...shadows.sm,
  },
  contentRow: {
    flexDirection: "row",
    alignItems: 'center',
  },
  image: {
    width: scale(72),
    height: sizes.control,
    marginRight: spacing.md,
  },
  infoContainer: {
    flex: 1,
  },
  title: {
    fontSize: typography.body.fontSize, lineHeight: typography.body.lineHeight,
    fontWeight: "700",
    color: colors.textPrimary,
    marginBottom: spacing.xs,
  },
  subtext: {
    fontSize: typography.caption.fontSize, lineHeight: typography.caption.lineHeight,
    color: colors.textSecondary,
    fontWeight: "500",
  },
  priceContainer: {
    alignItems: 'flex-end',
    justifyContent: 'center',
  },
  currency: {
    fontSize: typography.caption.fontSize, lineHeight: typography.caption.lineHeight,
    fontWeight: "700",
    color: colors.textMuted,
    marginBottom: spacing.xs,
  },
  price: {
    fontSize: typography.h3.fontSize, lineHeight: typography.h3.lineHeight,
    fontWeight: "700",
    color: colors.textPrimary,
  },
});

export default CarTypes;

// Peso entre</Text>
//             <Text style={styles.description}>900 kg - 3500 kg</Text>
//             <Text style={styles.title}>JEEP</Text>
//             <Text style={styles.description}>Peso superior a</Text>
//             <Text style={styles.description}>3500 kg</Text>
// 25,300
// 63,300
