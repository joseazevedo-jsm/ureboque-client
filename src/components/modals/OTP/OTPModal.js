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
    backgroundColor: "rgba(0, 0, 0, 0.5)",
  },
  modalContent: {
    backgroundColor: "#fff",
    borderRadius: scale(20),
    padding: scale(24),
    width: "85%",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.15,
    shadowRadius: 24,
    elevation: 10,
  },
  title: {
    fontSize: scale(20),
    fontWeight: "700",
    marginBottom: scale(10),
    textAlign: "center",
    color: "#1E293B",
  },
  description: {
    fontSize: scale(14),
    marginBottom: scale(20),
    textAlign: "center",
    color: "#64748B",
  },
  verifyingContainer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: scale(15),
    paddingHorizontal: scale(10),
    paddingVertical: scale(10),
    backgroundColor: "#F8FAFC",
    borderRadius: scale(12),
  },
  verifyingText: {
    fontSize: scale(14),
    color: "#64748B",
    marginLeft: scale(8),
    fontWeight: "500",
  },
  otpInputs: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: scale(20),
    paddingHorizontal: scale(10),
  },
  otpInput: {
    borderWidth: 1,
    borderColor: "rgba(0,0,0,0.05)",
    borderRadius: scale(12),
    padding: scale(12),
    fontSize: scale(20),
    textAlign: "center",
    width: scale(50),
    height: scale(55),
    backgroundColor: "#fff",
    color: "#1E293B",
    fontWeight: "600",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.03,
    shadowRadius: 6,
    elevation: 2,
  },
  otpInputDisabled: {
    backgroundColor: "#F8FAFC",
    borderColor: "#E2E8F0",
    color: "#94A3B8",
  },
  resendButton: {
    backgroundColor: "#0089FF",
    padding: scale(14),
    borderRadius: scale(14),
    alignItems: "center",
    marginBottom: scale(12),
    shadowColor: "#0089FF",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
  },
  resendButtonText: {
    color: "#fff",
    fontSize: scale(15),
    fontWeight: "600",
  },
  closeButton: {
    padding: scale(14),
    borderRadius: scale(14),
    alignItems: "center",
    backgroundColor: "#fff",
    borderWidth: 1,
    borderColor: "rgba(0,0,0,0.05)",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.03,
    shadowRadius: 6,
    elevation: 2,
  },
  closeButtonDisabled: {
    backgroundColor: "#F8FAFC",
    borderColor: "#E2E8F0",
    opacity: 0.6,
    shadowOpacity: 0,
    elevation: 0,
  },
  closeButtonText: {
    fontSize: scale(15),
    color: "#0089FF",
    fontWeight: "600",
  },
  closeButtonTextDisabled: {
    color: "#94A3B8",
  },
});

export default OTPModal;
