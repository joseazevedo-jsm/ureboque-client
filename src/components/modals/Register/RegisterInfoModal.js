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
import { colors, spacing, shadows, borderRadius } from "../../../theme";
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
    backgroundColor: colors.background,
  },
  title: {
    fontSize: scale(40),
    fontWeight: "800",
    color: colors.textPrimary,
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
    color: "#FFF",
    paddingVertical: scale(16),
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
    paddingHorizontal: spacing.xs,
    color: colors.error,
    marginTop: spacing.xs,
  }
});
export default RegisterInfoModal;
