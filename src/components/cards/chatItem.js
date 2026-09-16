import React from "react";
import { View, Text, StyleSheet, TouchableOpacity } from "react-native";
import { scale } from "react-native-size-matters";
import { colors, shadows, borderRadius } from "../../theme";

const ChatItem = ({ text, isSender, timestamp, deliveryStatus, onRetry }) => {
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

  const bubble = (
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
          {/* A message the server has not acknowledged must not look delivered.
              Showing only a timestamp made an unsent message indistinguishable
              from a received one. */}
          {formatTime(timestamp)}
          {isSender && deliveryStatus === 'pending' ? '  · a enviar…' : ''}
        </Text>
      )}
    </View>
  );

  if (!isSender || deliveryStatus !== 'failed') return bubble;

  // The retry notice sits outside the bubble: inside it, the bubble's own
  // padding and max-width clipped the text over the message.
  return (
    <View style={styles.failedGroup}>
      {bubble}
      <TouchableOpacity onPress={onRetry} style={styles.failedRow} activeOpacity={0.7}>
        <Text style={styles.failedText}>Não enviado. Tocar para tentar novamente.</Text>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  failedGroup: {
    alignSelf: 'flex-end',
    alignItems: 'flex-end',
    maxWidth: '85%',
  },
  failedRow: {
    marginTop: scale(2),
    marginBottom: scale(6),
    paddingHorizontal: scale(4),
  },
  failedText: {
    fontSize: scale(11),
    fontWeight: '600',
    color: colors.error,
  },
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
