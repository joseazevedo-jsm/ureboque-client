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
              {!passwordState ? (
                <Text style={{ color: "#707070" }}>
                  Introduza o seu número de telefone
                </Text>
              ) : (
                <Text style={{ color: "#707070" }}>Introduza a sua senha</Text>
              )}

              <View style={styles.phone}>
                {!passwordState ? (
                  <>
                    <View style={styles.numberFlag}>
                      <CountryPickerWithFlag
                        onCallingCodeSelect={operations.handleCallingCodeSelect}
                      ></CountryPickerWithFlag>
                    </View>
                    <Text
                      style={{
                        fontSize: 20,
                        alignSelf: "center",
                      }}
                    >
                      |
                    </Text>
                    <TextInput
                      style={styles.input}
                      placeholderTextColor="#000"
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
                      placeholderTextColor="#000"
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
                <Text style={styles.warningText}>{models.warning}</Text>
              ) : null}
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
                >
                  <View style={styles.button}>
                    <Text style={styles.buttonText}>AVANÇAR</Text>
                  </View>
                </TouchableOpacity>
              )}
            </View>
          </View>
        </View>
      </TouchableWithoutFeedback>
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
    flex:1
  },
  content: {
    marginHorizontal: scale(20),
    paddingVertical:scale(50),
    justifyContent:"space-around"
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
});

export default LoginScreen;
