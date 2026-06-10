import React, { useState } from "react";
import {
  View,
  Image,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  TouchableWithoutFeedback,
  Keyboard,
  ActivityIndicator,
} from "react-native";
import Icon from "react-native-vector-icons/MaterialIcons";
import CountryPickerWithFlag from "../components/login/CountryPickerWithFlag";
import { scale } from "react-native-size-matters";
import { useLoginScreen } from "../components/login/useLoginScreen";
import { useRoute } from "@react-navigation/native";
import OTPModal from "../components/modals/OTP/OTPModal";
import RegisterPassModal from "../components/modals/Register/RegisterPassModal";
import { useLogger } from "../hooks/useLogger";
import KeyboardAvoidingWrapper from "../components/common/KeyboardAvoidingWrapper";
import { colors, spacing, shadows, borderRadius } from "../theme";
import Animated, { FadeInDown } from 'react-native-reanimated';

const LoginScreen = () => {
  const logger = useLogger('LoginScreen', { 
    enableLifecycleLogging: true,
    logProps: true 
  });
  const [showPassword, setShowPassword] = useState(false);
  
  const route = useRoute();
  const { passwordState, phone } = route.params
    ? route.params
    : { passwordState: false, phone: "" };
    
  logger.debug('LoginScreen initialized', { passwordState, hasPhone: !!phone });
  
  const { models, operations } = useLoginScreen();

  return (
    <>
      <KeyboardAvoidingWrapper style={styles.container}>
        <TouchableWithoutFeedback onPress={() => Keyboard.dismiss()}>
          <View style={styles.content}>
              <Animated.View style={styles.logo} entering={FadeInDown.delay(0).springify().damping(28).stiffness(180)}>
                <Image
                  source={require("../../resources/icons/UREB_LOGO.png")}
                  resizeMode="cover"
                />
                <Image
                  source={require("../../resources/icons/UREB_TEXT.png")}
                  resizeMode="cover"
                />
              </Animated.View>

              <Animated.View style={styles.initsess} entering={FadeInDown.delay(80).springify().damping(28).stiffness(180)}>
                <View style={styles.divider} />
                <Text style={styles.text}>Iniciar sessão</Text>
                <View style={styles.divider} />
              </Animated.View>
              
              <Animated.View style={styles.formContainer} entering={FadeInDown.delay(160).springify().damping(28).stiffness(180)}>
                <View style={styles.phoneDiv}>
                  {!passwordState ? (
                    <Text style={styles.instructionText}>
                      Introduza o seu número de telefone
                    </Text>
                  ) : (
                    <Text style={styles.instructionText}>Introduza a sua senha</Text>
                  )}

                  <View style={[styles.phone, models.warning && styles.phoneError]}>
                    {!passwordState ? (
                      <>
                        <View style={styles.numberFlag}>
                          <CountryPickerWithFlag
                            onCallingCodeSelect={operations.handleCallingCodeSelect}
                          ></CountryPickerWithFlag>
                        </View>
                        <Text style={styles.separator}>|</Text>
                        <TextInput
                          style={styles.input}
                          placeholderTextColor="#999"
                          keyboardType="numeric"
                          placeholder="Telefone"
                          value={models.number}
                          onChangeText={operations.handleNumberChange}
                          accessibilityLabel="Campo de número de telefone"
                          accessibilityRole="text"
                        />
                      </>
                    ) : (
                      <View style={styles.passwordContainer}>
                        <TextInput
                          secureTextEntry={!showPassword}
                          style={styles.passwordInput}
                          placeholderTextColor="#999"
                          placeholder="Senha"
                          value={models.password}
                          onChangeText={operations.handlePasswordChange}
                          accessibilityLabel="Campo de senha"
                          accessibilityRole="text"
                        />
                        <TouchableOpacity
                          style={styles.eyeButton}
                          onPress={() => setShowPassword(!showPassword)}
                          accessibilityLabel={showPassword ? "Ocultar senha" : "Mostrar senha"}
                          accessibilityRole="button"
                        >
                          <Icon
                            name={showPassword ? "visibility-off" : "visibility"}
                            size={scale(22)}
                            color="#707070"
                          />
                        </TouchableOpacity>
                      </View>
                    )}
                  </View>
                  
                  {models.warning ? (
                    <View style={styles.errorContainer}>
                      <Text style={[styles.warningText, models.loginFailed && styles.errorText]}>
                        {models.warning}
                      </Text>
                    </View>
                  ) : null}
                  
                  {models.loginFailed && passwordState && (
                    <TouchableOpacity
                      style={styles.changeNumberButton}
                      onPress={operations.goBackToPhoneEntry}
                      accessibilityLabel="Alterar número de telefone"
                      accessibilityRole="button"
                    >
                      <Text style={styles.changeNumberText}>
                        Alterar Número de Telefone
                      </Text>
                    </TouchableOpacity>
                  )}
                </View>
              </Animated.View>

              <Animated.View style={styles.bottom} entering={FadeInDown.delay(240).springify().damping(28).stiffness(180)}>
                <Text style={styles.disclaimerText}>
                  Ao tocar em Avançar, dou o meu consentimento para o
                  processamento de minhas informações pessoais de acordo com os
                  termos descritos na Política de Privacidade
                </Text>
                {!passwordState ? (
                  <TouchableOpacity 
                    onPress={operations.onVerifyOtp}
                    accessibilityLabel="Avançar com número de telefone"
                    accessibilityRole="button"
                  >
                    <View style={styles.button}>
                      <Text style={styles.buttonText}>AVANÇAR</Text>
                    </View>
                  </TouchableOpacity>
                ) : (
                  <TouchableOpacity 
                    onPress={() => operations.onLogin(phone)}
                    accessibilityLabel="Fazer login com senha"
                    accessibilityRole="button"
                    disabled={models.isLoading}
                    style={models.isLoading && styles.buttonDisabled}
                  >
                    <View style={[styles.button, models.isLoading && styles.buttonLoading]}>
                      {models.isLoading ? (
                        <ActivityIndicator size="small" color="#fff" />
                      ) : (
                        <Text style={styles.buttonText}>AVANÇAR</Text>
                      )}
                    </View>
                  </TouchableOpacity>
                )}
              </Animated.View>
            </View>
        </TouchableWithoutFeedback>
      </KeyboardAvoidingWrapper>
      <OTPModal
        visible={models.modalOtpVisible}
        OTPChange={operations.handleOTPChange}
        code={models.codeOTP}
        number={`+ ${models.callingCode} ${models.number}`}
        onClose={operations.handleOTPModalClose}
        onResend={operations.handleOnConfirmNumber}
        onChangeLoginState={operations.onChangeLoginState}
        modalRegVisible={models.modalRegisterVisible}
      />
      <RegisterPassModal
        visible={models.modalRegisterVisible}
        changeLoginState={operations.onChangeLoginState}
        phone={`${models.callingCode} ${models.number}`}
      />
    </>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: colors.background,
    flex: 1,
    width: "100%",
    height: "100%",
  },
  content: {
    flex: 1,
    marginHorizontal: spacing.xl,
    paddingVertical: scale(40),
    justifyContent: "space-between",
   },
  logo: {
    alignItems: "center",
    marginBottom: spacing.sm,
  },
  initsess: {
    flexDirection: "row",
    alignSelf: "center",
    paddingVertical: spacing.xxl,
  },
  text: {
    fontSize: 16,
    color: colors.textSecondary,
    paddingHorizontal: spacing.xxl,
  },
  divider: {
    borderBottomWidth: scale(0.5),
    borderColor: colors.textDisabled,
    width: scale(100),
    alignSelf: "center",
  },
  formContainer: {
    justifyContent: "center",
    paddingVertical: spacing.xs,
  },
  phoneDiv: {
    paddingHorizontal: spacing.sm,
  },
  instructionText: {
    color: colors.textSecondary,
    fontSize: scale(16),
    marginBottom: spacing.lg,
  },
  phone: {
    borderRadius: borderRadius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    flexDirection: "row",
    paddingVertical: spacing.md,
    backgroundColor: colors.surface,
    ...shadows.sm,
  },
  phoneError: {
    borderColor: colors.error,
    backgroundColor: colors.errorLight,
  },
  numberFlag: {
    flexDirection: "row",
    paddingHorizontal: spacing.sm,
  },
  separator: {
    fontSize: 20,
    alignSelf: "center",
    color: colors.textDisabled,
  },
  input: {
    flex: 1,
    color: colors.textPrimary,
    fontSize: 18,
    paddingHorizontal: spacing.sm,
  },
  passwordContainer: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.sm,
  },
  passwordInput: {
    flex: 1,
    color: colors.textPrimary,
    fontSize: 18,
    paddingRight: spacing.sm,
  },
  eyeButton: {
    padding: spacing.sm,
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: spacing.xs,
  },
  errorContainer: {
    marginTop: spacing.sm,
    paddingHorizontal: spacing.xs,
    minHeight: scale(40),
    justifyContent: "center",
  },
  warningText: {
    color: colors.error,
    fontSize: scale(14),
    paddingHorizontal: spacing.sm,
    textAlign: "center",
    lineHeight: scale(20),
  },
  errorText: {
    fontWeight: "600",
    color: colors.error,
  },
  changeNumberButton: {
    marginTop: spacing.lg,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.xl,
    backgroundColor: colors.surface,
    borderRadius: borderRadius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: "center",
    marginHorizontal: spacing.xs,
    ...shadows.sm,
  },
  changeNumberText: {
    color: colors.primary,
    fontSize: scale(14),
    fontWeight: "600",
  },
  bottom: {
    paddingTop: spacing.sm,
  },
  disclaimerText: {
    paddingBottom: spacing.xl,
    paddingHorizontal: spacing.sm,
    fontSize: scale(12),
    color: colors.textSecondary,
    lineHeight: scale(16),
    textAlign: "center",
  },
  button: {
    backgroundColor: colors.primary,
    borderRadius: borderRadius.xl,
    alignItems: "center",
    marginHorizontal: spacing.sm,
    minHeight: scale(50),
    justifyContent: "center",
    ...shadows.primaryGlow,
  },
  buttonLoading: {
    backgroundColor: colors.textDisabled,
    shadowOpacity: 0,
    elevation: 0,
  },
  buttonDisabled: {
    opacity: 0.7,
  },
  buttonText: {
    color: colors.surface,
    fontSize: 18,
    fontWeight: "bold",
    paddingVertical: spacing.lg,
  },
});

export default LoginScreen;
