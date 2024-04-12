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
import RegisterInfoModal from "./RegisterInfoModal";
import { useRegisterModal } from "./components/useRegisterModal";
const RegisterPassModal = ({ visible, changeLoginState, phone }) => {
  const { models, operations } = useRegisterModal();

  return (
    <Modal visible={visible} animationType="slide">
      <View style={styles.container}>
        <View>
          <Text style={styles.title}>NOVA SENHA</Text>
          <View style={styles.inputInfo}>
            <Text style={{ fontSize: scale(18), alignSelf: "center" }}>
              Introduza uma nova senha para a sua conta!
            </Text>
            <View style={styles.input}>
              <TextInput
                secureTextEntry
                placeholder="Nova senha"
                style={styles.inputBox}
                onChangeText={operations.onPasswordTextChange}
              />
              <TextInput
                secureTextEntry
                placeholder="Confirme a senha"
                style={styles.inputBox}
                onChangeText={operations.onConfirmPasswordTextChange}
              />
            </View>
            {models.errors.length > 0 && (
              <View style={styles.errorContainer}>
                <Text style={styles.error}>A senha deve conter:</Text>
                {models.errors.map((error, index) => (
                  <Text key={index} style={styles.errorItem}>
                    - {error}
                  </Text>
                ))}
              </View>
            )}
          </View>
        </View>

        <View style={styles.bottom}>
          <TouchableOpacity
            onPress={operations.handleOnGoModalRegisterInfoVisible}
          >
            <Text style={styles.save}>AVANÇAR</Text>
          </TouchableOpacity>
        </View>
      </View>
      <View style={{ height: scale(20) }} />
      <RegisterInfoModal
        visible={models.modalRegisterInfoVisible}
        changeLoginState={changeLoginState}
        phone={phone}
        onChangeName={operations.onNameTextChange}
        onChangeSurname={operations.onSurnameTextChange}
        onChangeEmail={operations.onEmailTextChange}
        onCreateUser={operations.handleCreateUser}
        errors={models.errorsUser}
      />
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
export default RegisterPassModal;
