import { useSafeAreaInsets } from "react-native-safe-area-context";
import React from 'react';
import { View, StyleSheet, ScrollView, ActivityIndicator } from 'react-native';
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

const PersonalInfoScreen = () => {
  const insets = useSafeAreaInsets();
  const route = useRoute();
  const navigation = useNavigation();
  const { phone, password } = route.params || {};
  const { showAlert } = useAlert();

  const {
    formData,
    uiState,
    validationState,
    personalInfoValidationRules,
    personalInfoFieldErrors,
    isPersonalInfoValid,
    getEmailSuggestion,
    handleFirstNameChange,
    handleLastNameChange,
    handleEmailChange,
    createUserAccount,
    logger,
  } = useRegistrationFlow(phone, password, showAlert);

  logger.debug('PersonalInfoScreen initialized', { hasPhone: !!phone, hasPassword: !!password });

  const handleBack = () => {
    logger.info('User going back from personal info');
    navigation.goBack();
  };

  const handleCreateAccount = () => {
    createUserAccount();
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
          <Text style={styles.progressText}>Passo 2 de 2</Text>
          <View style={styles.progressBar}><View style={[styles.progressFill, { width: '100%' }]} /></View>
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
                placeholderTextColor={colors.textMuted}
                accessibilityLabel="Campo de nome"
                accessibilityRole="text"
                autoCapitalize="words"
              />
              {personalInfoFieldErrors.firstName && (
                <Text style={styles.inlineFieldError}>{personalInfoFieldErrors.firstName}</Text>
              )}
            </View>

            <View style={styles.inputContainer}>
              <Text style={styles.inputLabel}>Sobrenome</Text>
              <TextInput
                style={styles.textInput}
                value={formData.lastName}
                onChangeText={handleLastNameChange}
                placeholder="Digite o seu sobrenome"
                placeholderTextColor={colors.textMuted}
                accessibilityLabel="Campo de sobrenome"
                accessibilityRole="text"
                autoCapitalize="words"
              />
              {personalInfoFieldErrors.lastName && (
                <Text style={styles.inlineFieldError}>{personalInfoFieldErrors.lastName}</Text>
              )}
            </View>

            <View style={styles.inputContainer}>
              <Text style={styles.inputLabel}>Email</Text>
              <TextInput
                style={styles.textInput}
                value={formData.email}
                onChangeText={handleEmailChange}
                placeholder="Digite o seu email"
                placeholderTextColor={colors.textMuted}
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
              {personalInfoFieldErrors.email && (
                <Text style={styles.inlineFieldError}>{personalInfoFieldErrors.email}</Text>
              )}
            </View>

            {validationState.personalInfoErrors.length > 0 && (
              <View style={styles.errorsContainer}>
                {validationState.personalInfoErrors.map((error, index) => (
                  <View key={index} style={styles.errorItem}>
                    <Icon name="error-outline" size={16} color={colors.error} />
                    <Text style={styles.errorText}>{error}</Text>
                  </View>
                ))}
              </View>
            )}
          </View>

          <View style={styles.infoSection}>
            <View style={styles.phoneInfo}>
              <Icon name="phone" size={18} color={colors.success} />
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
            <ActivityIndicator size="small" color={colors.surface} />
          ) : (
            <Text style={[
              styles.createButtonText,
              isPersonalInfoValid() ? styles.createButtonTextActive : styles.createButtonTextInactive
            ]}>
              Criar conta
            </Text>
          )}
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
  // `flex: 1` here collapsed the validation-error rows to a few pixels inside
  // the ScrollView; flexGrow lets the content size itself and scroll instead.
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
  textInput: { ...componentStyles.input },
  emailSuggestion: {
    marginTop: spacing.sm,
    paddingHorizontal: spacing.xs,
  },
  emailSuggestionText: {
    fontSize: typography.bodySmall.fontSize, lineHeight: typography.bodySmall.lineHeight,
    color: colors.primary,
    fontStyle: 'italic',
  },
  // Without flexShrink: 0 these rows are compressed to a few pixels when the
  // form is taller than the available space: the message stays in the tree
  // (and in the a11y output) but is invisible on screen.
  errorsContainer: {
    marginTop: spacing.lg,
    paddingHorizontal: spacing.sm,
    flexShrink: 0,
  },
  errorItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.sm,
    flexShrink: 0,
    minHeight: scale(20),
  },
  errorText: {
    fontSize: typography.bodySmall.fontSize, lineHeight: typography.bodySmall.lineHeight,
    color: colors.error,
    marginLeft: spacing.sm,
    flexShrink: 1,
  },
  infoSection: {
    marginBottom: spacing.xxxl,
  },
  phoneInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.successLight,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.lg,
    borderRadius: borderRadius.lg,
  },
  phoneText: {
    fontSize: typography.bodySmall.fontSize, lineHeight: typography.bodySmall.lineHeight,
    color: colors.success,
    marginLeft: spacing.sm,
    fontWeight: '500',
  },
  footer: {
    width: "100%",
    maxWidth: layout.formMaxWidth,
    alignSelf: "center",
    paddingHorizontal: spacing.xl,
    paddingBottom: spacing.xxxl,
    paddingTop: spacing.lg,
  },
  disclaimerText: {
    fontSize: typography.caption.fontSize, lineHeight: typography.caption.lineHeight,
    color: colors.textSecondary,
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: spacing.xl,
    paddingHorizontal: spacing.sm,
  },
  createButton: {
    minHeight: sizes.control,
    borderRadius: borderRadius.lg,
    paddingVertical: spacing.lg,
    alignItems: 'center',
  },
  createButtonActive: {
    backgroundColor: colors.primary,
    ...shadows.sm,

},
  createButtonInactive: {
    backgroundColor: colors.disabledSurface,
    shadowOpacity: 0,
    elevation: 0,
  },
  createButtonText: {
    fontSize: typography.body.fontSize, lineHeight: typography.body.lineHeight,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  createButtonTextActive: {
    color: colors.surface,
  },
  createButtonTextInactive: {
    color: colors.textMuted,
  },
});

export default PersonalInfoScreen;
