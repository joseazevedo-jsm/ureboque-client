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
            <Text style={{ fontSize: scale(16), alignSelf: "center", color: "#64748B", textAlign: "center", lineHeight: scale(24) }}>
              Introduza as suas informações pessoais para concluir o cadastro
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
    backgroundColor: "#F8FAFC",
  },
  title: {
    fontSize: scale(40),
    fontWeight: "800",
    color: "#1E293B",
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
    borderColor: "rgba(0,0,0,0.05)",
    borderWidth: 1,
    borderRadius: scale(14),
    fontSize: scale(15),
    paddingVertical: scale(14),
    paddingHorizontal: scale(16),
    marginTop: scale(15),
    backgroundColor: "#fff",
    color: "#1E293B",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.03,
    shadowRadius: 6,
    elevation: 2,
  },
  bottom: {
    backgroundColor: "#0089FF",
    marginHorizontal: scale(20),
    alignItems: "center",
    borderRadius: scale(16),
    marginBottom: scale(30),
    shadowColor: "#0089FF",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
  },
  save: {
    fontSize: scale(18),
    fontWeight: "700",
    color: "#FFF",
    paddingVertical: scale(16),
    letterSpacing: 0.5,
  },
  errorContainer: {
    marginTop: scale(15),
    backgroundColor: "#FFF5F5",
    padding: scale(12),
    borderRadius: scale(12),
  },
  error: {
    fontSize: scale(14),
    color: "#1E293B",
    fontWeight: "600",
  },
  errorItem: {
    fontSize: scale(14),
    paddingHorizontal: scale(5),
    color: "#F44336",
    marginTop: scale(4),
  }
});
export default RegisterInfoModal;
