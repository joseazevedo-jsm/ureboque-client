import React from "react";
import { View, Text, StyleSheet } from "react-native";
import { scale } from "react-native-size-matters";

const ChatItem = ({ text, isSender, timestamp }) => {
  // Format timestamp to display time
  const formatTime = (timestamp) => {
    if (!timestamp) return '';

    try {
      const date = new Date(timestamp);

      // Check if date is valid
      if (isNaN(date.getTime())) {
        return '';
      }

      const now = new Date();
      const diffInDays = Math.floor((now - date) / (1000 * 60 * 60 * 24));

      const timeString = date.toLocaleTimeString('pt-PT', {
        hour: '2-digit',
        minute: '2-digit'
      });

      // If today, show only time
      if (diffInDays === 0) {
        return timeString;
      }

      // If yesterday, show "Ontem" + time
      if (diffInDays === 1) {
        return `Ontem ${timeString}`;
      }

      // Otherwise show date + time
      const dateString = date.toLocaleDateString('pt-PT', {
        day: '2-digit',
        month: '2-digit'
      });

      return `${dateString} ${timeString}`;
    } catch (error) {
      return '';
    }
  };

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
      {timestamp && (
        <Text
          style={[
            styles.timestampText,
            isSender ? styles.senderTimestampText : styles.receiverTimestampText,
          ]}
        >
          {formatTime(timestamp)}
        </Text>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    borderRadius: scale(15),
    paddingVertical: scale(8),
    paddingHorizontal: scale(15),
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
    marginBottom: scale(3),
  },
  senderMessageText: {
    color: "#fff",
  },
  receiverMessageText: {
    color: "#000",
  },
  timestampText: {
    fontSize: scale(10),
    marginTop: scale(2),
  },
  senderTimestampText: {
    color: "rgba(255, 255, 255, 0.7)",
    alignSelf: "flex-end",
  },
  receiverTimestampText: {
    color: "rgba(0, 0, 0, 0.5)",
    alignSelf: "flex-end",
  },
});

export default ChatItem;
