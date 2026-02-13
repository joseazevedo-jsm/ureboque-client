import React, { memo, useCallback } from "react";
import { Image, StyleSheet, Text, View, TouchableOpacity } from "react-native";
import { scale } from "react-native-size-matters";
import Animated, {
  FadeInRight,
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  runOnJS,
} from "react-native-reanimated";
import * as Haptics from "expo-haptics";
import { colors, spacing, shadows, fontWeights } from "../../theme";

const CARD_WIDTH = scale(148);
const CARD_HEIGHT = scale(78);
const TRUCK_WIDTH = scale(95);
const TRUCK_HEIGHT = scale(42);

/**
 * CardSpots - "Watermark Background" Design
 * Large subtle truck as atmospheric branding element behind the content
 */
const CardSpots = memo(
  ({
    title,
    description,
    onPress,
    index = 0,
    isAddFavorite = false,
  }) => {
    const cardScale = useSharedValue(1);
    const cardTranslateY = useSharedValue(0);

    const triggerHaptic = useCallback(() => {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => { });
    }, []);

    const handlePressIn = useCallback(() => {
      cardScale.value = withSpring(0.97, { damping: 20, stiffness: 400 });
      cardTranslateY.value = withSpring(2, { damping: 20, stiffness: 400 });
      runOnJS(triggerHaptic)();
    }, []);

    const handlePressOut = useCallback(() => {
      cardScale.value = withSpring(1, { damping: 15, stiffness: 300 });
      cardTranslateY.value = withSpring(0, { damping: 15, stiffness: 300 });
    }, []);

    const handlePress = useCallback(() => {
      if (onPress) {
        onPress();
      }
    }, [onPress]);

    const cardAnimatedStyle = useAnimatedStyle(() => ({
      transform: [
        { scale: cardScale.value },
        { translateY: cardTranslateY.value },
      ],
    }));

    return (
      <Animated.View
        entering={FadeInRight.delay(index * 40).springify().damping(15)}
      >
        <TouchableOpacity
          activeOpacity={1}
          onPressIn={handlePressIn}
          onPressOut={handlePressOut}
          onPress={handlePress}
        >
          <Animated.View
            style={[
              styles.cardContainer,
              isAddFavorite && styles.addCardContainer,
              cardAnimatedStyle,
            ]}
          >
            {/* Truck Watermark - large subtle background element */}
            <Image
              source={require("../../../resources/icons/UREB_CARD.png")}
              style={styles.truckWatermark}
              resizeMode="contain"
            />

            {/* Content Area */}
            <View style={styles.content}>
              {/* Text Content */}
              <View style={styles.textContainer}>
                <Text style={styles.title} numberOfLines={1}>
                  {title}
                </Text>
                <Text style={styles.description} numberOfLines={1}>
                  {description}
                </Text>
              </View>
            </View>
          </Animated.View>
        </TouchableOpacity>
      </Animated.View>
    );
  }
);

const styles = StyleSheet.create({
  cardContainer: {
    width: CARD_WIDTH,
    height: CARD_HEIGHT,
    backgroundColor: "#FFFFFF",
    borderRadius: scale(14),
    marginRight: spacing.md,
    marginBottom: scale(6),
    borderWidth: 1,
    borderColor: "rgba(0,137,255,0.10)",
    overflow: "hidden",
    ...shadows.md,
  },
  addCardContainer: {
    backgroundColor: "#F0F9FF",
    borderColor: colors.primary,
  },
  truckWatermark: {
    position: "absolute",
    right: scale(6),
    bottom: scale(0),
    width: TRUCK_WIDTH,
    height: TRUCK_HEIGHT,
    opacity: 0.25,
  },
  content: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: scale(14),
  },
  textContainer: {
    flex: 1,
  },
  title: {
    fontSize: scale(14),
    fontWeight: "700",
    color: "#0F172A",
    letterSpacing: -0.2,
    textShadowColor: "rgba(255,255,255,0.9)",
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 4,
  },
  description: {
    fontSize: scale(11),
    fontWeight: fontWeights.light,
    color: colors.textPrimary,
    marginTop: scale(3),
    letterSpacing: 0.1,
    textShadowColor: "rgba(255,255,255,1)",
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 3,
  },
});

export default CardSpots;
