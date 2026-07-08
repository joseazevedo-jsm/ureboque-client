import React from "react";
import { View, Text, StyleSheet } from "react-native";
import { scale } from "react-native-size-matters";
import { colors, shadows, borderRadius } from "../../theme";

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
    borderRadius: borderRadius.xl,
    paddingVertical: scale(10),
    paddingHorizontal: scale(14),
    marginTop: scale(6),
    marginHorizontal: scale(14),
    maxWidth: "78%",
  },
  senderContainer: {
    alignSelf: "flex-end",
    backgroundColor: colors.primary,
    borderBottomRightRadius: scale(4),
    ...shadows.primaryGlow,
  },
  receiverContainer: {
    alignSelf: "flex-start",
    backgroundColor: colors.surface,
    borderBottomLeftRadius: scale(4),
    borderWidth: 1,
    borderColor: colors.borderLight,
    ...shadows.sm,
  },
  messageText: {
    fontSize: scale(15),
    lineHeight: scale(21),
    marginBottom: scale(4),
  },
  senderMessageText: {
    color: colors.surface,
  },
  receiverMessageText: {
    color: colors.textPrimary,
  },
  timestampText: {
    fontSize: scale(11),
    marginTop: scale(2),
    fontWeight: "500",
  },
  senderTimestampText: {
    color: "rgba(255, 255, 255, 0.75)",
    alignSelf: "flex-end",
  },
  receiverTimestampText: {
    color: colors.textMuted,
    alignSelf: "flex-end",
  },
});

export default ChatItem;
