import React from "react";
import { View, StyleSheet } from 'react-native';
import { AppText as Text } from '../common/AppText';
import { AppPressable as TouchableOpacity } from '../common/AppPressable';

import { scale } from "react-native-size-matters";
import { spacing, colors, shadows, borderRadius, typography } from "../../theme";

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
    marginTop: spacing.xs,
    marginBottom: spacing.xs,
    paddingHorizontal: spacing.xs,
  },
  failedText: {
    fontSize: typography.caption.fontSize, lineHeight: typography.caption.lineHeight,
    fontWeight: '600',
    color: colors.error,
  },
  container: {
    borderRadius: borderRadius.xl,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.lg,
    marginBottom: spacing.sm,
    marginHorizontal: spacing.lg,
    maxWidth: "82%",
  },
  senderContainer: {
    alignSelf: "flex-end",
    backgroundColor: colors.primary,
    borderBottomRightRadius: borderRadius.sm,
    ...shadows.primaryGlow,
  },
  receiverContainer: {
    alignSelf: "flex-start",
    backgroundColor: colors.surface,
    borderBottomLeftRadius: borderRadius.sm,
    borderWidth: 1,
    borderColor: colors.borderLight,
    ...shadows.sm,
  },
  messageText: {
    fontSize: typography.bodySmall.fontSize, lineHeight: typography.bodySmall.lineHeight,
    lineHeight: 20,
    marginBottom: spacing.xxs,
  },
  senderMessageText: {
    color: colors.surface,
  },
  receiverMessageText: {
    color: colors.textPrimary,
  },
  timestampText: {
    fontSize: typography.caption.fontSize, lineHeight: typography.caption.lineHeight,
    marginTop: spacing.xxs,
    fontWeight: "500",
  },
  senderTimestampText: {
    color: colors.surfaceTint75,
    alignSelf: "flex-end",
  },
  receiverTimestampText: {
    color: colors.textMuted,
    alignSelf: "flex-end",
  },
});

export default ChatItem;
