import React from "react";
import { Dimensions, StyleSheet, Text, TextInput, View } from "react-native";
import { scale } from "react-native-size-matters";
import Icon from "react-native-vector-icons/MaterialIcons";
import { Picker } from "react-native";
import { useState } from "react";
import { Dropdown } from "react-native-element-dropdown";

const FlatListHeader = ({
  destinationValue,
  onDestinationTextChange,
  onInputTextChange,
  onFocus,
  inputOrigin,
  inputDestination,
  inputRef,
  inputCurr,
  onInputIndex,
}) => {
  console.log("-> dest ", inputDestination);

  return (
    <View style={styles.header}>
      <View style={styles.container}>
        <View style={styles.inputBox}>
          <View style={{ width: "100%" }}>
            <View>
              <View style={styles.input}>
                <Icon name="my-location" size={scale(25)} color="#0089ff" />
                <TextInput
                  style={{
                    marginLeft: scale(5),
                    color: "black",
                    fontSize: scale(16),
                  }}
                  placeholder={
                    inputOrigin && !inputCurr
                      ? inputOrigin
                      : "Localização atual"
                  }
                  placeholderTextColor={"#000"}
                  onChangeText={onDestinationTextChange}
                  onFocus={() => {
                    onFocus(0);
                    onInputIndex(0);
                  }}
                />
              </View>
              <View style={styles.inputy}>
                <Icon name="location-on" size={scale(25)} color="#0089ff" />
                <TextInput
                  ref={inputRef}
                  style={{
                    marginLeft: scale(5),
                    color: "black",
                    fontSize: scale(16),
                  }}
                  placeholder={
                    inputDestination ? inputDestination : "Para onde está indo"
                  }
                  placeholderTextColor={"#000"}
                  onChangeText={onDestinationTextChange}
                  onFocus={() => {
                    onInputTextChange(onFocus);
                    onInputIndex(1);
                  }}
                  autoFocus={true}
                />
              </View>
            </View>
          </View>
        </View>
      </View>
      <View style={styles.divider} />
    </View>
  );
};
const styles = StyleSheet.create({
  header: {
    backgroundColor: "#fff",
  },
  container: {
    flexDirection: "row",
    width: Dimensions.get("window").width - scale(50),
    alignContent: "center",
  },
  inputBox: {
    borderRadius: scale(7),
    borderColor: "#0089ff",
    borderWidth: scale(4),
    width: "100%",
    flexDirection: "row",
    alignItems: "center",
  },

  input: {
    minHeight: scale(30),
    padding: scale(7),
    borderColor: "#0089ff",
    borderBottomWidth: scale(2),
    flexDirection: "row",
  },
  inputy: {
    minHeight: scale(30),
    padding: scale(7),
    borderColor: "#0089ff",
    borderTopWidth: scale(2),
    flexDirection: "row",
  },
  divider: {
    borderBottomColor: "#ccc",
    borderBottomWidth: 1,
    marginVertical: scale(5),
  },
  dropdown: {
    minHeight: scale(30),
    borderRadius: scale(7),
    borderColor: "#0089ff",
    borderWidth: scale(4),
    width: Dimensions.get("window").width - scale(50),
    padding: scale(7),
  },
  icon: {
    marginRight: 5,
  },
  label: {
    position: "absolute",
    backgroundColor: "white",
    left: 22,
    top: 8,
    zIndex: 999,
    paddingHorizontal: 8,
    fontSize: 14,
  },
  placeholderStyle: {
    marginLeft: scale(5),
    color: "black",
    fontSize: scale(16),
  },
  selectedTextStyle: {
    marginLeft: scale(5),
    color: "black",
    fontSize: scale(16),
  },
  iconStyle: {
    width: 20,
    height: 20,
  },
  inputSearchStyle: {
    height: 40,
    fontSize: 16,
  },
});

export default FlatListHeader;
