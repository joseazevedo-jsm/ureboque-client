import React from "react";
import { Image, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { Icon } from "react-native-elements/dist/icons/Icon";
import { scale } from "react-native-size-matters";

const PlaceItem = ({ name, address, iconUrl, onPress, saved }) => {
  return (
    <TouchableOpacity onPress={onPress}>
      <View style={styles.container}>
        <View style={styles.iconContainer}>
          {saved ? (
            <Icon name={iconUrl} size={scale(25)} color="#0089FF" />
          ) : iconUrl ? (
            <Image source={{ uri: iconUrl }} style={styles.iconImage} />
          ) : (
            <Icon name={"location-on"} size={scale(25)} color="#0089FF" />
          )}
        </View>
        <View style={styles.textContainer}>
          <Text
            style={{
              marginBottom: scale(1),
              fontSize: scale(12),
              fontWeight: "bold",
            }}
          >
            {name}
          </Text>
          <Text style={{ marginBottom: scale(1), fontSize: scale(10) }}>
            {address}
          </Text>
          <View style={styles.divider} />
        </View>
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    alignItems: "center",
    height: scale(60),
  },
  iconContainer: {
    height: scale(45),
    width: scale(45),
    borderRadius: scale(7),
    borderColor: "#0089FF",
    borderWidth: scale(3),
    alignItems: "center",
    justifyContent: "center",
    marginRight: scale(7),
  },
  iconImage: {
    tintColor: "#0089FF",
    height: scale(25),
    width: scale(25),
  },
  textContainer: {
    flex: 1,
    flexShrink: 1,
  },
  divider: {
    borderBottomColor: "#ccc",
    borderBottomWidth: 1,
    marginVertical: scale(5),
  },
});
export default PlaceItem;
{
  /* 
          <Icon
            name="location-on"
            size={scale(25)}
            color="#0089FF"
            style={styles.icon}
          /> */
}
