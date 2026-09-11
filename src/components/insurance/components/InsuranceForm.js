import React from 'react';
import { View, Text, TextInput, StyleSheet, ScrollView } from 'react-native';
import Animated, { FadeInDown, FadeInUp } from 'react-native-reanimated';
import { scale } from 'react-native-size-matters';
import MaterialIcons from '@expo/vector-icons/MaterialIcons';
const Icon = MaterialIcons;
import * as Haptics from 'expo-haptics';
import { ScalePressable } from '../../common/ScalePressable';
import { colors, shadows, borderRadius, spacing } from '../../../theme';
import { useAlert } from '../../../context/AlertContext';

const InsuranceForm = ({ state, updateCurrentInsurance, saveInsuranceRecord, deleteInsuranceRecord, onClose }) => {
  const { showAlert } = useAlert();
  const isEdit = state.mode === 'edit';
  const { currentInsurance } = state;

  const canSave =
    currentInsurance.company.trim().length > 0 &&
    currentInsurance.policyNumber.trim().length > 0 &&
    currentInsurance.vehicleLicense.trim().length > 0;

  // Name the missing field instead of leaving GUARDAR inert with no reason.
  const missingFields = [
    !currentInsurance.company.trim() && 'Seguradora',
    !currentInsurance.policyNumber.trim() && 'Número de Apólice',
    !currentInsurance.vehicleLicense.trim() && 'Matrícula do Veículo',
  ].filter(Boolean);
  const hasStarted =
    currentInsurance.company.length > 0 ||
    currentInsurance.policyNumber.length > 0 ||
    currentInsurance.vehicleLicense.length > 0;

  const handleSave = async () => {
    try {
      await saveInsuranceRecord();
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});
    } catch (error) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error).catch(() => {});
      showAlert({ type: 'error', title: 'Erro', message: 'Não foi possível guardar o seguro. Tente novamente.' });
    }
  };

  const handleDelete = () => {
    showAlert({
      type: 'warning',
      title: 'Confirmar',
      message: 'Deseja realmente excluir este seguro?',
      buttons: [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Excluir',
          style: 'destructive',
          onPress: async () => {
            try {
              await deleteInsuranceRecord(currentInsurance.id);
              Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});
            } catch (error) {
              showAlert({ type: 'error', title: 'Erro', message: 'Não foi possível excluir o seguro.' });
            }
          },
        },
      ],
    });
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <ScalePressable style={styles.closeButton} onPress={onClose}>
          <Icon name="close" size={scale(22)} color={colors.textPrimary} />
        </ScalePressable>
        {isEdit && (
          <ScalePressable style={styles.deleteButtonWrap} onPress={handleDelete}>
            <Text style={styles.deleteText}>Apagar</Text>
          </ScalePressable>
        )}
      </View>

      <ScrollView style={styles.scroll} showsVerticalScrollIndicator={false}>
        <Animated.View entering={FadeInDown.delay(100).springify()}>
          <Text style={styles.title}>{isEdit ? 'EDITAR' : 'NOVO'} SEGURO</Text>
        </Animated.View>

        {[
          { key: 'company', label: 'Seguradora', placeholder: 'Ex: ENSA, AAA Seguros', autoCapitalize: 'words' },
          { key: 'policyNumber', label: 'Número de Apólice', placeholder: 'Ex: AP-2024-001234', autoCapitalize: 'characters' },
          { key: 'vehicleLicense', label: 'Matrícula do Veículo', placeholder: 'LD-00-00', autoCapitalize: 'characters' },
        ].map((field, index) => (
          <Animated.View key={field.key} entering={FadeInDown.delay(150 + index * 60).springify()} style={styles.fieldGroup}>
            <Text style={styles.fieldLabel}>{field.label}</Text>
            <TextInput
              style={styles.input}
              placeholder={field.placeholder}
              placeholderTextColor={colors.textMuted}
              value={currentInsurance[field.key]}
              onChangeText={(text) => updateCurrentInsurance(field.key, text)}
              autoCapitalize={field.autoCapitalize}
            />
          </Animated.View>
        ))}
        {hasStarted && missingFields.length > 0 ? (
          <Text style={styles.formError}>
            {`Preencha ${missingFields.join(', ')} para guardar`}
          </Text>
        ) : null}
      </ScrollView>

      <Animated.View entering={FadeInUp.delay(400).springify()} style={styles.footer}>
        <ScalePressable
          style={[styles.saveButton, !canSave && styles.saveButtonDisabled]}
          onPress={handleSave}
          disabled={state.isLoading || !canSave}
        >
          <Text style={styles.saveButtonText}>
            {state.isLoading ? 'A GUARDAR...' : 'GUARDAR'}
          </Text>
        </ScalePressable>
      </Animated.View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: spacing.modalSafeTop,
    paddingHorizontal: spacing.xl,
    paddingBottom: spacing.lg,
  },
  closeButton: {
    width: scale(40),
    height: scale(40),
    borderRadius: borderRadius.full,
    backgroundColor: colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
    ...shadows.sm,
  },
  deleteButtonWrap: { paddingHorizontal: spacing.sm, paddingVertical: spacing.xs },
  deleteText: { fontWeight: '600', color: colors.error, fontSize: scale(14) },
  scroll: { flex: 1, paddingHorizontal: spacing.xl },
  title: {
    fontSize: scale(18),
    fontWeight: '700',
    color: colors.textPrimary,
    textAlign: 'center',
    marginBottom: spacing.xxl,
    letterSpacing: 0.5,
  },
  fieldGroup: { marginBottom: spacing.lg },
  formError: { color: colors.error, fontSize: scale(13), marginTop: scale(4), marginLeft: scale(4) },
  fieldLabel: { fontSize: scale(13), fontWeight: '600', color: colors.textSecondary, marginBottom: spacing.xs },
  input: {
    backgroundColor: colors.surface,
    borderRadius: borderRadius.lg,
    borderWidth: 1,
    borderColor: colors.borderLight,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    fontSize: scale(15),
    color: colors.textPrimary,
    ...shadows.sm,
  },
  footer: { paddingHorizontal: spacing.xl, paddingBottom: spacing.xxl, paddingTop: spacing.md },
  saveButton: {
    backgroundColor: colors.success,
    borderRadius: borderRadius.xl,
    paddingVertical: spacing.lg,
    alignItems: 'center',
  },
  saveButtonDisabled: { backgroundColor: colors.textDisabled },
  saveButtonText: { color: colors.surface, fontWeight: '700', fontSize: scale(15), letterSpacing: 0.5 },
});

export default InsuranceForm;
