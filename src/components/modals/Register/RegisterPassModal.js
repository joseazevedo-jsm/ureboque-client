import React from "react";
import {
  Modal,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { TextInput } from "react-native-gesture-handler";
import { scale } from "react-native-size-matters";
import RegisterInfoModal from "./RegisterInfoModal";
import { useRegisterModal } from "./components/useRegisterModal";
import { colors, borderRadius, shadows } from "../../../theme";
const RegisterPassModal = ({ visible, changeLoginState, phone }) => {
  const { models, operations } = useRegisterModal();

  return (
    <Modal visible={visible} animationType="slide">
      <View style={styles.container}>
        <View>
          <Text style={styles.title}>NOVA SENHA</Text>
          <View style={styles.inputInfo}>
            <Text style={{ fontSize: scale(16), alignSelf: "center", color: "#64748B", textAlign: "center", lineHeight: scale(24) }}>
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
    backgroundColor: colors.primary,
    marginHorizontal: scale(20),
    alignItems: "center",
    borderRadius: borderRadius.xl,
    marginBottom: scale(30),
    ...shadows.primaryGlow,
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
export default RegisterPassModal;
