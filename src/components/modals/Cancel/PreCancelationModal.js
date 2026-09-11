import React from "react";
import { Modal, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { scale } from "react-native-size-matters";
import { BlurView } from "expo-blur";
import MaterialIcons from "@expo/vector-icons/MaterialIcons";
const Icon = MaterialIcons;
import { colors, spacing, borderRadius, shadows, typography } from "../../../theme";
import Animated, { FadeInUp } from "react-native-reanimated";

const PreCancelationModal = ({ visible, closeModal, onPressCancel }) => {
  return (
    <Modal
      visible={visible}
      onRequestClose={closeModal}
      transparent={true}
      animationType="fade"
      statusBarTranslucent
    >
      <BlurView style={styles.overlay} tint="dark" intensity={40}>
        <Animated.View entering={FadeInUp.springify().damping(28).stiffness(180)} style={styles.card}>
          <View style={styles.iconCircle}>
            <Icon name="warning-amber" size={scale(32)} color={colors.warning} />
          </View>

          <Text style={styles.title}>Cancelar Viagem</Text>

          <Text style={styles.message}>
            Seu motorista já viajou por vários minutos. Se você cancelar esta
            viagem para solicitar uma nova imediatamente, poderá ter que esperar mais.
          </Text>

          <View style={styles.buttonContainer}>
            <TouchableOpacity
              style={styles.continueButton}
              onPress={closeModal}
              activeOpacity={0.8}
            >
              <Text style={styles.continueButtonText}>
                Continuar com este motorista
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.cancelButton}
              onPress={onPressCancel}
              activeOpacity={0.8}
            >
              <Text style={styles.cancelButtonText}>
                Confirmar cancelamento
              </Text>
            </TouchableOpacity>
          </View>
        </Animated.View>
      </BlurView>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: spacing.xxl,
  },
  card: {
    backgroundColor: colors.surface,
    borderRadius: borderRadius.xl,
    paddingTop: spacing.xxl,
    paddingBottom: spacing.lg,
    paddingHorizontal: spacing.xxl,
    alignItems: "center",
    width: "100%",
    maxWidth: scale(320),
    ...shadows.lg,
  },
  iconCircle: {
    width: scale(64),
    height: scale(64),
    borderRadius: scale(32),
    backgroundColor: colors.warningLight,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: spacing.lg,
  },
  title: {
    ...typography.h3,
    textAlign: "center",
    marginBottom: spacing.sm,
  },
  message: {
    ...typography.bodySmall,
    textAlign: "center",
    marginBottom: spacing.xl,
    lineHeight: scale(20),
  },
  buttonContainer: {
    width: "100%",
    gap: spacing.sm,
  },
  continueButton: {
    backgroundColor: colors.primary,
    paddingVertical: spacing.md,
    borderRadius: borderRadius.md,
    alignItems: "center",
    ...shadows.primaryGlow,
  },
  continueButtonText: {
    color: colors.surface,
    fontSize: scale(14),
    fontWeight: "600",
  },
  cancelButton: {
    backgroundColor: colors.surface,
    paddingVertical: spacing.md,
    borderRadius: borderRadius.md,
    alignItems: "center",
    borderWidth: 1,
    borderColor: colors.error,
  },
  cancelButtonText: {
    color: colors.error,
    fontSize: scale(14),
    fontWeight: "600",
  },
});

export default PreCancelationModal;
