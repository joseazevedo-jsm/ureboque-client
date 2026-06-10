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
import { colors, borderRadius, shadows, spacing, typography } from "../../../theme";
const RegisterPassModal = ({ visible, changeLoginState, phone }) => {
  const { models, operations } = useRegisterModal();

  return (
    <Modal visible={visible} animationType="slide">
      <View style={styles.container}>
        <View>
          <Text style={styles.title}>NOVA SENHA</Text>
          <View style={styles.inputInfo}>
            <Text style={{ fontSize: scale(16), alignSelf: "center", color: colors.textSecondary, textAlign: "center", lineHeight: scale(24) }}>
              Introduza uma nova senha para a sua conta!
            </Text>
            <View style={styles.input}>
              <TextInput
                secureTextEntry
                placeholder="Nova senha"
                style={styles.inputBox}
                onChangeText={operations.onPasswordTextChange}
                accessibilityLabel="Campo de nova senha"
                accessibilityRole="text"
              />
              <TextInput
                secureTextEntry
                placeholder="Confirme a senha"
                style={styles.inputBox}
                onChangeText={operations.onConfirmPasswordTextChange}
                accessibilityLabel="Campo de confirmar senha"
                accessibilityRole="text"
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
        isCreating={models.isCreating}
      />
    </Modal>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "space-between",
    backgroundColor: colors.background,
  },
  title: {
    ...typography.h1,
    textAlign: "center",
    paddingHorizontal: spacing.sm,
    paddingTop: scale(80),
  },
  inputInfo: {
    marginHorizontal: spacing.xl,
    paddingVertical: scale(50),
  },
  input: {},
  inputBox: {
    borderColor: colors.border,
    borderWidth: 1,
    borderRadius: borderRadius.lg,
    fontSize: scale(15),
    paddingVertical: scale(14),
    paddingHorizontal: spacing.lg,
    marginTop: spacing.lg,
    backgroundColor: colors.surface,
    color: colors.textPrimary,
    ...shadows.sm,
  },
  bottom: {
    backgroundColor: colors.primary,
    marginHorizontal: spacing.xl,
    alignItems: "center",
    borderRadius: borderRadius.xl,
    marginBottom: scale(30),
    ...shadows.primaryGlow,
  },
  save: {
    fontSize: scale(18),
    fontWeight: "700",
    color: colors.surface,
    paddingVertical: spacing.lg,
    letterSpacing: 0.5,
  },
  errorContainer: {
    marginTop: spacing.lg,
    backgroundColor: colors.errorLight,
    padding: spacing.md,
    borderRadius: borderRadius.md,
  },
  error: {
    fontSize: scale(14),
    color: colors.textPrimary,
    fontWeight: "600",
  },
  errorItem: {
    fontSize: scale(14),
    paddingHorizontal: spacing.sm,
    color: colors.error,
    marginTop: scale(4),
  }
});
export default RegisterPassModal;
