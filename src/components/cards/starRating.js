import React from 'react';
import { View, TouchableOpacity } from 'react-native';
import Icon from 'react-native-vector-icons/MaterialIcons';
import { scale } from "react-native-size-matters";

const StarRating = ({ rating, onRate }) => {
  const renderStar = (index) => {
    const isFilled = index < rating;
    const starColor =  '#0089ff' ;

    return (
      <TouchableOpacity key={index} onPress={() => onRate(index + 1)}>
        <Icon name={isFilled ? 'star' : 'star-border'} size={scale(35)} color={starColor} />
      </TouchableOpacity>
    );
  };

  return (
    <View style={{ flexDirection: 'row' }}>
      {[...Array(5)].map((_, index) => renderStar(index))}
    </View>
  );
};

export default StarRating;