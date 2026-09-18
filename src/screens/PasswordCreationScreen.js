import { useSafeAreaInsets } from "react-native-safe-area-context";
import React from 'react';
import { View, StyleSheet, ScrollView } from 'react-native';
import { AppText as Text, AppTextInput as TextInput } from '../components/common/AppText';
import { AppPressable as TouchableOpacity } from '../components/common/AppPressable';
import { AppHeader } from '../components/common/AppHeader';

import { useNavigation, useRoute } from '@react-navigation/native';
import { scale } from 'react-native-size-matters';
import MaterialIcons from '@expo/vector-icons/MaterialIcons';
const Icon = MaterialIcons;
import { useRegistrationFlow } from '../hooks/useRegistrationFlow';
import { useAlert } from '../context/AlertContext';
import { shadows, componentStyles, borderRadius, colors, spacing, sizes, layout, typography } from "../theme";

const PasswordCreationScreen = () => {
  const insets = useSafeAreaInsets();
  const route = useRoute();
  const navigation = useNavigation();
  const { phone } = route.params || {};
  const { showAlert } = useAlert();

  const {
    formData,
    uiState,
    validationState,
    passwordValidationRules,
    isPasswordValid,
    calculatePasswordStrength,
    getPasswordStrengthColor,
    handlePasswordChange,
    handleConfirmPasswordChange,
    updateUIState,
    goToPersonalInfo,
    logger,
  } = useRegistrationFlow(phone, '', showAlert);

  logger.debug('PasswordCreationScreen initialized', { hasPhone: !!phone });

  const handleBack = () => {
    logger.info('User going back from password creation');
    navigation.goBack();
  };

  const handleContinue = () => {
    goToPersonalInfo();
  };

  const getRequirementIcon = (isValid) => {
    return isValid ? '✓' : '○';
  };

  const getRequirementStyle = (isValid) => {
    return isValid ? styles.requirementValid : styles.requirementInvalid;
  };

  return (
    <View style={[styles.container, { paddingBottom: insets.bottom }]}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
      >
        <AppHeader title="CRIAR CONTA" leftIcon="arrow-back" leftLabel="Voltar" onLeftPress={handleBack} style={styles.header} />
        <View style={styles.progressSection}>
          <Text style={styles.progressText}>Passo 1 de 2</Text>
          <View style={styles.progressBar}><View style={[styles.progressFill, { width: '50%' }]} /></View>
        </View>

        <View style={styles.content}>
          <View style={styles.titleSection}>
            <Text style={styles.title}>Crie a sua senha</Text>
            <Text style={styles.subtitle}>
              Escolha uma senha segura para proteger a sua conta
            </Text>
          </View>

          <View style={styles.formSection}>
            <View style={styles.inputContainer}>
              <Text style={styles.inputLabel}>Nova senha</Text>
              <View style={styles.passwordInputContainer}>
                <TextInput
                  style={styles.passwordInput}
                  value={formData.password}
                  onChangeText={handlePasswordChange}
                  secureTextEntry={!uiState.showPassword}
                  placeholder="Digite sua senha"
                  placeholderTextColor={colors.textMuted}
                  accessibilityLabel="Campo de senha"
                  accessibilityRole="text"
                />
                <TouchableOpacity
                  onPress={() => updateUIState('showPassword', !uiState.showPassword)}
                  style={styles.eyeButton}
                  accessibilityLabel={uiState.showPassword ? "Ocultar senha" : "Mostrar senha"}
                  accessibilityRole="button"
                >
                  <Icon 
                    name={uiState.showPassword ? "visibility-off" : "visibility"} 
                    size={20} 
                    color={colors.textSecondary} 
                  />
                </TouchableOpacity>
              </View>
            </View>

            <View style={styles.inputContainer}>
              <Text style={styles.inputLabel}>Confirme a senha</Text>
              <View style={styles.passwordInputContainer}>
                <TextInput
                  style={styles.passwordInput}
                  value={formData.confirmPassword}
                  onChangeText={handleConfirmPasswordChange}
                  secureTextEntry={!uiState.showConfirmPassword}
                  placeholder="Digite a senha novamente"
                  placeholderTextColor={colors.textMuted}
                  accessibilityLabel="Campo de confirmação de senha"
                  accessibilityRole="text"
                />
                <TouchableOpacity
                  onPress={() => updateUIState('showConfirmPassword', !uiState.showConfirmPassword)}
                  style={styles.eyeButton}
                  accessibilityLabel={uiState.showConfirmPassword ? "Ocultar confirmação" : "Mostrar confirmação"}
                  accessibilityRole="button"
                >
                  <Icon 
                    name={uiState.showConfirmPassword ? "visibility-off" : "visibility"} 
                    size={20} 
                    color={colors.textSecondary} 
                  />
                </TouchableOpacity>
              </View>
              {/* The matching rule lives at the bottom of the requirement list,
                  below the fold on shorter screens, so a mismatch left the
                  disabled button unexplained. Say it where the user is typing. */}
              {formData.confirmPassword.length > 0 &&
                formData.password !== formData.confirmPassword && (
                  <Text style={styles.inlineFieldError}>
                    As senhas não coincidem
                  </Text>
                )}
            </View>

            {formData.password.length > 0 && (
              <View style={styles.strengthContainer}>
                <Text style={styles.strengthLabel}>Força da senha:</Text>
                <View style={styles.strengthBar}>
                  <View 
                    style={[
                      styles.strengthFill, 
                      { 
                        width: `${calculatePasswordStrength()}%`,
                        backgroundColor: getPasswordStrengthColor()
                      }
                    ]} 
                  />
                </View>
              </View>
            )}
          </View>

          <View style={styles.requirementsSection}>
            <Text style={styles.requirementsTitle}>Requisitos da senha:</Text>
            <View style={styles.requirementsList}>
              {passwordValidationRules.slice(0, -1).map((rule, index) => (
                <View key={rule.key} style={styles.requirementItem}>
                  <Text style={getRequirementStyle(rule.rule)}>
                    {getRequirementIcon(rule.rule)} {rule.message}
                  </Text>
                </View>
              ))}
              {formData.confirmPassword.length > 0 && (
                <View style={styles.requirementItem}>
                  <Text style={getRequirementStyle(passwordValidationRules[5].rule)}>
                    {getRequirementIcon(passwordValidationRules[5].rule)} {passwordValidationRules[5].message}
                  </Text>
                </View>
              )}
            </View>
          </View>
        </View>
      </ScrollView>

      <View style={styles.footer}>
        <TouchableOpacity
          onPress={handleContinue}
          style={[
            styles.continueButton,
            passwordValidationRules.every(rule => rule.rule) ? styles.continueButtonActive : styles.continueButtonInactive
          ]}
          disabled={!passwordValidationRules.every(rule => rule.rule)}
          accessibilityLabel="Continuar para próximo passo"
          accessibilityRole="button"
        >
          <Text style={[
            styles.continueButtonText,
            passwordValidationRules.every(rule => rule.rule) ? styles.continueButtonTextActive : styles.continueButtonTextInactive
          ]}>
            Continuar
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  header: {
    width: "100%",
    maxWidth: layout.formMaxWidth,
    alignSelf: "center",
  },
  progressSection: {
    flex: 1,
    alignItems: 'center',
  },
  progressText: {
    fontSize: typography.bodySmall.fontSize, lineHeight: typography.bodySmall.lineHeight,
    color: colors.textSecondary,
    marginBottom: spacing.sm,
  },
  progressBar: {
    width: scale(100),
    height: scale(4),
    backgroundColor: colors.borderLight,
    borderRadius: borderRadius.sm,
  },
  progressFill: {
    height: '100%',
    backgroundColor: colors.primary,
    borderRadius: borderRadius.sm,
  },
  // flexGrow rather than flex so the requirement rows keep their height inside
  // the ScrollView instead of being squeezed below the fold.
  scrollContent: {
    width: "100%",
    maxWidth: layout.formMaxWidth,
    alignSelf: "center",
    flexGrow: 1,
  },
  inlineFieldError: {
    fontSize: typography.caption.fontSize, lineHeight: typography.caption.lineHeight,
    color: colors.error,
    marginTop: spacing.sm,
    marginLeft: spacing.xs,
  },
  content: {
    width: "100%",
    maxWidth: layout.formMaxWidth,
    alignSelf: "center",
    flexGrow: 1,
    paddingHorizontal: spacing.xl,
  },
  titleSection: {
    alignItems: 'center',
    marginBottom: spacing.jumbo,
    marginTop: spacing.xl,
  },
  title: {
    fontSize: typography.h2.fontSize, lineHeight: typography.h2.lineHeight,
    fontWeight: 'bold',
    color: colors.textPrimary,
    marginBottom: spacing.sm,
  },
  subtitle: {
    fontSize: typography.body.fontSize, lineHeight: typography.body.lineHeight,
    color: colors.textSecondary,
    textAlign: 'center',
    lineHeight: 24,
  },
  formSection: {
    marginBottom: spacing.xxxl,
  },
  inputContainer: {
    marginBottom: spacing.xl,
  },
  inputLabel: {
    fontSize: typography.caption.fontSize, lineHeight: typography.caption.lineHeight,
    fontWeight: '600',
    color: colors.textPrimary,
    marginBottom: spacing.sm,
  },
  passwordInputContainer: { flexDirection: 'row', alignItems: 'center', backgroundColor: colors.surface, borderRadius: borderRadius.md },
  passwordInput: { ...componentStyles.input, flex: 1 },
  eyeButton: {
    width: sizes.control,
    height: sizes.control,
    justifyContent: "center",
    alignItems: "center",
    padding: spacing.md,
  },
  strengthContainer: {
    marginTop: spacing.lg,
  },
  strengthLabel: {
    fontSize: typography.bodySmall.fontSize, lineHeight: typography.bodySmall.lineHeight,
    color: colors.textSecondary,
    marginBottom: spacing.sm,
  },
  strengthBar: {
    width: '100%',
    height: scale(6),
    backgroundColor: colors.borderLight,
    borderRadius: borderRadius.sm,
  },
  strengthFill: {
    height: '100%',
    borderRadius: borderRadius.sm,
  },
  requirementsSection: {
    marginBottom: spacing.xxxl,
  },
  requirementsTitle: {
    fontSize: typography.bodySmall.fontSize, lineHeight: typography.bodySmall.lineHeight,
    fontWeight: '600',
    color: colors.textPrimary,
    marginBottom: spacing.lg,
  },
  requirementsList: {
    paddingHorizontal: spacing.sm,
  },
  requirementItem: {
    marginBottom: spacing.sm,
  },
  requirementValid: {
    fontSize: typography.bodySmall.fontSize, lineHeight: typography.bodySmall.lineHeight,
    color: colors.success,
  },
  requirementInvalid: {
    fontSize: typography.bodySmall.fontSize, lineHeight: typography.bodySmall.lineHeight,
    color: colors.textMuted,
  },
  footer: {
    width: "100%",
    maxWidth: layout.formMaxWidth,
    alignSelf: "center",
    paddingHorizontal: spacing.xl,
    paddingBottom: spacing.xxxl,
    paddingTop: spacing.lg,
  },
  continueButton: {
    borderRadius: borderRadius.lg,
    paddingVertical: spacing.lg,
    alignItems: 'center',
  },
  continueButtonActive: {
    backgroundColor: colors.primary,
    ...shadows.sm,

},
  continueButtonInactive: {
    backgroundColor: colors.disabledSurface,
    shadowOpacity: 0,
    elevation: 0,
  },
  continueButtonText: {
    fontSize: typography.body.fontSize, lineHeight: typography.body.lineHeight,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  continueButtonTextActive: {
    color: colors.surface,
  },
  continueButtonTextInactive: {
    color: colors.textMuted,
  },
});

export default PasswordCreationScreen;
