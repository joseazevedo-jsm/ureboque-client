import React, { useEffect, useState } from "react";
import { Modal } from "react-native";
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

const ChatModal = ({ visible, closeModal, idService, driver,navigation }) => {
  const { models, operations } = useChatModal(idService);

  const handeBackButtonPress = () => {
    closeModal();
  };

  const renderItem = ({ item }) => {
    return <ChatItem text={item.message.message} isSender={item.message.sender===models.user.id} />;
  };

  return (
    <Modal onRequestClose={closeModal} visible={visible} animationType="slide">
      <View style={styles.container}>
        <View style={styles.topBar}>
          <TouchableOpacity
            style={{ alignSelf: "center" }}
            onPress={handeBackButtonPress}
          >
            <Icon name="arrow-back" size={scale(30)} color="#0089FF" />
          </TouchableOpacity>
          <View style={{ flexDirection: "row" }}>
            <View
              style={{
                borderRadius: scale(45),
                borderColor: "#0089FF",
                borderWidth: scale(2),
              }}
            >
              <Image
                source={{
                  uri: driver?.photo,
                }}
                style={{
                  height: scale(45),
                  width: scale(45),
                  borderRadius: scale(45),
                }}
              />
            </View>
            <View style={{ justifyContent: "center" }}>
              <Text style={styles.topBarTitle}>{driver?.name}</Text>
            </View>
          </View>
          <TouchableOpacity
            style={{ alignSelf: "center" }}
            onPress={"handeBackButtonPress"}
          >
            <Icon name="phone" size={scale(30)} color="#0089FF" />
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
            multiline
          />
          <TouchableOpacity
            style={styles.sendButton}
            onPress={operations.sendMessage}
          >
            <Icon name="send" size={35} color="#007BFF" />
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F0F0F0",
  },
  topBar: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingTop: scale(35),
    backgroundColor: "#fff",
    paddingBottom: scale(15),
    paddingHorizontal: scale(10),
    alignContent: "center",
    elevation: 10,
  },
  topBarTitle: {
    // fontFamily: "Poppins-Medium",
    fontSize: scale(18),
    alignSelf: "center",
    paddingHorizontal: scale(10),
  },
  inputContainer: {
    backgroundColor: "#fff",
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: scale(15),
    elevation: 20,
  },
  input: {
    flex: 1,
    fontSize: scale(15),
    paddingHorizontal: scale(10),
    paddingVertical: scale(10),
    backgroundColor: "#FFFFFF",
    borderRadius: scale(7),
    borderWidth: scale(1),
    borderColor: "#B7B7B7",
    marginHorizontal: scale(10),
  },
  sendButton: {
    padding: scale(8),
    borderRadius: scale(20),
  },
  messageText: {
    paddingVertical: scale(4),
  },
});

export default ChatModal;
