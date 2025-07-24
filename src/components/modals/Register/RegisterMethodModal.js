import React, { useState } from 'react';
import {
  Modal,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { scale } from 'react-native-size-matters';
import Icon from 'react-native-vector-icons/MaterialIcons';
import CountryPickerWithFlag from "../../login/CountryPickerWithFlag";
import { TextInput } from 'react-native-gesture-handler';
import RegisterPassModal from './RegisterPassModal';
import OTPModal from '../OTP/OTPModal';

const RegisterMethodModal = ({ visible, onClose, onSelectMethod, onChangeLoginState, onRegistrationComplete, onCloseOTP }) => {
  const [selectedMethod, setSelectedMethod] = useState(null);
  const [callingCode, setCallingCode] = useState("244");
  const [phoneNumber, setPhoneNumber] = useState("");
  const [error, setError] = useState("");
  const [showPassModal, setShowPassModal] = useState(false);
  const [showOTPModal, setShowOTPModal] = useState(false);
  const [currentContact, setCurrentContact] = useState("");

  const handleCallingCodeSelect = (code) => {
    setCallingCode(code);
  };

  const handleContinue = () => {
    if (selectedMethod === 'phone') {
      if (phoneNumber.length < 9) {
        setError("O número de telefone deve ter pelo menos 9 caracteres");
        return;
      }
      const contact = `${callingCode} ${phoneNumber}`;
      setCurrentContact(contact);
      setShowOTPModal(true);
      onSelectMethod('phone', contact);
    } else if (selectedMethod === 'email') {
      setShowPassModal(true);
      onSelectMethod('email', null);
    }
  };

  const handlePassModalClose = () => {
    onClose();
    setShowPassModal(false);
    setSelectedMethod(null);
  };

  const handleOTPModalClose = () => {
    setShowOTPModal(false);
    onCloseOTP();
  };

  const handleRegistrationComplete = () => {
    // Close all modals
    handlePassModalClose();
  };

  const handleOTPVerified = (otp) => {
    // For phone registration, validate OTP locally (assuming correct OTP is '1234')
    if (otp === '1234') {
      setShowOTPModal(false);
      setShowPassModal(true);
    } else {
      setError("Código OTP inválido. Tente novamente.");
    }
  };

  return (
    <>
      <Modal
        visible={visible}
        animationType="slide"
        onRequestClose={onClose}
      >
        <View style={styles.container}>
          <View style={styles.header}>
            <TouchableOpacity onPress={onClose} style={styles.closeButton}>
              <Icon name="close" size={24} color="#707070" />
            </TouchableOpacity>
          </View>

          <View style={styles.content}>
            <Text style={styles.title}>CADASTRO</Text>
            <Text style={styles.subtitle}>
              Como você deseja se cadastrar?
            </Text>

            {selectedMethod === 'phone' && (
              <View style={styles.phoneInputContainer}>
                <Text style={styles.inputLabel}>Digite seu número de telefone:</Text>
                <View style={styles.phoneInput}>
                  <View style={styles.countryPicker}>
                    <CountryPickerWithFlag
                      onCallingCodeSelect={handleCallingCodeSelect}
                    />
                    <TextInput
                      style={styles.callingCode}
                      value={`+${callingCode}`}
                      editable={false}
                    />
                  </View>
                  <Text style={styles.separator}>|</Text>
                  <TextInput
                    style={styles.numberInput}
                    placeholder="Número de telefone"
                    keyboardType="numeric"
                    value={phoneNumber}
                    onChangeText={(text) => {
                      setPhoneNumber(text);
                      setError("");
                    }}
                  />
                </View>
                {error ? <Text style={styles.errorText}>{error}</Text> : null}
              </View>
            )}

            <View style={styles.methodsContainer}>
              <TouchableOpacity 
                style={[
                  styles.methodButton,
                  selectedMethod === 'phone' && styles.methodButtonSelected
                ]}
                onPress={() => setSelectedMethod('phone')}
              >
                <Icon 
                  name="phone" 
                  size={40} 
                  color={selectedMethod === 'phone' ? "#FFF" : "#0089FF"} 
                />
                <Text style={[
                  styles.methodText,
                  selectedMethod === 'phone' && styles.methodTextSelected
                ]}>
                  Telefone
                </Text>
              </TouchableOpacity>

              <TouchableOpacity 
                style={[
                  styles.methodButton,
                  selectedMethod === 'email' && styles.methodButtonSelected
                ]}
                onPress={() => setSelectedMethod('email')}
              >
                <Icon 
                  name="email" 
                  size={40} 
                  color={selectedMethod === 'email' ? "#FFF" : "#0089FF"} 
                />
                <Text style={[
                  styles.methodText,
                  selectedMethod === 'email' && styles.methodTextSelected
                ]}>
                  Email
                </Text>
              </TouchableOpacity>
            </View>
          </View>

          {selectedMethod && (
            <View style={styles.footer}>
              <TouchableOpacity 
                style={styles.button}
                onPress={handleContinue}
              >
                <Text style={styles.buttonText}>Continuar</Text>
              </TouchableOpacity>
            </View>
          )}
        </View>
      </Modal>

      <RegisterPassModal
        visible={showPassModal}
        onClose={handlePassModalClose}
        onSelectMethod={onSelectMethod}
        onChangeLoginState={onChangeLoginState}
        onRegistrationComplete={onRegistrationComplete}
        registrationMethod={selectedMethod}
        phone={currentContact}
        onCloseOTP={onCloseOTP}
        onClosePassModal={handlePassModalClose}
      />

      <OTPModal
        visible={showOTPModal}
        OTPChange={handleOTPVerified}
        number={`+${callingCode} ${phoneNumber}`}
        onClose={handleOTPModalClose}
      />
    </>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFF',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    padding: scale(10),
  },
  closeButton: {
    padding: scale(5),
  },
  content: {
    flex: 1,
    paddingHorizontal: scale(20),
    paddingTop: scale(40),
  },
  title: {
    fontSize: scale(40),
    fontWeight: 'bold',
    color: '#0089FF',
    textAlign: 'center',
    marginBottom: scale(20),
  },
  subtitle: {
    fontSize: scale(18),
    color: '#707070',
    textAlign: 'center',
    marginBottom: scale(40),
  },
  phoneInputContainer: {
    marginBottom: scale(20),
    width: '100%',
  },
  inputLabel: {
    fontSize: scale(16),
    color: '#707070',
    marginBottom: scale(10),
  },
  phoneInput: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#0089FF',
    borderRadius: scale(8),
    paddingVertical: scale(5),
  },
  countryPicker: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: scale(10),
  },
  callingCode: {
    fontSize: scale(16),
    color: '#707070',
  },
  separator: {
    fontSize: scale(20),
    color: '#707070',
    marginHorizontal: scale(5),
  },
  numberInput: {
    flex: 1,
    fontSize: scale(16),
    paddingHorizontal: scale(10),
  },
  errorText: {
    color: '#FF6B6B',
    fontSize: scale(14),
    marginTop: scale(5),
  },
  methodsContainer: {
    gap: scale(20),
    marginTop: scale(20),
  },
  methodButton: {
    borderWidth: 2,
    borderColor: '#0089FF',
    borderRadius: scale(10),
    padding: scale(20),
    alignItems: 'center',
  },
  methodText: {
    fontSize: scale(20),
    color: '#0089FF',
    fontWeight: 'bold',
    marginTop: scale(10),
  },
  methodDescription: {
    fontSize: scale(14),
    color: '#707070',
    textAlign: 'center',
    marginTop: scale(5),
  },
  methodButtonSelected: {
    backgroundColor: '#0089FF',
  },
  methodTextSelected: {
    color: '#FFF',
  },
  footer: {
    padding: scale(20),
    alignItems: 'center',
  },
  button: {
    backgroundColor: '#0089FF',
    padding: scale(20),
    borderRadius: scale(10),
  },
  buttonText: {
    fontSize: scale(20),
    color: '#FFF',
    fontWeight: 'bold',
  },
});

export default RegisterMethodModal; 