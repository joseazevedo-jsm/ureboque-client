import React from 'react';
import { TouchableOpacity } from 'react-native';
import Animated, {
    useSharedValue,
    useAnimatedStyle,
    withSpring
} from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';

export const ScalePressable = ({
    children,
    style,
    onPress,
    disabled,
    scaleTo = 0.95,
    hapticFeedback = Haptics.ImpactFeedbackStyle.Light
}) => {
    const scale = useSharedValue(1);

    const handlePressIn = () => {
        if (disabled) return;
        scale.value = withSpring(scaleTo);
        Haptics.impactAsync(hapticFeedback).catch(() => { }); // Catch in case haptics fail or on web
    };

    const handlePressOut = () => {
        if (disabled) return;
        scale.value = withSpring(1);
    };

    const animatedStyle = useAnimatedStyle(() => ({
        transform: [{ scale: scale.value }],
    }));

    return (
        <TouchableOpacity
            activeOpacity={1}
            onPressIn={handlePressIn}
            onPressOut={handlePressOut}
            onPress={onPress}
            disabled={disabled}
        >
            <Animated.View style={[style, animatedStyle]}>
                {children}
            </Animated.View>
        </TouchableOpacity>
    );
};
