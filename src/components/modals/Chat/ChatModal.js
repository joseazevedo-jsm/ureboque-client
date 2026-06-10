import React, { useEffect, useState } from "react";
import { Modal, Platform, KeyboardAvoidingView } from "react-native";
import {
  View,
  Text,
  TextInput,
  FlatList,
  TouchableOpacity,
  StyleSheet,
} from "react-native";
import { useChatModal } from "./component/useChatModal";
import Icon from "react-native-vector-icons/MaterialIcons";
import { scale } from "react-native-size-matters";
import { Image } from "react-native";
import ChatItem from "../../cards/chatItem";
import { colors, shadows, borderRadius, spacing } from "../../../theme";

const imgDef = "https://w7.pngwing.com/pngs/178/595/png-transparent-user-profile-computer-icons-login-user-avatars-thumbnail.png";

const ChatModal = ({ visible, closeModal, idService, driver, navigation, setUnreadMessageCount, onCallDriver }) => {
  const { models, operations } = useChatModal(idService, setUnreadMessageCount);

  const handleBackButtonPress = () => {
    closeModal();
  };

  // Extract timestamp from MongoDB ObjectId as fallback
  const extractTimestampFromObjectId = (objectId) => {
    if (!objectId || typeof objectId !== 'string' || objectId.length !== 24) {
      return null;
    }
    try {
      // MongoDB ObjectId first 8 characters represent timestamp in seconds since epoch
      const timestamp = parseInt(objectId.substring(0, 8), 16) * 1000;
      return new Date(timestamp).toISOString();
    } catch (error) {
      return null;
    }
  };

  const renderItem = ({ item, index }) => {
    if (!item?.message) return null;

    const timestamp =
      item.message?.createdAt ||
      item.createdAt ||
      item.message?.timestamp ||
      extractTimestampFromObjectId(item._id);

    return (
      <ChatItem
        text={item.message.message ?? ''}
        isSender={item.message.sender === models.user?.id}
        timestamp={timestamp}
      />
    );
  };

  return (
    <Modal onRequestClose={closeModal} visible={visible} animationType="slide">
      <KeyboardAvoidingView
        style={styles.container}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <View style={styles.topBar}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={handleBackButtonPress}
          >
            <Icon name="arrow-back" size={scale(26)} color={colors.primary} />
          </TouchableOpacity>
          <View style={{ flexDirection: "row", alignItems: "center" }}>
            <View style={styles.driverPhotoContainer}>
              <Image
                source={{
                  uri: driver?.photo || imgDef,
                }}
                style={styles.driverPhoto}
              />
            </View>
            <View style={{ justifyContent: "center" }}>
              <Text style={styles.topBarTitle}>{driver?.name}</Text>
            </View>
          </View>
          <TouchableOpacity
            style={styles.callButton}
            onPress={onCallDriver}
          >
            <Icon name="phone" size={scale(26)} color={colors.primary} />
          </TouchableOpacity>
        </View>
        <FlatList
          data={models.messages}
          keyExtractor={(item, index) => index.toString()}
          renderItem={renderItem}
          ListFooterComponent={() => <View style={{ height: scale(15) }} />}
        />
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
            <Icon name="send" size={scale(22)} color="#FFFFFF" />
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
    justifyContent: "space-between",
    paddingTop: scale(50),
    backgroundColor: colors.surface,
    paddingBottom: scale(16),
    paddingHorizontal: scale(16),
    alignContent: "center",
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    ...shadows.md,
  },
  topBarTitle: {
    fontSize: scale(17),
    fontWeight: "600",
    color: colors.textPrimary,
    alignSelf: "center",
    paddingHorizontal: scale(12),
  },
  driverPhoto: {
    height: scale(45),
    width: scale(45),
    borderRadius: scale(45),
  },
  driverPhotoContainer: {
    borderRadius: scale(45),
    borderColor: colors.primary,
    borderWidth: scale(2),
    ...shadows.sm,
  },
  inputContainer: {
    backgroundColor: colors.surface,
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: scale(12),
    paddingHorizontal: scale(12),
    paddingBottom: scale(28),
    borderTopWidth: 1,
    borderTopColor: colors.border,
    ...shadows.lg,
  },
  input: {
    flex: 1,
    fontSize: scale(15),
    paddingHorizontal: scale(16),
    paddingVertical: scale(12),
    backgroundColor: colors.background,
    borderRadius: borderRadius.xxl,
    borderWidth: 1,
    borderColor: colors.borderLight,
    marginRight: scale(10),
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
  messageText: {
    paddingVertical: scale(4),
  },
  backButton: {
    alignSelf: "center",
    padding: scale(4),
  },
  callButton: {
    alignSelf: "center",
    padding: scale(4),
  },
});

export default ChatModal;
