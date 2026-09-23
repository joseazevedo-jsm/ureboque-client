import React from 'react';
import { AppPressable as TouchableOpacity } from './AppPressable';

import Animated, {
    useSharedValue,
    useAnimatedStyle,
    withSpring,
    ReduceMotion
} from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';
import { animations } from '../../theme';

export const ScalePressable = ({
    children,
    style,
    onPress,
    disabled,
    scaleTo = 0.95,
    hapticFeedback = Haptics.ImpactFeedbackStyle.Light,
    onPressIn,
    onPressOut,
    ...props
}) => {
    const scale = useSharedValue(1);

    const handlePressIn = (event) => {
        if (disabled) return;
        scale.value = withSpring(scaleTo, { ...animations.spring.press, reduceMotion: ReduceMotion.System });
        onPressIn?.(event);
        Haptics.impactAsync(hapticFeedback).catch(() => { });
    };

    const handlePressOut = (event) => {
        scale.value = withSpring(1, { ...animations.spring.release, reduceMotion: ReduceMotion.System });
        onPressOut?.(event);
    };

    const animatedStyle = useAnimatedStyle(() => ({
        transform: [{ scale: scale.value }],
    }));

    return (
        <TouchableOpacity
            {...props}
            activeOpacity={1}
            onPressIn={handlePressIn}
            onPressOut={handlePressOut}
            onPress={onPress}
            disabled={disabled}
            suppressDisabledOpacity
        >
            <Animated.View style={[style, animatedStyle]}>
                {children}
            </Animated.View>
        </TouchableOpacity>
    );
};
