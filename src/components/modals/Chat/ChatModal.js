import React from "react";
import { Modal, Platform, KeyboardAvoidingView } from "react-native";
import { View, FlatList, StyleSheet, Image } from 'react-native';
import { AppText as Text, AppTextInput as TextInput } from '../../common/AppText';
import { AppPressable as TouchableOpacity } from '../../common/AppPressable';

import { useChatModal } from "./component/useChatModal";
import MaterialIcons from "@expo/vector-icons/MaterialIcons";
const Icon = MaterialIcons;
import { scale } from "react-native-size-matters";
import ChatItem from "../../cards/chatItem";
import { colors, shadows, borderRadius, spacing, typography, sizes } from "../../../theme";
import { useSafeAreaInsets } from "react-native-safe-area-context";

const imgDef =
  "https://w7.pngwing.com/pngs/178/595/png-transparent-user-profile-computer-icons-login-user-avatars-thumbnail.png";

const ChatModal = ({ visible, closeModal, idService, driver, setUnreadMessageCount, onCallDriver }) => {
  const insets = useSafeAreaInsets();
  const { models, operations } = useChatModal(idService, setUnreadMessageCount);

  const extractTimestampFromObjectId = (objectId) => {
    if (!objectId || typeof objectId !== "string" || objectId.length !== 24) return null;
    try {
      return new Date(parseInt(objectId.substring(0, 8), 16) * 1000).toISOString();
    } catch {
      return null;
    }
  };

  const renderItem = ({ item }) => {
    if (!item?.message) return null;
    const timestamp =
      item.message?.createdAt ||
      item.createdAt ||
      item.message?.timestamp ||
      extractTimestampFromObjectId(item._id);
    return (
      <ChatItem
        text={item.message.message ?? ""}
        isSender={item.message.sender === models.user?.id}
        timestamp={timestamp}
        deliveryStatus={item.deliveryStatus}
        onRetry={item.localId ? () => operations.retryMessage(item.localId) : undefined}
      />
    );
  };

  return (
    <Modal onRequestClose={closeModal} visible={visible} animationType="slide" statusBarTranslucent navigationBarTranslucent>
      <KeyboardAvoidingView
        style={styles.container}
        behavior={Platform.OS === "ios" ? "padding" : "height"}
      >
        {/* Header */}
        <View style={[styles.topBar, { paddingTop: insets.top + spacing.sm }]}>
          <TouchableOpacity style={styles.iconButton} onPress={closeModal}>
            <Icon name="arrow-back" size={sizes.iconLarge} color={colors.primary} />
          </TouchableOpacity>

          <View style={styles.driverInfo}>
            <View style={styles.avatarWrapper}>
              <Image
                source={{ uri: driver?.photo || imgDef }}
                style={styles.driverPhoto}
              />
              <View style={styles.onlineDot} />
            </View>
            <View style={styles.driverTextGroup}>
              <Text style={styles.driverName} numberOfLines={1}>{driver?.name}</Text>
              <Text style={styles.onlineLabel}>Online</Text>
            </View>
          </View>

          <TouchableOpacity style={styles.iconButton} onPress={onCallDriver}>
            <Icon name="phone" size={sizes.iconLarge} color={colors.primary} />
          </TouchableOpacity>
        </View>

        {/* Messages */}
        <FlatList
          style={styles.messages}
          data={models.messages}
          keyExtractor={(item, index) => String(
            item?._id ||
            `${item?.message?.createdAt || item?.createdAt || item?.message?.timestamp || 'message'}-${item?.message?.sender || 'unknown'}-${index}`
          )}
          renderItem={renderItem}
          contentContainerStyle={styles.messageList}
          keyboardShouldPersistTaps="handled"
          ListFooterComponent={<View style={{ height: scale(8) }} />}
        />

        {/* Input */}
        <View style={[styles.inputContainer, { paddingBottom: Math.max(insets.bottom, spacing.lg) }]}>
          <TextInput
            style={styles.input}
            value={models.newMessage}
            onChangeText={operations.setNewMessage}
            placeholder="Digite uma mensagem..."
            placeholderTextColor={colors.textMuted}
            multiline
          />
          <TouchableOpacity
            style={styles.sendButton}
            onPress={() => {
              if (!models.newMessage.trim()) return;
              operations.sendMessage();
            }}
          >
            <Icon name="send" size={scale(20)} color={colors.surface} />
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  topBar: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingBottom: spacing.lg,
    paddingHorizontal: spacing.lg,
    backgroundColor: colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: colors.borderLight,
    ...shadows.md,
  },
  iconButton: {
    width: scale(40),
    height: scale(40),
    borderRadius: borderRadius.lg,
    backgroundColor: colors.primaryLight,
    alignItems: "center",
    justifyContent: "center",
  },
  driverInfo: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
    justifyContent: "flex-start",
    marginHorizontal: spacing.md,
  },
  avatarWrapper: {
    position: "relative",
    marginRight: spacing.sm,
  },
  driverPhoto: {
    width: scale(42),
    height: scale(42),
    borderRadius: borderRadius.xxl,
    borderWidth: 2,
    borderColor: colors.primary,
  },
  onlineDot: {
    position: "absolute",
    bottom: 1,
    right: 1,
    width: scale(10),
    height: scale(10),
    borderRadius: borderRadius.sm,
    backgroundColor: colors.success,
    borderWidth: 2,
    borderColor: colors.surface,
  },
  driverTextGroup: {
    justifyContent: "center",
    flex: 1,
  },
  driverName: {
    fontSize: typography.bodySmall.fontSize, lineHeight: typography.bodySmall.lineHeight,
    fontWeight: "700",
    color: colors.textPrimary,
  },
  onlineLabel: {
    fontSize: typography.caption.fontSize, lineHeight: typography.caption.lineHeight,
    color: colors.success,
    fontWeight: "600",
  },
  messages: {
    flex: 1,
  },
  messageList: {
    flexGrow: 1,
    justifyContent: 'flex-end',
    paddingTop: spacing.xl,
    paddingBottom: spacing.md,
  },
  inputContainer: {
    flexDirection: "row",
    alignItems: "flex-end",
    paddingTop: spacing.md,
    paddingHorizontal: spacing.lg,
    backgroundColor: colors.surface,
    borderTopWidth: 1,
    borderTopColor: colors.borderLight,
  },
  input: {
    flex: 1,
    minHeight: sizes.control,
    fontSize: typography.bodySmall.fontSize, lineHeight: typography.bodySmall.lineHeight,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    backgroundColor: colors.background,
    borderRadius: borderRadius.xxl,
    borderWidth: 1,
    borderColor: colors.borderLight,
    marginRight: spacing.sm,
    color: colors.textPrimary,
    maxHeight: scale(120),
  },
  sendButton: {
    width: scale(44),
    height: scale(44),
    borderRadius: borderRadius.xxl,
    backgroundColor: colors.primary,
    alignItems: "center",
    justifyContent: "center",
    ...shadows.primaryGlow,
  },
});

export default ChatModal;
