import React from "react";
import { FlatList } from "react-native";
import { Modal, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { Icon } from "react-native-elements";
import { scale } from "react-native-size-matters";

const CancelationModal = ({
  questions,
  visible,
  onPressQuestion,
  closeModal,
  alert
}) => {
  const handleBackButtonPress = () => {
    closeModal();
  };
  const renderQuestionItem = ({ item }) => {
    return (
      <View style={styles.questionsBox}>
        <TouchableOpacity onPress={() => onPressQuestion(item.question)}>
          <Text style={styles.questions}>{item.question}</Text>
        </TouchableOpacity>
      </View>
    );
  };

  return (
    <Modal
      visible={visible}
      onRequestClose={handleBackButtonPress}
      animationType="fade"
    >
      <View>
        <View style={styles.header}>
            <Icon
              name="close"
              size={scale(30)}
              color="#0089FF"
              onPress={closeModal}
            />
            <Text style={styles.title}>CANCELAR VIAGEM</Text>
            <Text> </Text>
        </View>
        <View style={styles.descriptionBox}>
          <Text style={styles.description}>
            O motorista já viajou por vários minutos. Antes de canecelar
            diga-nos porque quer cancelar!
          </Text>
        </View>
        <View style={styles.questionsContent}>
          <Text style={styles.question}>O que aconteceu? Conte-nos mais:</Text>
          <FlatList
            data={questions}
            renderItem={renderQuestionItem}
            keyExtractor={(item) => item.key.toString()}
          />
        </View>
      </View>
    </Modal>
  );
};
const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  box: {
    backgroundColor: "#fff",
    borderRadius: scale(10),
    alignSelf: "center",
    marginVertical: "50%",
  },
  content: {
    marginHorizontal: scale(10),
    paddingVertical: scale(10),
  },
  buttonnocancel: {
    borderRadius: scale(7),
    padding: scale(15),
    alignItems: "center",
    backgroundColor: "#0089FF",
    marginBottom: scale(10),
  },
  buttoncancel: {
    borderRadius: scale(7),
    padding: scale(15),
    alignItems: "center",
  },
  goback: {
    width: scale(50),
    height: scale(50),
    position: "absolute",
    alignItems: "center",
    justifyContent: "center",
    left: scale(10),
    top: scale(20),
  },
  profile: {
    width: scale(275),
    height: scale(275),
    position: "absolute",
    borderRadius: scale(45 / 2),
    backgroundColor: "#fff",
    alignSelf: "center",
    top: "35%",
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#000",
    shadowOffset: { width: scale(2), height: scale(2) },
    shadowOpacity: 0.5,
    shadowRadius: 4,
    elevation: 8,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    marginHorizontal: scale(10),
    justifyContent: "space-between",
    paddingVertical: scale(20),
  },
  title: {
    fontSize: scale(18),
    color: "#0089FF",
    fontWeight: "bold",

  },
  descriptionBox: {
    alignItems: "center",
    paddingBottom: scale(80),
  },
  description: {
    textAlign: "center",
    fontSize: scale(13),
    paddingVertical: scale(20),
    marginHorizontal: scale(60),
    color: "#0089FF",
    fontWeight: "bold",

  },
  question: {
    paddingBottom: scale(20),
    fontSize: scale(12),
  },
  questions: {
    fontSize: scale(12),
    fontWeight: "bold",
  },
  questionsBox: {
    paddingVertical: scale(8),
    marginBottom: scale(5),
  },
  questionsContent: {
    marginHorizontal: scale(15),
  }
});
export default CancelationModal;
