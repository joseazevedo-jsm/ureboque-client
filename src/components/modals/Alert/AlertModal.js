import React from 'react';
import {
  Modal,
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
} from 'react-native';
import { BlurView } from 'expo-blur';
import Icon from 'react-native-vector-icons/MaterialIcons';
import { scale } from 'react-native-size-matters';
import { colors, spacing, borderRadius, typography, shadows } from '../../../theme';

const TYPE_CONFIG = {
  error: { icon: 'error-outline', color: colors.error, bg: colors.errorLight },
  success: { icon: 'check-circle-outline', color: colors.success, bg: colors.successLight },
  warning: { icon: 'warning-amber', color: colors.warning, bg: colors.warningLight },
  info: { icon: 'info-outline', color: colors.primary, bg: colors.primaryLight },
  confirmation: { icon: 'help-outline', color: colors.primary, bg: colors.primaryLight },
};

const AlertModal = ({ visible, type = 'info', title, message, buttons = [], onDismiss }) => {
  const config = TYPE_CONFIG[type] || TYPE_CONFIG.info;

  const renderButton = (button, index) => {
    const style = button.style || 'default';
    const isCancel = style === 'cancel';
    const isDestructive = style === 'destructive';

    return (
      <TouchableOpacity
        key={index}
        style={[
          styles.button,
          isCancel && styles.buttonCancel,
          isDestructive && styles.buttonDestructive,
          !isCancel && !isDestructive && styles.buttonPrimary,
          buttons.length === 1 && styles.buttonFull,
        ]}
        onPress={() => onDismiss(button.onPress)}
        activeOpacity={0.8}
      >
        <Text
          style={[
            styles.buttonText,
            isCancel && styles.buttonTextCancel,
          ]}
        >
          {button.text || 'OK'}
        </Text>
      </TouchableOpacity>
    );
  };

  return (
    <Modal
      transparent
      visible={visible}
      animationType="fade"
      statusBarTranslucent
      onRequestClose={() => onDismiss()}
    >
      <BlurView tint="dark" intensity={40} style={styles.overlay}>
        <View style={styles.card}>
          <View style={[styles.iconCircle, { backgroundColor: config.bg }]}>
            <Icon name={config.icon} size={scale(32)} color={config.color} />
          </View>

          {title ? <Text style={styles.title}>{title}</Text> : null}
          {message ? <Text style={styles.message}>{message}</Text> : null}

          <View style={[styles.buttonRow, buttons.length === 1 && styles.buttonRowSingle]}>
            {buttons.map(renderButton)}
          </View>
        </View>
      </BlurView>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: spacing.xxl,
  },
  card: {
    backgroundColor: colors.surface,
    borderRadius: borderRadius.xl,
    paddingTop: spacing.xxl,
    paddingBottom: spacing.lg,
    paddingHorizontal: spacing.xxl,
    alignItems: 'center',
    width: '100%',
    maxWidth: scale(320),
    ...shadows.lg,
  },
  iconCircle: {
    width: scale(64),
    height: scale(64),
    borderRadius: scale(32),
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: spacing.lg,
  },
  title: {
    ...typography.h3,
    textAlign: 'center',
    marginBottom: spacing.sm,
  },
  message: {
    ...typography.bodySmall,
    textAlign: 'center',
    marginBottom: spacing.xl,
    lineHeight: scale(20),
  },
  buttonRow: {
    flexDirection: 'row',
    gap: spacing.sm,
    width: '100%',
  },
  buttonRowSingle: {
    justifyContent: 'center',
  },
  button: {
    flex: 1,
    paddingVertical: spacing.md,
    borderRadius: borderRadius.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  buttonFull: {
    flex: 0,
    paddingHorizontal: spacing.xxxl,
  },
  buttonPrimary: {
    backgroundColor: colors.primary,
  },
  buttonDestructive: {
    backgroundColor: colors.error,
  },
  buttonCancel: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.borderLight,
  },
  buttonText: {
    color: colors.surface,
    fontSize: scale(14),
    fontWeight: '600',
  },
  buttonTextCancel: {
    color: colors.textSecondary,
  },
});

export default AlertModal;
