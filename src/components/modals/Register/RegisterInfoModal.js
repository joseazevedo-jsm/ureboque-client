import React, { useState } from "react";
import {
  FlatList,
  Image,
  Modal,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { TextInput } from "react-native-gesture-handler";
import { scale } from "react-native-size-matters";
import Icon from "react-native-vector-icons/MaterialIcons";
import { useRegisterModal } from "./components/useRegisterModal";
import OTPModal from "../OTP/OTPModal";

const RegisterInfoModal = ({
  visible,
  onChangeLoginState,
  phone,
  registrationMethod,
  onChangeName,
  onChangeSurname,
  onChangeEmail,
  onCreateUser,
  errors,
  isLoading,
  otpModalVisible,
  onOTPVerified,
  email,
  onCloseOTP,
  onClosePassModal
}) => {
  
  const handleRegister = async () => {
    console.log('DEBUG - handleRegister called with:', { registrationMethod, phone, email });
    const success = await onCreateUser(phone, registrationMethod);
    console.log('DEBUG - User creation result:', success);
    if (success && registrationMethod === 'phone') {
      console.log('DEBUG - Completing phone registration');
      onChangeLoginState('phone', phone);
      onClosePassModal();
    }
    // For email registration, we don't call onChangeLoginState here
    // It will be handled after OTP verification
  };

  return (
    <>
      <Modal visible={visible} animationType="slide">
        <View style={styles.container}>
          <Text style={styles.title}>CADASTRO</Text>
          <View style={styles.inputInfo}>
            {registrationMethod === 'phone' ? (
              <Text style={styles.subtitle}>
                Seu número de telefone: <Text style={styles.highlightText}>{phone}</Text>
              </Text>
            ) : (
              <Text style={styles.subtitle}>
                Complete seu cadastro com email
              </Text>
            )}
            
            <TextInput
              placeholder="Nome"
              style={styles.inputBox}
              onChangeText={onChangeName}
              autoCapitalize="words"
            />
            <TextInput
              placeholder="Sobrenome"
              style={styles.inputBox}
              onChangeText={onChangeSurname}
              autoCapitalize="words"
            />
            
            {registrationMethod === 'email' && (
              <TextInput
                placeholder="Email"
                style={styles.inputBox}
                onChangeText={(text) => onChangeEmail(text.trim())}
                keyboardType="email-address"
                autoCapitalize="none"
                autoCorrect={false}
              />
            )}
            
            {errors.length > 0 && (
              <View style={styles.errorContainer}>
                {errors.map((error, index) => (
                  <Text key={index} style={styles.errorItem}>
                    <Icon name="error-outline" size={16} color="#FF6B6B" />
                    {" "}{error}
                  </Text>
                ))}
              </View>
            )}
          </View>

          <TouchableOpacity
            style={[
              styles.button,
              isLoading && styles.buttonDisabled
            ]}
            disabled={isLoading}
            onPress={handleRegister}
          >
            <Text style={styles.buttonText}>
              {isLoading ? 'CADASTRANDO...' : 'AVANÇAR'}
            </Text>
          </TouchableOpacity>
        </View>
      </Modal>

      <OTPModal
        visible={otpModalVisible}
        OTPChange={onOTPVerified}
        number={email}
        onClose={onCloseOTP}
        isEmail={true}
      />
    </>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "space-between",
  },
  title: {
    fontSize: scale(50),
    fontWeight: "bold",
    color: "#0089FF",
    textAlign: "center",
    paddingHorizontal: scale(10),
    paddingTop: scale(80),
  },
  inputInfo: {
    marginHorizontal: scale(20),
    paddingVertical: scale(50),
  },
  input: {},
  inputBox: {
    borderColor: "#0089FF",
    borderWidth: scale(3),
    borderRadius: scale(7),
    fontSize: scale(15),
    paddingVertical: scale(10),
    paddingHorizontal: scale(15),
    marginTop: scale(15),
  },
  bottom: {
    backgroundColor: "#0089FF",
    marginHorizontal: scale(20),
    alignItems: "center",
    borderRadius: scale(7),
  },
  save: {
    fontSize: scale(20),
    fontWeight: "bold",
    color: "#FFF",
    paddingVertical: scale(15),
  },
  errorContainer: {
    marginTop: scale(15),
  },
  error: {
    fontSize: scale(18),
  },
  errorItem: {
    fontSize: scale(18),
    paddingHorizontal:scale(5)
  },
  subtitle: {
    fontSize: scale(18),
    color: '#707070',
    textAlign: 'center',
    marginBottom: scale(40),
  },
  highlightText: {
    color: '#0089FF',
    fontWeight: 'bold',
  },
  button: {
    backgroundColor: '#0089FF',
    marginHorizontal: scale(20),
    borderRadius: scale(7),
    padding: scale(15),
    alignItems: 'center',
    marginBottom: scale(20),
  },
  buttonDisabled: {
    backgroundColor: '#ccc',
  },
  buttonText: {
    color: '#FFF',
    fontSize: scale(18),
    fontWeight: 'bold',
  },
});
export default RegisterInfoModal;
