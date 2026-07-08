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
import { colors, spacing, shadows, fontWeights, animations } from "../../theme";

const CARD_WIDTH = scale(155);
const CARD_HEIGHT = scale(100);

const CardSpots = memo(
  ({
    title,
    description,
    onPress,
    index = 0,
    isAddFavorite = false,
    iconSource,
  }) => {
    const cardScale = useSharedValue(1);
    const cardTranslateY = useSharedValue(0);

    const triggerHaptic = useCallback(() => {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
    }, []);

    const handlePressIn = useCallback(() => {
      cardScale.value = withSpring(0.97, animations.spring.press);
      cardTranslateY.value = withSpring(2, animations.spring.press);
      runOnJS(triggerHaptic)();
    }, []);

    const handlePressOut = useCallback(() => {
      cardScale.value = withSpring(1, animations.spring.release);
      cardTranslateY.value = withSpring(0, animations.spring.release);
    }, []);

    const handlePress = useCallback(() => {
      if (onPress) onPress();
    }, [onPress]);

    const cardAnimatedStyle = useAnimatedStyle(() => ({
      transform: [
        { scale: cardScale.value },
        { translateY: cardTranslateY.value },
      ],
    }));

    return (
      <Animated.View
        entering={FadeInRight.delay(index * animations.stagger.list)
          .springify()
          .damping(28)
          .stiffness(180)}
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
            {iconSource ? (
              <Image
                source={iconSource}
                style={styles.icon}
                resizeMode="contain"
              />
            ) : null}

            <View style={styles.textContainer}>
              <Text style={styles.title} numberOfLines={1}>
                {title}
              </Text>
              {description ? (
                <Text style={styles.description} numberOfLines={2}>
                  {description}
                </Text>
              ) : null}
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
    backgroundColor: colors.surface,
    borderRadius: scale(14),
    marginRight: spacing.md,
    marginBottom: scale(6),
    borderWidth: 1,
    borderColor: colors.borderLight,
    overflow: "hidden",
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: spacing.sm,
    ...shadows.md,
  },
  addCardContainer: {
    backgroundColor: colors.surface,
    borderColor: colors.borderLight,
  },
  icon: {
    width: scale(50),
    height: scale(50),
    marginRight: spacing.sm,
  },
  textContainer: {
    flex: 1,
  },
  title: {
    fontSize: scale(13),
    fontWeight: "700",
    color: colors.textPrimary,
    letterSpacing: -0.2,
  },
  description: {
    fontSize: scale(11),
    fontWeight: fontWeights.light,
    color: colors.textSecondary,
    marginTop: scale(3),
    lineHeight: scale(15),
  },
});

export default CardSpots;
