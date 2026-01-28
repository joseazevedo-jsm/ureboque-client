import React, { memo, useCallback, useMemo } from "react";
import { Image, StyleSheet, Text, View } from "react-native";
import { scale } from "react-native-size-matters";
import { useLogger } from "../../hooks/useLogger";
import { ScalePressable } from "../common/ScalePressable";
import { LinearGradient } from "expo-linear-gradient";
import { colors, shadows, spacing, borderRadius } from "../../theme";

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
      <LinearGradient
        colors={['rgba(255,255,255,0.9)', 'rgba(255,255,255,0.6)']}
        style={styles.cardGradient}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
      >
        <View style={styles.contentRow}>
          <Image
            source={carImage}
            style={styles.image}
            resizeMode="contain"
          />

          <View style={styles.infoContainer}>
            <Text style={styles.title}>{typeCar}</Text>
            <Text style={styles.subtext}>{descr}</Text>
            <Text style={styles.subtext}>{descr2}</Text>
          </View>

          <View style={styles.priceContainer}>
            <Text style={styles.currency}>AOA</Text>
            <Text style={styles.price}>{formattedPrice}</Text>
          </View>
        </View>
      </LinearGradient>
    </ScalePressable>
  );
});

const styles = StyleSheet.create({
  container: {
    marginBottom: spacing.sm,
    marginHorizontal: spacing.xl,
    ...shadows.lg,
  },
  cardGradient: {
    borderRadius: borderRadius.xxl,
    padding: spacing.lg,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.6)',
  },
  contentRow: {
    flexDirection: "row",
    alignItems: 'center',
  },
  image: {
    width: scale(80),
    height: scale(50),
    marginRight: spacing.lg,
  },
  infoContainer: {
    flex: 1,
  },
  title: {
    fontSize: scale(18),
    fontWeight: "800",
    color: colors.textPrimary,
    marginBottom: spacing.xs,
  },
  subtext: {
    fontSize: scale(12),
    color: colors.textSecondary,
    fontWeight: "500",
  },
  priceContainer: {
    alignItems: 'flex-end',
    justifyContent: 'center',
  },
  currency: {
    fontSize: scale(12),
    fontWeight: "700",
    color: colors.textMuted,
    marginBottom: scale(2),
  },
  price: {
    fontSize: scale(20),
    fontWeight: "900",
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
