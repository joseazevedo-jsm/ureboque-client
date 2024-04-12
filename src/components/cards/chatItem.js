import React from "react";
import { View, Text, StyleSheet } from "react-native";
import { scale } from "react-native-size-matters";

const ChatItem = ({ text, isSender }) => {
  return (
    <View
      style={[
        styles.container,
        isSender ? styles.senderContainer : styles.receiverContainer,
      ]}
    >
      <Text
        style={[
          styles.messageText,
          isSender ? styles.senderMessageText : styles.receiverMessageText,
        ]}
      >
        {text}
      </Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    borderRadius: scale(15),
    paddingVertical: scale(5),
    paddingHorizontal: scale(20),
    marginTop: scale(15),
    marginHorizontal: scale(10),
    maxWidth: "70%",
  },
  senderContainer: {
    alignSelf: "flex-end",
    backgroundColor: "#0089FF",
  },
  receiverContainer: {
    alignSelf: "flex-start",
    backgroundColor: "#E6E6E6",
  },
  messageText: {
    fontSize: scale(15),
  },
  senderMessageText: {
    color: "#fff",
  },
  receiverMessageText: {
    color: "#000",
  },
});

export default ChatItem;
