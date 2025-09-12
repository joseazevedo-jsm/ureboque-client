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
  KeyboardAvoidingView,
  Platform,
} from "react-native";
import Icon from "react-native-vector-icons/MaterialIcons";
import CountryPickerWithFlag from "../components/login/CountryPickerWithFlag";
import { scale } from "react-native-size-matters";
import { useLoginScreen } from "../components/login/useLoginScreen";
import { useRoute } from "@react-navigation/native";
import OTPModal from "../components/modals/OTP/OTPModal";
import RegisterPassModal from "../components/modals/Register/RegisterPassModal";
import { useLogger } from "../hooks/useLogger";

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

  // const verifyPhoneNumber = () => {
  //   // const sent = operations.handleOnConfirmNumber();
  //   // console.log(sent);
  //   // if(models.codeOTP){
  //   navigation.navigate("OTP", {
  //     number: `+${models.callingCode} ${models.number}`,

  //   });
  //   // }
  // };

  return (
    <>
      <KeyboardAvoidingView 
        style={styles.container} 
        behavior={Platform.OS === "ios" ? "padding" : undefined}
        enabled={Platform.OS === "ios"}
      >
        <TouchableWithoutFeedback onPress={() => Keyboard.dismiss()}>
          <View style={styles.content}>
              <View style={styles.logo}>
                <Image
                  source={require("../../resources/icons/UREB_LOGO.png")}
                  resizeMode="cover"
                />
                <Image
                  source={require("../../resources/icons/UREB_TEXT.png")}
                  resizeMode="cover"
                />
              </View>
              
              <View style={styles.initsess}>
                <View style={styles.divider} />
                <Text style={styles.text}>Iniciar sessão</Text>
                <View style={styles.divider} />
              </View>
              
              <View style={styles.formContainer}>
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
              </View>
              
              <View style={styles.bottom}>
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
              </View>
            </View>
        </TouchableWithoutFeedback>
      </KeyboardAvoidingView>
      <OTPModal
        visible={models.modalOtpVisible}
        OTPChange={operations.handleOTPChange}
        code={models.codeOTP}
        number={`+ ${models.callingCode} ${models.number}`}
        onClose={operations.handleOTPModalClose}
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
    backgroundColor: "#FFF",
    flex: 1,
    width: "100%",
    height: "100%",
  },
  content: {
    flex: 1,
    marginHorizontal: scale(20),
    paddingVertical: scale(40),
    justifyContent: "space-between",
   },
  logo: {
    alignItems: "center",
    marginBottom: scale(10),
  },
  initsess: {
    flexDirection: "row",
    alignSelf: "center",
    paddingVertical: scale(25),
  },
  text: {
    fontSize: 16,
    color: "#707070",
    paddingHorizontal: scale(25),
  },
  divider: {
    borderBottomWidth: scale(0.5),
    borderColor: "#707070",
    width: scale(100),
    alignSelf: "center",
  },
  formContainer: {
    justifyContent: "center",
    paddingVertical: scale(15),
  },
  phoneDiv: {
    paddingHorizontal: scale(10),
  },
  instructionText: {
    color: "#707070",
    fontSize: scale(16),
    marginBottom: scale(15),
  },
  phone: {
    borderRadius: scale(7),
    borderWidth: 2,
    borderColor: "#0089ff",
    flexDirection: "row",
    paddingVertical: scale(12),
    backgroundColor: "#fafafa",
  },
  phoneError: {
    borderColor: "#e74c3c",
    backgroundColor: "#fff5f5",
  },
  numberFlag: {
    flexDirection: "row",
    paddingHorizontal: scale(10),
  },
  separator: {
    fontSize: 20,
    alignSelf: "center",
    color: "#ccc",
  },
  input: {
    flex: 1,
    color: "#000",
    fontSize: 18,
    paddingHorizontal: scale(10),
  },
  passwordContainer: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: scale(10),
  },
  passwordInput: {
    flex: 1,
    color: "#000",
    fontSize: 18,
    paddingRight: scale(10),
  },
  eyeButton: {
    padding: scale(8),
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: scale(5),
  },
  errorContainer: {
    marginTop: scale(10),
    paddingHorizontal: scale(5),
    minHeight: scale(40),
    justifyContent: "center",
  },
  warningText: {
    color: "#ff6b6b",
    fontSize: scale(14),
    paddingHorizontal: scale(10),
    textAlign: "center",
    lineHeight: scale(20),
  },
  errorText: {
    fontWeight: "600",
    color: "#e74c3c",
  },
  changeNumberButton: {
    marginTop: scale(15),
    paddingVertical: scale(12),
    paddingHorizontal: scale(20),
    backgroundColor: "#f8f9fa",
    borderRadius: scale(8),
    borderWidth: 1,
    borderColor: "#dee2e6",
    alignItems: "center",
    marginHorizontal: scale(5),
  },
  changeNumberText: {
    color: "#0089ff",
    fontSize: scale(14),
    fontWeight: "500",
  },
  bottom: {
    paddingTop: scale(10),
  },
  disclaimerText: {
    paddingBottom: scale(20),
    paddingHorizontal: scale(10),
    fontSize: scale(12),
    color: "#666",
    lineHeight: scale(16),
    textAlign: "center",
  },
  button: {
    backgroundColor: "#0089ff",
    borderRadius: scale(7),
    alignItems: "center",
    marginHorizontal: scale(10),
    minHeight: scale(50),
    justifyContent: "center",
  },
  buttonLoading: {
    backgroundColor: "#6c757d",
  },
  buttonDisabled: {
    opacity: 0.7,
  },
  buttonText: {
    color: "white",
    fontSize: 18,
    fontWeight: "bold",
    paddingVertical: scale(15),
  },
});

export default LoginScreen;
