import React from "react";
import { Modal, Platform, KeyboardAvoidingView } from "react-native";
import {
  View,
  Text,
  TextInput,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  Image,
} from "react-native";
import { useChatModal } from "./component/useChatModal";
import MaterialIcons from "@expo/vector-icons/MaterialIcons";
const Icon = MaterialIcons;
import { scale } from "react-native-size-matters";
import ChatItem from "../../cards/chatItem";
import { colors, shadows, borderRadius, spacing } from "../../../theme";

const imgDef =
  "https://w7.pngwing.com/pngs/178/595/png-transparent-user-profile-computer-icons-login-user-avatars-thumbnail.png";

const ChatModal = ({ visible, closeModal, idService, driver, setUnreadMessageCount, onCallDriver }) => {
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
      />
    );
  };

  return (
    <Modal onRequestClose={closeModal} visible={visible} animationType="slide">
      <KeyboardAvoidingView
        style={styles.container}
        behavior={Platform.OS === "ios" ? "padding" : "height"}
      >
        {/* Header */}
        <View style={styles.topBar}>
          <TouchableOpacity style={styles.iconButton} onPress={closeModal}>
            <Icon name="arrow-back" size={scale(22)} color={colors.primary} />
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
            <Icon name="phone" size={scale(22)} color={colors.primary} />
          </TouchableOpacity>
        </View>

        {/* Messages */}
        <FlatList
          data={models.messages}
          keyExtractor={(item, index) => String(
            item?._id ||
            `${item?.message?.createdAt || item?.createdAt || item?.message?.timestamp || 'message'}-${item?.message?.sender || 'unknown'}-${index}`
          )}
          renderItem={renderItem}
          contentContainerStyle={styles.messageList}
          ListFooterComponent={<View style={{ height: scale(8) }} />}
        />

        {/* Input */}
        <View style={styles.inputContainer}>
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
    paddingTop: spacing.modalSafeTop,
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
    borderRadius: scale(20),
    backgroundColor: colors.primaryLight,
    alignItems: "center",
    justifyContent: "center",
  },
  driverInfo: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
    justifyContent: "center",
    marginHorizontal: spacing.md,
  },
  avatarWrapper: {
    position: "relative",
    marginRight: spacing.sm,
  },
  driverPhoto: {
    width: scale(42),
    height: scale(42),
    borderRadius: scale(21),
    borderWidth: 2,
    borderColor: colors.primary,
  },
  onlineDot: {
    position: "absolute",
    bottom: 1,
    right: 1,
    width: scale(10),
    height: scale(10),
    borderRadius: scale(5),
    backgroundColor: colors.success,
    borderWidth: 2,
    borderColor: colors.surface,
  },
  driverTextGroup: {
    justifyContent: "center",
  },
  driverName: {
    fontSize: scale(15),
    fontWeight: "700",
    color: colors.textPrimary,
  },
  onlineLabel: {
    fontSize: scale(12),
    color: colors.success,
    fontWeight: "600",
  },
  messageList: {
    paddingTop: spacing.md,
  },
  inputContainer: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.md,
    paddingBottom: scale(28),
    backgroundColor: colors.surface,
    borderTopWidth: 1,
    borderTopColor: colors.borderLight,
  },
  input: {
    flex: 1,
    fontSize: scale(15),
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
    backgroundColor: colors.background,
    borderRadius: borderRadius.xxl,
    borderWidth: 1,
    borderColor: colors.borderLight,
    marginRight: spacing.sm,
    color: colors.textPrimary,
    maxHeight: scale(100),
  },
  sendButton: {
    width: scale(44),
    height: scale(44),
    borderRadius: scale(22),
    backgroundColor: colors.primary,
    alignItems: "center",
    justifyContent: "center",
    ...shadows.primaryGlow,
  },
});

export default ChatModal;
