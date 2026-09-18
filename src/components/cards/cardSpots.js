import React, { memo, useCallback } from "react";
import { Image, StyleSheet, View } from 'react-native';
import { AppText as Text } from '../common/AppText';
import { AppPressable as TouchableOpacity } from '../common/AppPressable';

import Animated, {
  FadeInRight,
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  runOnJS,
} from "react-native-reanimated";
import * as Haptics from "expo-haptics";
import { colors, spacing, borderRadius, shadows, typography, sizes, animations } from "../../theme";

// A compact destination card uses the same content rhythm as saved places.
const CARD_WIDTH = sizes.placeCardWidth;

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
          accessibilityRole="button"
          accessibilityLabel={title}
          activeOpacity={0.8}
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
              <Text style={styles.title}>
                {title}
              </Text>
              {description ? (
                <Text style={styles.description}>
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
    minHeight: sizes.placeCardMinHeight,
    backgroundColor: colors.surface,
    borderRadius: borderRadius.lg,
    marginRight: spacing.md,
    marginBottom: spacing.sm,
    borderWidth: 1,
    borderColor: colors.borderLight,
    flexDirection: "column",
    alignItems: "flex-start",
    padding: spacing.md,
    ...shadows.sm,
  },
  addCardContainer: {
    backgroundColor: colors.surface,
    borderColor: colors.borderLight,
  },
  icon: {
    width: sizes.illustration,
    height: sizes.illustration,
    marginBottom: spacing.sm,
  },
  textContainer: {
    width: "100%",
  },
  title: {
    ...typography.label,
    color: colors.textPrimary,
    letterSpacing: -0.2,
  },
  description: {
    ...typography.caption,
    color: colors.textSecondary,
    marginTop: spacing.xs,
  },
});

export default CardSpots;
