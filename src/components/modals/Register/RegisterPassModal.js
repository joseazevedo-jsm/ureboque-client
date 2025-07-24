import React, { useState, useEffect } from "react";
import {
  Modal,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  KeyboardAvoidingView,
  Platform,
} from "react-native";
import { TextInput } from "react-native-gesture-handler";
import { scale } from "react-native-size-matters";
import Icon from "react-native-vector-icons/MaterialIcons";
import RegisterInfoModal from "./RegisterInfoModal";
import { useRegisterModal } from "./components/useRegisterModal";

const RegisterPassModal = ({ 
  visible, 
  onClosePassModal,
  onChangeLoginState,
  onRegistrationComplete,
  phone, 
  onClose,
  registrationMethod,
  onCloseOTP
}) => {
  const { models, operations } = useRegisterModal(null, onClosePassModal, onRegistrationComplete);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  useEffect(() => {
    if (visible) {
      // Reset password fields when modal becomes visible
      operations.onPasswordTextChange('');
      operations.onConfirmPasswordTextChange('');
    }
  }, [visible]);

  const handleContinue = () => {
    if (operations.validatePassword()) {
       operations.handleOnGoModalRegisterInfoVisible();
     }
  };

  return (
    <Modal 
      visible={visible} 
      animationType="slide"
      onRequestClose={onClose}
    >
      <View style={styles.container}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={onClose}>
            <Icon name="close" size={24} color="#707070" />
          </TouchableOpacity>
        </View>

        {/* Main Content */}
        <View style={styles.content}>
          <Text style={styles.title}>Criar Senha</Text>
          
          <Text style={styles.subtitle}>
            {registrationMethod === 'phone' ? (
              <Text>
                Digite uma senha para o número <Text style={styles.highlight}>{phone}</Text>
              </Text>
            ) : (
              <Text>Digite uma senha para sua conta</Text>
            )}
          </Text>

          {/* Password Fields */}
          <View style={styles.inputContainer}>
            <View style={styles.inputWrapper}>
              <TextInput
                secureTextEntry={!showPassword}
                placeholder="Digite sua senha"
                style={styles.input}
                onChangeText={operations.onPasswordTextChange}
                placeholderTextColor="#999"
              />
              <TouchableOpacity onPress={() => setShowPassword(!showPassword)}>
                <Icon 
                  name={showPassword ? "visibility" : "visibility-off"} 
                  size={24} 
                  color="#707070" 
                />
              </TouchableOpacity>
            </View>

            <View style={styles.inputWrapper}>
              <TextInput
                secureTextEntry={!showConfirmPassword}
                placeholder="Confirme sua senha"
                style={styles.input}
                onChangeText={operations.onConfirmPasswordTextChange}
                placeholderTextColor="#999"
              />
              <TouchableOpacity onPress={() => setShowConfirmPassword(!showConfirmPassword)}>
                <Icon 
                  name={showConfirmPassword ? "visibility" : "visibility-off"} 
                  size={24} 
                  color="#707070" 
                />
              </TouchableOpacity>
            </View>
          </View>

          {/* Only show requirements if password has been typed */}
          {models.password && models.errors.length > 0 && (
            <View style={styles.requirements}>
              <Text style={styles.requirementsTitle}>A senha deve conter:</Text>
              {models.validationRules.map((rule, index) => (
                <View key={index} style={styles.requirementRow}>
                  <Icon 
                    name={rule.rule ? "check-circle" : "error-outline"} 
                    size={16} 
                    color={rule.rule ? "#4CAF50" : "#FF6B6B"}
                  />
                  <Text 
                    style={[
                      styles.requirementText,
                      rule.rule && styles.requirementMet
                    ]}
                  >
                    {rule.message}
                  </Text>
                </View>
              ))}
            </View>
          )}

          {/* Button */}
          <View style={styles.footer}>
            <TouchableOpacity 
              style={styles.button}
              onPress={handleContinue}
            >
              <Text style={styles.buttonText}>Continuar</Text>
            </TouchableOpacity>
          </View>
        </View>

        <RegisterInfoModal
          visible={models.modalRegisterInfoVisible}
          onChangeLoginState={onChangeLoginState}
          onRegistrationComplete={onRegistrationComplete}
          phone={phone}
          registrationMethod={registrationMethod}
          onChangeName={operations.onNameTextChange}
          onChangeSurname={operations.onSurnameTextChange}
          onChangeEmail={operations.onEmailTextChange}
          onCreateUser={operations.handleCreateUser}
          errors={models.errorsUser}
          isLoading={models.isLoading}
          otpModalVisible={models.otpModalVisible}
          onOTPVerified={operations.handleVerifyOTP}
          email={models.email}
          onCloseOTP={() => {
            onClose();
            onCloseOTP();
            operations.setOtpModalVisible(false);
          }}
          onClosePassModal={onClose}
        />
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFF',
  },
  header: {
    padding: scale(16),
    alignItems: 'flex-end',
    borderBottomWidth: 1,
    borderBottomColor: '#EEE',
  },
  content: {
    flex: 1,
    paddingHorizontal: scale(20),
  },
  title: {
    fontSize: scale(24),
    fontWeight: 'bold',
    color: '#0089FF',
    marginBottom: scale(16),
  },
  subtitle: {
    fontSize: scale(16),
    color: '#666',
    marginBottom: scale(24),
  },
  highlight: {
    color: '#0089FF',
    fontWeight: '500',
  },
  inputContainer: {
    gap: scale(16),
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#0089FF',
    borderRadius: scale(8),
    paddingHorizontal: scale(16),
    backgroundColor: '#FFF',
  },
  input: {
    flex: 1,
    paddingVertical: scale(12),
    fontSize: scale(16),
    color: '#000',
  },
  requirements: {
    backgroundColor: '#F5F5F5',
    padding: scale(16),
    borderRadius: scale(8),
  },
  requirementsTitle: {
    fontSize: scale(14),
    fontWeight: '500',
    color: '#666',
    marginBottom: scale(8),
  },
  requirementRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: scale(8),
  },
  requirementText: {
    fontSize: scale(14),
    color: '#666',
    marginLeft: scale(8),
  },
  requirementMet: {
    color: '#4CAF50',
    textDecorationLine: 'line-through',
  },
  footer: {
    marginTop: 'auto', // This pushes the button to the bottom
    padding: scale(20),
  },
  button: {
    backgroundColor: '#0089FF',
    borderRadius: scale(8),
    padding: scale(16),
    alignItems: 'center',
  },
  buttonText: {
    color: '#FFF',
    fontSize: scale(16),
    fontWeight: '600',
  },
});

export default RegisterPassModal;
