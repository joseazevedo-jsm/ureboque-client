import React from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  ActivityIndicator,
} from 'react-native';
import { useRoute } from '@react-navigation/native';
import { scale } from 'react-native-size-matters';
import Icon from 'react-native-vector-icons/MaterialIcons';
import { useRegistrationFlow } from '../hooks/useRegistrationFlow';

const PersonalInfoScreen = () => {
  const route = useRoute();
  const { phone, password } = route.params || {};

  const {
    formData,
    uiState,
    validationState,
    personalInfoValidationRules,
    isPersonalInfoValid,
    getEmailSuggestion,
    handleFirstNameChange,
    handleLastNameChange,
    handleEmailChange,
    createUserAccount,
    logger,
  } = useRegistrationFlow(phone, password);

  logger.debug('PersonalInfoScreen initialized', { hasPhone: !!phone, hasPassword: !!password });

  const handleBack = () => {
    logger.info('User going back from personal info');
    // Navigation will be handled by React Navigation's built-in back functionality
  };

  const handleCreateAccount = () => {
    createUserAccount();
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
            <Text style={styles.progressText}>Passo 2 de 2</Text>
            <View style={styles.progressBar}>
              <View style={[styles.progressFill, { width: '100%' }]} />
            </View>
          </View>
        </View>

        <View style={styles.content}>
          <View style={styles.titleSection}>
            <Text style={styles.title}>Fale-nos sobre si</Text>
            <Text style={styles.subtitle}>
              Precisamos de algumas informações básicas para criar a sua conta
            </Text>
          </View>

          <View style={styles.formSection}>
            <View style={styles.inputContainer}>
              <Text style={styles.inputLabel}>Nome</Text>
              <TextInput
                style={styles.textInput}
                value={formData.firstName}
                onChangeText={handleFirstNameChange}
                placeholder="Digite o seu nome"
                placeholderTextColor="#B0B0B0"
                accessibilityLabel="Campo de nome"
                accessibilityRole="text"
                autoCapitalize="words"
              />
            </View>

            <View style={styles.inputContainer}>
              <Text style={styles.inputLabel}>Sobrenome</Text>
              <TextInput
                style={styles.textInput}
                value={formData.lastName}
                onChangeText={handleLastNameChange}
                placeholder="Digite o seu sobrenome"
                placeholderTextColor="#B0B0B0"
                accessibilityLabel="Campo de sobrenome"
                accessibilityRole="text"
                autoCapitalize="words"
              />
            </View>

            <View style={styles.inputContainer}>
              <Text style={styles.inputLabel}>Email</Text>
              <TextInput
                style={styles.textInput}
                value={formData.email}
                onChangeText={handleEmailChange}
                placeholder="Digite o seu email"
                placeholderTextColor="#B0B0B0"
                keyboardType="email-address"
                autoCapitalize="none"
                autoCorrect={false}
                accessibilityLabel="Campo de email"
                accessibilityRole="text"
              />
              {getEmailSuggestion() && (
                <TouchableOpacity
                  style={styles.emailSuggestion}
                  onPress={() => handleEmailChange(getEmailSuggestion())}
                >
                  <Text style={styles.emailSuggestionText}>
                    Quer dizer: {getEmailSuggestion()}?
                  </Text>
                </TouchableOpacity>
              )}
            </View>

            {validationState.personalInfoErrors.length > 0 && (
              <View style={styles.errorsContainer}>
                {validationState.personalInfoErrors.map((error, index) => (
                  <View key={index} style={styles.errorItem}>
                    <Icon name="error-outline" size={16} color="#F44336" />
                    <Text style={styles.errorText}>{error}</Text>
                  </View>
                ))}
              </View>
            )}
          </View>

          <View style={styles.infoSection}>
            <View style={styles.phoneInfo}>
              <Icon name="phone" size={18} color="#4CAF50" />
              <Text style={styles.phoneText}>Número verificado: {phone}</Text>
            </View>
          </View>
        </View>
      </ScrollView>

      <View style={styles.footer}>
        <Text style={styles.disclaimerText}>
          Ao criar a conta, aceito receber comunicações do Ureboque por email e SMS
        </Text>
        <TouchableOpacity
          onPress={handleCreateAccount}
          style={[
            styles.createButton,
            isPersonalInfoValid() ? styles.createButtonActive : styles.createButtonInactive
          ]}
          disabled={!isPersonalInfoValid() || uiState.isLoading}
          accessibilityLabel="Criar conta"
          accessibilityRole="button"
        >
          {uiState.isLoading ? (
            <ActivityIndicator size="small" color="#FFFFFF" />
          ) : (
            <Text style={[
              styles.createButtonText,
              isPersonalInfoValid() ? styles.createButtonTextActive : styles.createButtonTextInactive
            ]}>
              CRIAR CONTA
            </Text>
          )}
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FAFC',
    paddingVertical: scale(20),
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
    backgroundColor: '#fff',
    borderRadius: scale(20),
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  progressSection: {
    flex: 1,
    alignItems: 'center',
  },
  progressText: {
    fontSize: scale(14),
    color: '#64748B',
    marginBottom: scale(8),
  },
  progressBar: {
    width: scale(100),
    height: scale(4),
    backgroundColor: '#E2E8F0',
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
    color: '#1E293B',
    marginBottom: scale(8),
  },
  subtitle: {
    fontSize: scale(16),
    color: '#64748B',
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
    fontSize: scale(13),
    fontWeight: '600',
    color: '#1E293B',
    marginBottom: scale(8),
  },
  textInput: {
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.05)',
    borderRadius: scale(14),
    fontSize: scale(15),
    color: '#1E293B',
    paddingVertical: scale(14),
    paddingHorizontal: scale(16),
    backgroundColor: '#fff',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.03,
    shadowRadius: 6,
    elevation: 2,
  },
  emailSuggestion: {
    marginTop: scale(8),
    paddingHorizontal: scale(4),
  },
  emailSuggestionText: {
    fontSize: scale(14),
    color: '#0089FF',
    fontStyle: 'italic',
  },
  errorsContainer: {
    marginTop: scale(15),
    paddingHorizontal: scale(10),
  },
  errorItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: scale(8),
  },
  errorText: {
    fontSize: scale(14),
    color: '#F44336',
    marginLeft: scale(8),
  },
  infoSection: {
    marginBottom: scale(30),
  },
  phoneInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#E8F5E8',
    paddingVertical: scale(12),
    paddingHorizontal: scale(16),
    borderRadius: scale(14),
  },
  phoneText: {
    fontSize: scale(14),
    color: '#4CAF50',
    marginLeft: scale(8),
    fontWeight: '500',
  },
  footer: {
    paddingHorizontal: scale(20),
    paddingBottom: scale(30),
    paddingTop: scale(15),
  },
  disclaimerText: {
    fontSize: scale(12),
    color: '#64748B',
    textAlign: 'center',
    lineHeight: scale(18),
    marginBottom: scale(20),
    paddingHorizontal: scale(10),
  },
  createButton: {
    borderRadius: scale(16),
    paddingVertical: scale(16),
    alignItems: 'center',
  },
  createButtonActive: {
    backgroundColor: '#0089FF',
    shadowColor: '#0089FF',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
  },
  createButtonInactive: {
    backgroundColor: '#CBD5E0',
    shadowOpacity: 0,
    elevation: 0,
  },
  createButtonText: {
    fontSize: scale(16),
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  createButtonTextActive: {
    color: '#FFFFFF',
  },
  createButtonTextInactive: {
    color: '#94A3B8',
  },
});

export default PersonalInfoScreen;