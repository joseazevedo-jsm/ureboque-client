import React from "react";
import { Image, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { Icon } from "react-native-elements/dist/icons/Icon";
import { scale } from "react-native-size-matters";

// card view that receives props like title, description
const CardSpots = (props) => {
  return (
    <TouchableOpacity onPress={props.onPress}>
      <View style={styles.container}>
        <Text style={styles.title}>{props.title}</Text>
        <Text style={styles.description}>{props.description}</Text>
        <View style={styles.bottom}>
          <Image
            style={styles.image}
            source={require("../../../resources/icons/UREB_CARD.png")}
            resizeMode="cover"
          />
          <Icon
            name="location-on"
            size={scale(23)}
            color="#0089FF"
            style={styles.icon}
          />
        </View>
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  container: {
    borderColor: "black",
    borderWidth: scale(4),
    padding: scale(5),
    width: scale(150),
    height: scale(100),
    borderRadius: scale(7),
    borderColor: "#0089ff",
    marginRight: scale(7),
  },
  title: {
    fontSize: scale(12),
    fontWeight: "bold",
  },
  image: {
    marginLeft: scale(7),
  },
  icon: {
    marginLeft: scale(22),
  },
  bottom: {
    position: "absolute",
    flexDirection: "row",
    top: scale(60),
  },
  description: {
    fontSize: scale(8),
  },
});
export default CardSpots;
