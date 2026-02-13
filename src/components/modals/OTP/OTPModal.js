import React, { useEffect } from "react";
import {
  ActivityIndicator,
  Modal,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { scale } from "react-native-size-matters";
import { useOTPModal } from "./components/useOTPModal";
import { colors, spacing, shadows, borderRadius } from "../../../theme";

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
    backgroundColor: colors.overlay,
  },
  modalContent: {
    backgroundColor: colors.surface,
    borderRadius: borderRadius.xxl,
    padding: spacing.xxl,
    width: "85%",
    ...shadows.lg,
  },
  title: {
    fontSize: scale(20),
    fontWeight: "700",
    marginBottom: spacing.sm,
    textAlign: "center",
    color: colors.textPrimary,
  },
  description: {
    fontSize: scale(14),
    marginBottom: spacing.xl,
    textAlign: "center",
    color: colors.textSecondary,
  },
  verifyingContainer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: spacing.lg,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.sm,
    backgroundColor: colors.background,
    borderRadius: borderRadius.md,
  },
  verifyingText: {
    fontSize: scale(14),
    color: colors.textSecondary,
    marginLeft: spacing.sm,
    fontWeight: "500",
  },
  otpInputs: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: spacing.xl,
    paddingHorizontal: spacing.sm,
  },
  otpInput: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: borderRadius.md,
    padding: spacing.md,
    fontSize: scale(20),
    textAlign: "center",
    width: scale(50),
    height: scale(55),
    backgroundColor: colors.surface,
    color: colors.textPrimary,
    fontWeight: "600",
    ...shadows.sm,
  },
  otpInputDisabled: {
    backgroundColor: colors.background,
    borderColor: colors.borderLight,
    color: colors.textMuted,
  },
  resendButton: {
    backgroundColor: colors.primary,
    padding: scale(14),
    borderRadius: borderRadius.lg,
    alignItems: "center",
    marginBottom: spacing.md,
    ...shadows.primaryGlow,
  },
  resendButtonText: {
    color: colors.surface,
    fontSize: scale(15),
    fontWeight: "600",
  },
  closeButton: {
    padding: scale(14),
    borderRadius: borderRadius.lg,
    alignItems: "center",
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    ...shadows.sm,
  },
  closeButtonDisabled: {
    backgroundColor: colors.background,
    borderColor: colors.borderLight,
    opacity: 0.6,
    shadowOpacity: 0,
    elevation: 0,
  },
  closeButtonText: {
    fontSize: scale(15),
    color: colors.primary,
    fontWeight: "600",
  },
  closeButtonTextDisabled: {
    color: colors.textMuted,
  },
});

export default OTPModal;
