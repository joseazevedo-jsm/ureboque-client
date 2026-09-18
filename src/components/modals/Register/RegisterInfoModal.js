import React from "react";
import { ActivityIndicator, Modal, StyleSheet, View } from 'react-native';
import { AppText as Text } from '../../common/AppText';
import { AppPressable as TouchableOpacity } from '../../common/AppPressable';

import { TextInput } from "react-native-gesture-handler";
import { scale } from "react-native-size-matters";
import { colors, spacing, shadows, borderRadius, typography } from "../../../theme";
const RegisterInfoModal = ({
  visible,
  changeLoginState,
  phone,
  onChangeName,
  onChangeSurname,
  onChangeEmail,
  onCreateUser,
  errors,
  isCreating = false,
}) => {
  return (
    <Modal visible={visible} animationType="slide">
      <View style={styles.container}>
        <View>
          <Text style={styles.title}>CADASTRO</Text>
          <View style={styles.inputInfo}>
            <Text style={{ fontSize: typography.body.fontSize, alignSelf: "center", color: colors.textSecondary, textAlign: "center", lineHeight: 24 }}>
              Introduza as suas informações pessoais para concluir o cadastro
            </Text>
            <View style={styles.input}>
              <TextInput
                placeholder="Nome"
                style={styles.inputBox}
                onChangeText={onChangeName}
                accessibilityLabel="Campo de nome"
                accessibilityRole="text"
              />
              <TextInput
                placeholder="Sobrenome"
                style={styles.inputBox}
                onChangeText={onChangeSurname}
                accessibilityLabel="Campo de sobrenome"
                accessibilityRole="text"
              />
              <TextInput
                placeholder="Email"
                style={styles.inputBox}
                onChangeText={onChangeEmail}
                accessibilityLabel="Campo de email"
                accessibilityRole="text"
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

        <View style={[styles.bottom, isCreating && styles.bottomDisabled]}>
          <TouchableOpacity
            disabled={isCreating}
            onPress={() => {
              onCreateUser(phone).then((user) => {
                if (user) {
                  changeLoginState();
                }
              });
            }}
          >
            {isCreating ? (
              <ActivityIndicator size="small" color={colors.surface} style={styles.loader} />
            ) : (
              <Text style={styles.save}>AVANÇAR</Text>
            )}
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
    fontWeight: "700",
    color: colors.textPrimary,
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
  bottomDisabled: {
    backgroundColor: colors.textDisabled,
    shadowOpacity: 0,
    elevation: 0,
  },
  loader: {
    paddingVertical: spacing.lg,
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
    paddingHorizontal: spacing.xs,
    color: colors.error,
    marginTop: spacing.xs,
  }
});
export default RegisterInfoModal;
