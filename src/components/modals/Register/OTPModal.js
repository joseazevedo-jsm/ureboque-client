import React, { useState, useRef, useEffect } from "react";
import {
  Modal,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
  ActivityIndicator,
} from "react-native";
import { scale } from "react-native-size-matters";
import { useRegisterModal } from "./components/useRegisterModal";

const OTPModal = ({ visible, OTPChange, number, isLoading }) => {
  const { models, operations } = useRegisterModal(OTPChange);

  useEffect(() => {
    // Auto-focus on the first input when the modal opens
    if (visible) {
      models.inputRefs.current[0].focus();
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

          <View style={styles.otpInputs}>
            {models.otp.map((digit, index) => (
              <TextInput
                key={index}
                ref={(ref) => (models.inputRefs.current[index] = ref)}
                style={styles.otpInput}
                keyboardType="numeric"
                maxLength={1}
                value={digit}
                onChangeText={(text) => operations.handleOtpChange(text, index)}
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

          <TouchableOpacity style={styles.closeButton}>
            {/* CHANGE TO MAKE onClose WORK  onPress={onClose} */}
            <Text style={styles.closeButtonText}>Fechar</Text>
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
  closeButtonText: {
    fontSize: scale(14),
    color: "#0089FF",
  },
});

export default OTPModal;
