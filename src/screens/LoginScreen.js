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
} from "react-native";
import CountryPickerWithFlag from "../components/login/CountryPickerWithFlag";
import { scale } from "react-native-size-matters";
import { useLoginScreen } from "../components/login/useLoginScreen";
import OTPModal from "../components/modals/OTP/OTPModal";
import RegisterMethodModal from "../components/modals/Register/RegisterMethodModal";

const LoginScreen = () => {
  const { models, operations } = useLoginScreen();

  return (
    <>
      <TouchableWithoutFeedback onPress={() => Keyboard.dismiss()}>
        <View style={styles.container}>
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
            <View style={styles.phoneDiv}>
              {!models.passwordState ? (
                <>
                  <Text style={{ color: "#707070" }}>
                    Introduza seu email ou número de telefone
                  </Text>
                  <View style={styles.loginMethodToggle}>
                    <TouchableOpacity 
                      style={[styles.methodButton, models.loginMethod === 'phone' && styles.methodButtonActive]} 
                      onPress={() => operations.setLoginMethod('phone')}
                    >
                      <Text style={[styles.methodText, models.loginMethod === 'phone' && styles.methodTextActive]}>Telefone</Text>
                    </TouchableOpacity>
                    <TouchableOpacity 
                      style={[styles.methodButton, models.loginMethod === 'email' && styles.methodButtonActive]}
                      onPress={() => operations.setLoginMethod('email')}
                    >
                      <Text style={[styles.methodText, models.loginMethod === 'email' && styles.methodTextActive]}>Email</Text>
                    </TouchableOpacity>
                  </View>

                  <View style={styles.phone}>
                    {models.loginMethod === 'phone' ? (
                      <>
                        <View style={styles.numberFlag}>
                          <CountryPickerWithFlag
                            onCallingCodeSelect={operations.handleCallingCodeSelect}
                          ></CountryPickerWithFlag>
                          <TextInput
                            style={{
                              fontSize: 18,
                              color: "#707070",
                            }}
                            placeholderTextColor="#707070"
                            keyboardType="numeric"
                            defaultValue={`+${models.callingCode}`}
                            editable={false}
                          />
                        </View>
                        <Text style={{ fontSize: 20, alignSelf: "center" }}>|</Text>
                        <TextInput
                          style={styles.input}
                          placeholderTextColor="#000"
                          keyboardType="numeric"
                          placeholder="Telefone"
                          value={models.number}
                          onChangeText={operations.handleNumberChange}
                        />
                      </>
                    ) : (
                      <TextInput
                        style={styles.input}
                        placeholderTextColor="#000"
                        keyboardType="email-address"
                        placeholder="Email"
                        value={models.email}
                        onChangeText={operations.handleEmailChange}
                        autoCapitalize="none"
                      />
                    )}
                  </View>
                </>
              ) : (
                <>
                  <Text style={{ color: "#707070" }}>Introduza a sua senha</Text>
                  <View style={styles.phone}>
                    <TextInput
                      secureTextEntry
                      style={styles.input}
                      placeholderTextColor="#000"
                      placeholder="Senha"
                      value={models.password}
                      onChangeText={operations.handlePasswordChange}
                    />
                  </View>
                </>
              )}
              {models.warning ? (
                <Text style={styles.warningText}>{models.warning}</Text>
              ) : null}
            </View>
            <View style={styles.bottom}>
              <Text style={styles.disclaimerText}>
                Ao tocar em Avançar, dou o meu consentimento para o
                processamento de minhas informações pessoais de acordo com os
                termos descritos na Política de Privacidade
              </Text>
              {!models.passwordState ? (
                <TouchableOpacity onPress={operations.onAdvanceLogin}>
                  <View style={styles.button}>
                    <Text style={styles.buttonText}>AVANÇAR</Text>
                  </View>
                </TouchableOpacity>
              ) : (
                <TouchableOpacity 
                  onPress={() => operations.onLogin(
                    models.loginMethod === 'phone' 
                      ? `${models.callingCode} ${models.number}`
                      : models.email
                  )}
                >
                  <View style={styles.button}>
                    <Text style={styles.buttonText}>AVANÇAR</Text>
                  </View>
                </TouchableOpacity>
              )}
              {!models.passwordState && (
                <TouchableOpacity 
                  onPress={operations.onRegisterModalVisible}
                  style={styles.registerButton}
                >
                  <Text style={styles.registerText}>Não tem conta? Registre-se</Text>
                </TouchableOpacity>
              )}
            </View>
          </View>
        </View>
      </TouchableWithoutFeedback>
      <RegisterMethodModal
        visible={models.modalMethodVisible}
        onClose={operations.onCloseMethodModal}
        onSelectMethod={operations.onSelectRegistrationMethod}
        onChangeLoginState={operations.onChangeLoginState}
        onRegistrationComplete={operations.onRegistrationComplete}
        onCloseOTP={operations.onCloseOTPModal}
      />
      <OTPModal
        visible={models.modalOtpVisible}
        OTPChange={operations.handleOTPChange}
        number={models.loginMethod === 'phone' ? `+${models.callingCode} ${models.number}` : models.email}
        onClose={operations.onCloseOTPModal}
      />
    </>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#FFF",
    justifyContent: "space-around",
  },
  content: {
    marginHorizontal: scale(20),
  },
  logo: {
    alignItems: "center",
  },
  initsess: {
    flexDirection: "row",
    alignSelf: "center",
    paddingTop: scale(50),
    paddingBottom: scale(80),
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
  phoneDiv: {
    paddingHorizontal: scale(10),
  },

  phone: {
    borderRadius: scale(7),
    borderWidth: 3,
    borderColor: "#0089ff",
    flexDirection: "row",
    marginTop: scale(15),
    paddingVertical: scale(6),
  },

  numberFlag: {
    flexDirection: "row",
    paddingHorizontal: scale(10),
  },
  input: {
    color: "#000",
    fontSize: 18,
    paddingHorizontal: scale(10),
  },
  disclaimerText: {
    paddingBottom: scale(50),
    paddingHorizontal: scale(10),
    fontSize: 12,
  },
  button: {
    backgroundColor: "#0089ff",
    borderRadius: scale(7),
    alignItems: "center",
    marginHorizontal: scale(10),
  },
  buttonText: {
    color: "white",
    fontSize: 18,
    fontWeight: "bold",
    paddingVertical: scale(15),
  },
  bottom: {
    marginTop: scale(100),
  },
  registerButton: {
    marginTop: scale(15),
    alignItems: 'center',
  },
  registerText: {
    color: '#0089ff',
    fontSize: 16,
    textDecorationLine: 'underline',
  },
  loginMethodToggle: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginVertical: scale(10),
  },
  methodButton: {
    paddingHorizontal: scale(20),
    paddingVertical: scale(8),
    marginHorizontal: scale(5),
    borderRadius: scale(20),
    borderWidth: 1,
    borderColor: '#0089ff',
  },
  methodButtonActive: {
    backgroundColor: '#0089ff',
  },
  methodText: {
    color: '#0089ff',
  },
  methodTextActive: {
    color: '#fff',
  },
});

export default LoginScreen;
