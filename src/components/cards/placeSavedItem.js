import React from "react";
import { Image, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { Icon } from "react-native-elements/dist/icons/Icon";
import { scale } from "react-native-size-matters";

const PlaceSavedItem = ({ place, edit, onPressEditItem, add }) => {
  return (
    <>
      <View style={styles.container}>
        <View style={styles.iconContainer}>
          {place.name.includes("Casa") ? (
            <Icon name="house" size={scale(30)} color="#0089FF" />
          ) : place.name.includes("Trabalho") ? (
            <Icon name="work" size={scale(30)} color="#0089FF" />
          ) : (
            <Icon name="bookmark-outline" size={scale(30)} color="#0089FF" />
          )}
        </View>
        <View style={styles.textContainer}>
          <Text
            style={{
              fontSize: scale(12),
              fontWeight: "bold",
              textAlignVertical: "center",
            }}
          >
            {place.name}
          </Text>
          {add && (
            <TouchableOpacity onPress={onPressEditItem}>
              <Icon name="add" size={scale(30)} color="#ccc" />
            </TouchableOpacity>
          )}
          {edit && !add && (
            <TouchableOpacity onPress={onPressEditItem}>
              <Icon name="edit-off" size={scale(30)} color="#ccc" />
            </TouchableOpacity>
          )}
        </View>
      </View>
      <View style={styles.divider} />
    </>
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
    borderWidth: scale(2),
    borderColor: "#0089FF",
    alignItems: "center",
    justifyContent: "center",
    marginRight: scale(7),
  },
  iconImage: {
    tintColor: "#fff",
    height: scale(25),
    width: scale(25),
  },
  textContainer: {
    flex: 1,
    flexShrink: 1,
    flexDirection: "row",
    justifyContent: "space-between",
    marginRight: scale(10),
  },
  divider: {
    borderBottomColor: "#ccc",
    borderBottomWidth: scale(1),
    marginRight: scale(10),
  },
});
export default PlaceSavedItem;
