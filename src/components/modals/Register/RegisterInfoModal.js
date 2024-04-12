import React from "react";
import {
  FlatList,
  Image,
  Modal,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { TextInput } from "react-native-gesture-handler";
import { scale } from "react-native-size-matters";
import Icon from "react-native-vector-icons/MaterialIcons";
import { useRegisterModal } from "./components/useRegisterModal";
const RegisterInfoModal = ({
  visible,
  changeLoginState,
  phone,
  onChangeName,
  onChangeSurname,
  onChangeEmail,
  onCreateUser,
  errors,
}) => {
  return (
    <Modal visible={visible} animationType="slide">
      <View style={styles.container}>
        <View>
          <Text style={styles.title}>CADASTRO</Text>
          <View style={styles.inputInfo}>
            <Text style={{ fontSize: scale(18), alignSelf: "center" }}>
              Introduza as suas informações pessoais para concluir o cadastro{" "}
            </Text>
            <View style={styles.input}>
              <TextInput
                placeholder="Nome"
                style={styles.inputBox}
                onChangeText={onChangeName}
              />
              <TextInput
                placeholder="Sobrenome"
                style={styles.inputBox}
                onChangeText={onChangeSurname}
              />
              <TextInput
                placeholder="Email"
                style={styles.inputBox}
                onChangeText={onChangeEmail}
              />
            </View>
            {errors.length > 0 && (
              <View style={styles.errorContainer}>
                {errors.map((error, index) => (
                  <Text key={index} style={styles.errorItem}>
                    {error}
                  </Text>
                ))}
              </View>
            )}
          </View>
        </View>

        <View style={styles.bottom}>
          <TouchableOpacity
            onPress={() => {
              onCreateUser(phone).then((user) => {
                if (user) {
                  changeLoginState();
                }
              });
            }}
          >
            <Text style={styles.save}>AVANÇAR</Text>
          </TouchableOpacity>
        </View>
      </View>
      <View style={{ height: scale(20) }} />
    </Modal>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "space-between",
  },
  title: {
    fontSize: scale(50),
    fontWeight: "bold",
    color: "#0089FF",
    textAlign: "center",
    paddingHorizontal: scale(10),
    paddingTop: scale(80),
  },
  inputInfo: {
    marginHorizontal: scale(20),
    paddingVertical: scale(50),
  },
  input: {},
  inputBox: {
    borderColor: "#0089FF",
    borderWidth: scale(3),
    borderRadius: scale(7),
    fontSize: scale(15),
    paddingVertical: scale(10),
    paddingHorizontal: scale(15),
    marginTop: scale(15),
  },
  bottom: {
    backgroundColor: "#0089FF",
    marginHorizontal: scale(20),
    alignItems: "center",
    borderRadius: scale(7),
  },
  save: {
    fontSize: scale(20),
    fontWeight: "bold",
    color: "#FFF",
    paddingVertical: scale(15),
  },
  errorContainer: {
    marginTop: scale(15),
  },
  error: {
    fontSize: scale(18),
  },
  errorItem: {
    fontSize: scale(18),
    paddingHorizontal:scale(5)
  }

});
export default RegisterInfoModal;
