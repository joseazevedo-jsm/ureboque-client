import React, { useEffect, useRef } from "react";
import {
  ActivityIndicator,
  Image,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";

import { scale } from "react-native-size-matters";
import { Modal } from "react-native";
import { useOTPModal } from "./components/useOTPModal";

const OTPModal = ({
  visible,
  OTPChange,
  number,
  isLoading,
  onClose
}) => {
  const {models, operations} = useOTPModal(OTPChange)

  
  useEffect(() => {
    if (visible) {
      // Clear OTP fields when modal opens to ensure fresh start
      operations.resetOtp();
      // Auto-focus on the first input after a small delay
      setTimeout(() => {
        if (models.inputRefs.current[0]) {
          models.inputRefs.current[0].focus();
        }
      }, 100);
    }
  }, [visible]);

  return (
    <Modal visible={visible} animationType="slide" transparent>
      <View style={styles.modalContainer}>
        <View style={styles.modalContent}>
          <Text style={styles.title}>Verificação de Código</Text>
          <Text style={styles.description}>
            Digite o código de 4 dígitos enviado para {number}
          </Text>
          
          {isLoading && (
            <View style={styles.verifyingContainer}>
              <ActivityIndicator size="small" color="#0089FF" />
              <Text style={styles.verifyingText}>Verificando código...</Text>
            </View>
          )}

          <View style={styles.otpInputs}>
            {models.otp.map((digit, index) => (
              <TextInput
                key={index}
                ref={(ref) => (models.inputRefs.current[index] = ref)}
                style={[styles.otpInput, isLoading && styles.otpInputDisabled]}
                keyboardType="numeric"
                maxLength={1}
                value={digit}
                onChangeText={(text) => operations.handleOtpChange(text, index)}
                onKeyPress={(e) => operations.handleKeyPress(e, index)}
                editable={!isLoading}
              />
            ))}
          </View>

          <TouchableOpacity
            style={styles.resendButton}
            onPress={operations.handleResend}
            disabled={isLoading}
          >
            {isLoading ? (
              <ActivityIndicator size="small" color="#fff" />
            ) : (
              <Text style={styles.resendButtonText}>Reenviar código</Text>
            )}
          </TouchableOpacity>

          <TouchableOpacity 
            style={[styles.closeButton, isLoading && styles.closeButtonDisabled]}
            onPress={() => {
              if (!isLoading) {
                operations.resetOtp();
                onClose();
              }
            }}
            disabled={isLoading}
            accessibilityLabel="Fechar modal OTP"
            accessibilityRole="button"
          >
            <Text style={[styles.closeButtonText, isLoading && styles.closeButtonTextDisabled]}>
              {isLoading ? "Verificando..." : "Fechar"}
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  modalContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "rgba(0, 0, 0, 0.5)", // Semi-transparent background
  },
  modalContent: {
    backgroundColor: "#fff",
    borderRadius: 10,
    padding: scale(20),
    width: "80%",
  },
  title: {
    fontSize: scale(20),
    fontWeight: "bold",
    marginBottom: scale(10),
    textAlign: "center",
    color: "#0089FF",
  },
  description: {
    fontSize: scale(14),
    marginBottom: scale(20),
    textAlign: "center",
  },
  verifyingContainer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: scale(15),
    paddingHorizontal: scale(10),
    paddingVertical: scale(8),
    backgroundColor: "#F7FAFC",
    borderRadius: 8,
  },
  verifyingText: {
    fontSize: scale(14),
    color: "#4A5568",
    marginLeft: scale(8),
    fontWeight: "500",
  },
  otpInputs: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: scale(20),
  },
  otpInput: {
    borderWidth: 1,
    borderColor: "#ccc",
    borderRadius: 5,
    padding: scale(10),
    fontSize: scale(18),
    textAlign: "center",
    width: scale(40),
  },
  otpInputDisabled: {
    backgroundColor: "#F7FAFC",
    borderColor: "#E2E8F0",
    color: "#A0AEC0",
  },
  resendButton: {
    backgroundColor: "#0089FF",
    padding: scale(10),
    borderRadius: 5,
    alignItems: "center",
    marginBottom: scale(10),
  },
  resendButtonText: {
    color: "#fff",
    fontSize: scale(14),
  },
  closeButton: {
    padding: scale(10),
    borderRadius: 5,
    alignItems: "center",
    borderColor: "#ccc",
    borderWidth: 1,
  },
  closeButtonDisabled: {
    backgroundColor: "#F7FAFC",
    borderColor: "#E2E8F0",
    opacity: 0.6,
  },
  closeButtonText: {
    fontSize: scale(14),
    color: "#0089FF",
  },
  closeButtonTextDisabled: {
    color: "#A0AEC0",
  },
});

export default OTPModal;
