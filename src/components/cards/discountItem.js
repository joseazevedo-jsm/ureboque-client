import React from "react";
import { View, Text, StyleSheet } from "react-native";
import { scale } from "react-native-size-matters";

const DiscountItem = ({ code, description }) => {
  return (
    <View style={styles.container}>
      <Text style={styles.code}>{code}</Text>
      <Text style={styles.description}>{description}</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    paddingVertical: scale(5),
    paddingHorizontal: scale(10),
    marginVertical: scale(15),
    marginHorizontal: scale(0),
    elevation: 2,
    backgroundColor: "#fff",
  },
  code:{
    fontWeight:"bold",
    paddingVertical:scale(10)
  },
  description:{
    paddingVertical:scale(20)
  }
});

export default DiscountItem;
