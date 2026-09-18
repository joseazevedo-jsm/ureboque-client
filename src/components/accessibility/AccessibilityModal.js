import React from 'react';
import { Modal, View, Switch, ScrollView, StyleSheet } from 'react-native';
import { AppText as Text, AppTextInput as TextInput } from '../common/AppText';
import { AppPressable as TouchableOpacity } from '../common/AppPressable';
import { AppHeader } from '../common/AppHeader';

import Animated, { FadeInDown, FadeInUp } from 'react-native-reanimated';
import { scale } from 'react-native-size-matters';
import MaterialIcons from '@expo/vector-icons/MaterialIcons';
const Icon = MaterialIcons;
import * as Haptics from 'expo-haptics';
import { ScalePressable } from '../common/ScalePressable';
import { useAccessibility } from './hooks/useAccessibility';
import { useAlert } from '../../context/AlertContext';
import { colors, shadows, spacing, borderRadius, sizes, typography } from '../../theme';

const ACCESSIBILITY_OPTIONS = [
  { key: 'wheelchair', label: 'Cadeira de rodas', description: 'Necessita de acesso para cadeira de rodas', icon: 'accessible' },
  { key: 'deaf', label: 'Deficiência auditiva', description: 'Comunicação via texto preferida', icon: 'hearing' },
  { key: 'pregnant', label: 'Grávida', description: 'Requer cuidados especiais', icon: 'pregnant-woman' },
  { key: 'visualImpairment', label: 'Deficiência visual', description: 'Necessita de assistência adicional', icon: 'visibility-off' },
];

const ToggleRow = ({ icon, label, description, value, onToggle, disabled }) => (
  <View style={styles.toggleRow}>
    <View style={styles.toggleIcon}>
      <Icon name={icon} size={sizes.icon} color={value ? colors.primary : colors.textMuted} />
    </View>
    <View style={styles.toggleContent}>
      <Text style={[styles.toggleLabel, value && styles.toggleLabelActive]}>{label}</Text>
      {description ? <Text style={styles.toggleDescription}>{description}</Text> : null}
    </View>
    <Switch
      value={value}
      onValueChange={onToggle}
      disabled={disabled}
      trackColor={{ false: colors.borderLight, true: colors.primary }}
      thumbColor={colors.surface}
    />
  </View>
);

const AccessibilityModal = ({ visible, onClose }) => {
  const { state, toggleField, setCustomText, saveCustomText } = useAccessibility();
  const { showAlert } = useAlert();
  const { accessibility, isLoading } = state;

  const handleToggle = async (field) => {
    try {
      await toggleField(field);
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
    } catch (error) {
      showAlert({ type: 'error', title: 'Erro', message: 'Não foi possível guardar a alteração.' });
    }
  };

  const handleSaveCustomText = async () => {
    try {
      await saveCustomText();
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});
    } catch (error) {
      showAlert({ type: 'error', title: 'Erro', message: 'Não foi possível guardar.' });
    }
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      onRequestClose={onClose}
    >
      <View style={styles.safe}>
        <AppHeader
          title="Acessibilidade"
          subtitle="Informe o condutor das suas necessidades."
          leftIcon="close"
          leftLabel="Fechar acessibilidade"
          onLeftPress={onClose}
        />

        <ScrollView style={styles.scroll} showsVerticalScrollIndicator={false}>
          <Animated.View entering={FadeInDown.delay(100).springify()}>
            <Text style={styles.sectionTitle}>NECESSIDADES ESPECIAIS</Text>
          </Animated.View>

          {ACCESSIBILITY_OPTIONS.map((option, index) => (
            <Animated.View key={option.key} entering={FadeInDown.delay(130 + index * 50).springify()}>
              <ToggleRow
                icon={option.icon}
                label={option.label}
                description={option.description}
                value={accessibility[option.key]}
                onToggle={() => handleToggle(option.key)}
                disabled={isLoading}
              />
            </Animated.View>
          ))}

          <Animated.View entering={FadeInDown.delay(380).springify()} style={styles.divider} />

          <Animated.View entering={FadeInDown.delay(420).springify()}>
            <Text style={styles.sectionTitle}>NECESSIDADE PERSONALIZADA</Text>
          </Animated.View>

          <Animated.View entering={FadeInDown.delay(460).springify()}>
            <ToggleRow
              icon="tune"
              label="Necessidade personalizada"
              description="Adicionar descrição própria"
              value={accessibility.customEnabled}
              onToggle={() => handleToggle('customEnabled')}
              disabled={isLoading}
            />
          </Animated.View>

          {accessibility.customEnabled && (
            <Animated.View entering={FadeInDown.delay(100).springify()} style={styles.customTextContainer}>
              <TextInput
                style={styles.customTextInput}
                placeholder="Descreva a sua necessidade especial..."
                placeholderTextColor={colors.textMuted}
                value={accessibility.customText}
                onChangeText={setCustomText}
                multiline
                numberOfLines={4}
                textAlignVertical="top"
              />
              <Animated.View entering={FadeInUp.delay(150).springify()}>
                <ScalePressable
                  style={[styles.saveCustomButton, isLoading && styles.saveCustomButtonDisabled]}
                  onPress={handleSaveCustomText}
                  disabled={isLoading}
                >
                  <Text style={styles.saveCustomButtonText}>
                    {isLoading ? 'A GUARDAR...' : 'GUARDAR DESCRIÇÃO'}
                  </Text>
                </ScalePressable>
              </Animated.View>
            </Animated.View>
          )}

          <View style={styles.bottomPad} />
        </ScrollView>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.background },
  scroll: { flex: 1, paddingHorizontal: spacing.lg },
  sectionTitle: {
    fontSize: typography.caption.fontSize, lineHeight: typography.caption.lineHeight,
    fontWeight: '700',
    color: colors.textMuted,
    letterSpacing: 1,
    marginTop: spacing.lg,
    marginBottom: spacing.sm,
    marginLeft: spacing.xs,
  },
  toggleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderRadius: borderRadius.lg,
    padding: spacing.lg,
    marginBottom: spacing.sm,
    ...shadows.sm,
  },
  toggleIcon: {
    width: scale(38),
    height: scale(38),
    borderRadius: borderRadius.md,
    backgroundColor: colors.background,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: spacing.md,
  },
  toggleContent: { flex: 1 },
  toggleLabel: { fontSize: typography.bodySmall.fontSize, lineHeight: typography.bodySmall.lineHeight, fontWeight: '600', color: colors.textPrimary },
  toggleLabelActive: { color: colors.primary },
  toggleDescription: { fontSize: typography.caption.fontSize, lineHeight: typography.caption.lineHeight, color: colors.textMuted, marginTop: spacing.xs },
  divider: { height: 1, backgroundColor: colors.borderLight, marginVertical: spacing.lg },
  customTextContainer: { marginTop: spacing.sm },
  customTextInput: {
    backgroundColor: colors.surface,
    borderRadius: borderRadius.lg,
    borderWidth: 1,
    borderColor: colors.borderLight,
    padding: spacing.lg,
    fontSize: typography.bodySmall.fontSize, lineHeight: typography.bodySmall.lineHeight,
    color: colors.textPrimary,
    minHeight: scale(100),
    ...shadows.sm,
  },
  saveCustomButton: {
    backgroundColor: colors.primary,
    borderRadius: borderRadius.xl,
    paddingVertical: spacing.lg,
    alignItems: 'center',
    marginTop: spacing.md,
    ...shadows.primaryGlow,
  },
  saveCustomButtonDisabled: { backgroundColor: colors.textDisabled, shadowOpacity: 0, elevation: 0 },
  saveCustomButtonText: { color: colors.surface, fontWeight: '700', fontSize: typography.bodySmall.fontSize, lineHeight: typography.bodySmall.lineHeight, letterSpacing: 0.5 },
  bottomPad: { height: spacing.xxxl },
});

export default AccessibilityModal;
