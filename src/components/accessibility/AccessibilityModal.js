import React from 'react';
import {
  Modal, View, Text, TextInput,
  Switch, ScrollView, StyleSheet, TouchableOpacity,
} from 'react-native';
import Animated, { FadeInDown, FadeInUp } from 'react-native-reanimated';
import { scale } from 'react-native-size-matters';
import Icon from 'react-native-vector-icons/MaterialIcons';
import * as Haptics from 'expo-haptics';
import { ScalePressable } from '../common/ScalePressable';
import { useAccessibility } from './hooks/useAccessibility';
import { useAlert } from '../../context/AlertContext';
import { colors, shadows, spacing, borderRadius } from '../../theme';

const ACCESSIBILITY_OPTIONS = [
  { key: 'wheelchair', label: 'Cadeira de rodas', description: 'Necessita de acesso para cadeira de rodas', icon: 'accessible' },
  { key: 'deaf', label: 'Deficiência auditiva', description: 'Comunicação via texto preferida', icon: 'hearing' },
  { key: 'pregnant', label: 'Grávida', description: 'Requer cuidados especiais', icon: 'pregnant-woman' },
  { key: 'visualImpairment', label: 'Deficiência visual', description: 'Necessita de assistência adicional', icon: 'visibility-off' },
];

const ToggleRow = ({ icon, label, description, value, onToggle, disabled }) => (
  <View style={styles.toggleRow}>
    <View style={styles.toggleIcon}>
      <Icon name={icon} size={scale(22)} color={value ? colors.primary : colors.textMuted} />
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
        <Animated.View entering={FadeInDown.delay(50).springify()} style={styles.header}>
          <TouchableOpacity style={styles.circleButton} onPress={onClose} activeOpacity={0.75}>
            <Icon name="close" size={scale(20)} color={colors.textPrimary} />
          </TouchableOpacity>
          <View style={styles.headerCenter}>
            <Text style={styles.title}>Acessibilidade</Text>
            <Text style={styles.subtitle}>Informe o condutor das suas necessidades.</Text>
          </View>
          <View style={styles.headerSpacer} />
        </Animated.View>

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
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: spacing.modalSafeTop,
    paddingHorizontal: spacing.xl,
    paddingBottom: spacing.lg,
  },
  circleButton: {
    width: scale(40),
    height: scale(40),
    borderRadius: borderRadius.full,
    backgroundColor: colors.surface,
    justifyContent: 'center',
    alignItems: 'center',
    ...shadows.sm,
  },
  headerSpacer: {
    width: scale(40),
    height: scale(40),
  },
  headerCenter: { flex: 1, alignItems: 'center', paddingHorizontal: spacing.sm },
  title: { fontSize: scale(18), fontWeight: '800', color: colors.textPrimary },
  subtitle: { fontSize: scale(13), color: colors.textSecondary, marginTop: scale(2), textAlign: 'center' },
  scroll: { flex: 1, paddingHorizontal: spacing.lg },
  sectionTitle: {
    fontSize: scale(12),
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
  toggleLabel: { fontSize: scale(15), fontWeight: '600', color: colors.textPrimary },
  toggleLabelActive: { color: colors.primary },
  toggleDescription: { fontSize: scale(12), color: colors.textMuted, marginTop: scale(2) },
  divider: { height: 1, backgroundColor: colors.borderLight, marginVertical: spacing.lg },
  customTextContainer: { marginTop: spacing.sm },
  customTextInput: {
    backgroundColor: colors.surface,
    borderRadius: borderRadius.lg,
    borderWidth: 1,
    borderColor: colors.borderLight,
    padding: spacing.lg,
    fontSize: scale(15),
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
  saveCustomButtonText: { color: colors.surface, fontWeight: '700', fontSize: scale(14), letterSpacing: 0.5 },
  bottomPad: { height: spacing.xxxl },
});

export default AccessibilityModal;
