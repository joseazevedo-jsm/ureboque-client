import React from 'react';
import { View, TouchableOpacity, StyleSheet } from 'react-native';
import Icon from 'react-native-vector-icons/MaterialIcons';
import { scale } from "react-native-size-matters";
import { colors } from "../../theme";

const StarRating = ({
  rating,
  onRate,
  size = scale(38),
  activeColor = colors.primary,
  inactiveColor = colors.textMuted,
  gap = scale(6),
}) => {
  const renderStar = (index) => {
    const isFilled = index < rating;
    const starColor = isFilled ? activeColor : inactiveColor;

    return (
      <TouchableOpacity
        key={index}
        onPress={() => onRate(index + 1)}
        style={{ marginHorizontal: gap / 2 }}
        activeOpacity={0.7}
      >
        <Icon
          name={isFilled ? 'star' : 'star-border'}
          size={size}
          color={starColor}
        />
      </TouchableOpacity>
    );
  };

  return (
    <View style={styles.container}>
      {[...Array(5)].map((_, index) => renderStar(index))}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
});

export default StarRating;