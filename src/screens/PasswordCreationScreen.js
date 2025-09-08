import React from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
  ScrollView,
} from 'react-native';
import { useRoute } from '@react-navigation/native';
import { scale } from 'react-native-size-matters';
import Icon from 'react-native-vector-icons/MaterialIcons';
import { useRegistrationFlow } from '../hooks/useRegistrationFlow';

const PasswordCreationScreen = () => {
  const route = useRoute();
  const { phone } = route.params || {};

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
  } = useRegistrationFlow(phone);

  logger.debug('PasswordCreationScreen initialized', { hasPhone: !!phone });

  const handleBack = () => {
    logger.info('User going back from password creation');
    // Navigation will be handled by React Navigation's built-in back functionality
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
    <SafeAreaView style={styles.container}>
      <ScrollView showsVerticalScrollIndicator={false}>
        <View style={styles.header}>
          <TouchableOpacity 
            onPress={handleBack}
            style={styles.backButton}
            accessibilityLabel="Voltar"
            accessibilityRole="button"
          >
            <Icon name="arrow-back" size={24} color="#0089FF" />
          </TouchableOpacity>
          <View style={styles.progressSection}>
            <Text style={styles.progressText}>Passo 1 de 2</Text>
            <View style={styles.progressBar}>
              <View style={[styles.progressFill, { width: '50%' }]} />
            </View>
          </View>
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
                  placeholderTextColor="#B0B0B0"
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
                    color="#707070" 
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
                  placeholderTextColor="#B0B0B0"
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
                    color="#707070" 
                  />
                </TouchableOpacity>
              </View>
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
            CONTINUAR
          </Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    paddingVertical:scale(20)
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: scale(20),
    paddingVertical: scale(20),
  },
  backButton: {
    width: scale(40),
    height: scale(40),
    justifyContent: 'center',
    alignItems: 'center',
  },
  progressSection: {
    flex: 1,
    alignItems: 'center',
  },
  progressText: {
    fontSize: scale(14),
    color: '#707070',
    marginBottom: scale(8),
  },
  progressBar: {
    width: scale(100),
    height: scale(4),
    backgroundColor: '#E0E0E0',
    borderRadius: scale(2),
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#0089FF',
    borderRadius: scale(2),
  },
  content: {
    flex: 1,
    paddingHorizontal: scale(20),
  },
  titleSection: {
    alignItems: 'center',
    marginBottom: scale(40),
    marginTop: scale(20),
  },
  title: {
    fontSize: scale(24),
    fontWeight: 'bold',
    color: '#333333',
    marginBottom: scale(8),
  },
  subtitle: {
    fontSize: scale(16),
    color: '#707070',
    textAlign: 'center',
    lineHeight: scale(22),
  },
  formSection: {
    marginBottom: scale(30),
  },
  inputContainer: {
    marginBottom: scale(20),
  },
  inputLabel: {
    fontSize: scale(16),
    fontWeight: '500',
    color: '#333333',
    marginBottom: scale(8),
  },
  passwordInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#0089FF',
    borderRadius: scale(8),
    backgroundColor: '#FFFFFF',
  },
  passwordInput: {
    flex: 1,
    fontSize: scale(16),
    color: '#333333',
    paddingVertical: scale(12),
    paddingHorizontal: scale(16),
  },
  eyeButton: {
    padding: scale(12),
  },
  strengthContainer: {
    marginTop: scale(15),
  },
  strengthLabel: {
    fontSize: scale(14),
    color: '#707070',
    marginBottom: scale(8),
  },
  strengthBar: {
    width: '100%',
    height: scale(6),
    backgroundColor: '#E0E0E0',
    borderRadius: scale(3),
  },
  strengthFill: {
    height: '100%',
    borderRadius: scale(3),
  },
  requirementsSection: {
    marginBottom: scale(30),
  },
  requirementsTitle: {
    fontSize: scale(16),
    fontWeight: '600',
    color: '#333333',
    marginBottom: scale(15),
  },
  requirementsList: {
    paddingHorizontal: scale(10),
  },
  requirementItem: {
    marginBottom: scale(8),
  },
  requirementValid: {
    fontSize: scale(14),
    color: '#4CAF50',
  },
  requirementInvalid: {
    fontSize: scale(14),
    color: '#707070',
  },
  footer: {
    paddingHorizontal: scale(20),
    paddingBottom: scale(30),
    paddingTop: scale(15),
  },
  continueButton: {
    borderRadius: scale(8),
    paddingVertical: scale(16),
    alignItems: 'center',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  continueButtonActive: {
    backgroundColor: '#0089FF',
  },
  continueButtonInactive: {
    backgroundColor: '#E0E0E0',
  },
  continueButtonText: {
    fontSize: scale(16),
    fontWeight: 'bold',
    letterSpacing: 0.5,
  },
  continueButtonTextActive: {
    color: '#FFFFFF',
  },
  continueButtonTextInactive: {
    color: '#B0B0B0',
  },
});

export default PasswordCreationScreen;