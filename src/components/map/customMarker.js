import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { scale } from 'react-native-size-matters';

const CustomMarker = ({ title, time, color }) => {
  return (
    <View style={styles.wrapper}>
      {/* Info Bubble */}
      {time ? (
        <View style={styles.infoContainer}>
          <View style={styles.leftContainer}>
            <Text style={styles.title}>{title}</Text>
          </View>
          <View style={[styles.rightContainer, { backgroundColor: color }]}>
            <Text style={styles.time}>{time}</Text>
          </View>
        </View>
      ) : (
        <View style={[styles.uniformContainer, { backgroundColor: color }]}>
          <Text style={[styles.title, {color:"#fff"}]}>{title}</Text>
        </View>
      )}

      {/* Pin */}
      <View style={[styles.pin, { backgroundColor: color }]}>
        {/* Outer Circle */}
        <View style={[styles.pinOuterCircle, { backgroundColor: color }]}>
          {/* Inner White Circle */}
          <View style={styles.pinInnerCircle} />
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  wrapper: {
    alignItems: 'center',
  },
  infoContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: scale(20),
    marginBottom: scale(5), // Space between the info container and the pin
    overflow: 'hidden',
  },
  uniformContainer: {
    paddingVertical: scale(5),
    paddingHorizontal: scale(10),
    borderRadius: scale(20),
    marginBottom: scale(5),
    overflow: "hidden",
  },
  leftContainer: {
    backgroundColor: '#ffffff',
    paddingVertical: scale(5),
    paddingHorizontal: scale(10),
    borderTopLeftRadius: scale(20),
    borderBottomLeftRadius: scale(20),
  },
  rightContainer: {
    paddingVertical: scale(5),
    paddingHorizontal: scale(10),
    borderTopRightRadius: scale(20),
    borderBottomRightRadius: scale(20),
  },
  title: {
    color: '#000',
    fontSize: scale(12),
    fontWeight: 'bold',
  },
  time: {
    color: '#fff',
    fontSize: scale(10),
  },
  pin: {
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
    width: scale(4), // Adjust width for a bigger outer circle
    height: scale(36), // Adjust height for the pin shape
  },
  pinOuterCircle: {
    width: scale(20),
    height: scale(20),
    borderRadius: scale(10), // Makes the circle round
    alignItems: 'center',
    justifyContent: 'center',
    position: 'absolute',
    top: 0,
  },
  pinInnerCircle: {
    width: scale(10),
    height: scale(10),
    backgroundColor: '#fff',
    borderRadius: scale(65),
  },
});

export default CustomMarker;