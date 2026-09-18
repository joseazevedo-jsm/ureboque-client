import React from "react";
import { Modal, StyleSheet, View } from 'react-native';
import { AppText as Text } from '../../common/AppText';
import { AppPressable as TouchableOpacity } from '../../common/AppPressable';

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
            <Text style={{ fontSize: typography.body.fontSize, alignSelf: "center", color: colors.textSecondary, textAlign: "center", lineHeight: 24 }}>
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
    paddingVertical: spacing.huge,
  },
  input: {},
  inputBox: {
    borderColor: colors.border,
    borderWidth: 1,
    borderRadius: borderRadius.lg,
    fontSize: typography.bodySmall.fontSize, lineHeight: typography.bodySmall.lineHeight,
    paddingVertical: spacing.md,
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
    marginBottom: spacing.xxxl,
    ...shadows.primaryGlow,
  },
  save: {
    fontSize: typography.body.fontSize, lineHeight: typography.body.lineHeight,
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
    fontSize: typography.bodySmall.fontSize, lineHeight: typography.bodySmall.lineHeight,
    color: colors.textPrimary,
    fontWeight: "600",
  },
  errorItem: {
    fontSize: typography.bodySmall.fontSize, lineHeight: typography.bodySmall.lineHeight,
    paddingHorizontal: spacing.sm,
    color: colors.error,
    marginTop: spacing.xs,
  }
});
export default RegisterPassModal;
