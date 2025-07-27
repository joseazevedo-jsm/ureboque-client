import React, { memo } from "react";
import { View, TouchableOpacity, StyleSheet, Text, Image } from "react-native";
import Icon from "react-native-vector-icons/MaterialIcons";
import { scale } from "react-native-size-matters";

const RouteItem = memo(({ origin, destination }) => {
  return (
    <View>
      <View style={styles.placeContainer}>
        <Icon name="circle" size={scale(15)} color="#0089FF" style={styles.originIcon} />
        <Text style={styles.place}>{origin}</Text>
      </View>
      <View>
        <Image
          source={require("../../../resources/icons/lineRouteDots.png")}
          style={styles.lineImage}
        />
      </View>
      <View style={styles.placeContainer}>
        <Icon name="location-on" size={scale(22)} color="#0089FF" />
        <Text style={styles.placeDestination}>{destination}</Text>
      </View>
    </View>
  );
});

const styles = StyleSheet.create({
  placeContainer: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: scale(3)
  },
  place: {
    fontSize: scale(14),
    paddingHorizontal: scale(10),
  },
  placeDestination: {
    fontSize: scale(14),
    paddingHorizontal: scale(6),
  },
  originIcon: {
    marginLeft: scale(4)
  },
  lineImage: {
    marginLeft: scale(11), 
    height: scale(22)
  }
});

export default RouteItem;
