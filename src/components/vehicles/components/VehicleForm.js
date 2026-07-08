import React from 'react';
import { View, Text, TextInput, Switch, StyleSheet, ScrollView } from 'react-native';
import Animated, { FadeInDown, FadeInUp } from 'react-native-reanimated';
import { scale } from 'react-native-size-matters';
import Icon from 'react-native-vector-icons/MaterialIcons';
import * as Haptics from 'expo-haptics';
import { ScalePressable } from '../../common/ScalePressable';
import { colors, shadows, borderRadius, spacing } from '../../../theme';
import { useAlert } from '../../../context/AlertContext';

const FIELDS = [
  { key: 'brand', label: 'Marca', placeholder: 'Ex: Toyota', autoCapitalize: 'words' },
  { key: 'model', label: 'Modelo', placeholder: 'Ex: Corolla', autoCapitalize: 'words' },
  { key: 'license', label: 'Matrícula', placeholder: 'LD-00-00', autoCapitalize: 'characters' },
  { key: 'color', label: 'Cor', placeholder: 'Ex: Branco', autoCapitalize: 'words' },
];

const VehicleForm = ({ state, updateCurrentVehicle, saveVehicle, deleteVehicle, onClose }) => {
  const { showAlert } = useAlert();
  const isEdit = state.mode === 'edit';
  const { currentVehicle } = state;

  const canSave =
    currentVehicle.brand.trim() &&
    currentVehicle.model.trim() &&
    currentVehicle.color.trim() &&
    /^[A-Z0-9-]{5,9}$/.test(currentVehicle.license.trim().toUpperCase());

  const handleSave = async () => {
    try {
      await saveVehicle();
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});
    } catch (error) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error).catch(() => {});
      showAlert({ type: 'error', title: 'Erro', message: 'Não foi possível guardar o veículo. Tente novamente.' });
    }
  };

  const handleDelete = () => {
    showAlert({
      type: 'warning',
      title: 'Confirmar',
      message: 'Deseja realmente excluir este veículo?',
      buttons: [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Excluir',
          style: 'destructive',
          onPress: async () => {
            try {
              await deleteVehicle(currentVehicle.id);
              Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});
            } catch (error) {
              showAlert({ type: 'error', title: 'Erro', message: 'Não foi possível excluir o veículo.' });
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
          <ScalePressable style={styles.deleteButton} onPress={handleDelete}>
            <Text style={styles.deleteText}>Apagar</Text>
          </ScalePressable>
        )}
      </View>

      <ScrollView style={styles.scroll} showsVerticalScrollIndicator={false}>
        <Animated.View entering={FadeInDown.delay(100).springify()}>
          <Text style={styles.title}>{isEdit ? 'EDITAR' : 'NOVO'} VEÍCULO</Text>
        </Animated.View>

        <View style={styles.grid}>
          {FIELDS.map((field, index) => (
            <Animated.View key={field.key} entering={FadeInDown.delay(150 + index * 50).springify()} style={styles.gridItem}>
              <Text style={styles.fieldLabel}>{field.label}</Text>
              <TextInput
                style={styles.input}
                placeholder={field.placeholder}
                placeholderTextColor={colors.textMuted}
                value={currentVehicle[field.key]}
                onChangeText={(text) => updateCurrentVehicle(field.key, text)}
                autoCapitalize={field.autoCapitalize}
              />
            </Animated.View>
          ))}
        </View>

        <Animated.View entering={FadeInDown.delay(380).springify()} style={styles.switchRow}>
          <Text style={styles.switchLabel}>Veículo padrão</Text>
          <Switch
            value={currentVehicle.isDefault}
            onValueChange={(value) => updateCurrentVehicle('isDefault', value)}
            trackColor={{ false: colors.borderLight, true: colors.primary }}
            thumbColor={colors.surface}
          />
        </Animated.View>
        {currentVehicle.isDefault && (
          <Text style={styles.switchHint}>Este veículo será pré-preenchido automaticamente ao solicitar um reboque.</Text>
        )}
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
  deleteButton: { paddingHorizontal: spacing.sm, paddingVertical: spacing.xs },
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
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.md },
  gridItem: { width: '48%' },
  fieldLabel: { fontSize: scale(13), fontWeight: '600', color: colors.textSecondary, marginBottom: spacing.xs },
  input: {
    backgroundColor: colors.surface,
    borderRadius: borderRadius.lg,
    borderWidth: 1,
    borderColor: colors.borderLight,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md,
    fontSize: scale(15),
    color: colors.textPrimary,
    ...shadows.sm,
  },
  switchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: colors.surface,
    borderRadius: borderRadius.lg,
    padding: spacing.lg,
    marginTop: spacing.lg,
    ...shadows.sm,
  },
  switchLabel: { fontSize: scale(15), fontWeight: '600', color: colors.textPrimary },
  switchHint: { fontSize: scale(12), color: colors.textMuted, marginTop: spacing.sm, marginHorizontal: spacing.xs },
  footer: { paddingHorizontal: spacing.xl, paddingBottom: spacing.xxl, paddingTop: spacing.md },
  saveButton: {
    backgroundColor: colors.primary,
    borderRadius: borderRadius.xl,
    paddingVertical: spacing.lg,
    alignItems: 'center',
    ...shadows.primaryGlow,
  },
  saveButtonDisabled: { backgroundColor: colors.textDisabled, shadowOpacity: 0, elevation: 0 },
  saveButtonText: { color: colors.surface, fontWeight: '700', fontSize: scale(15), letterSpacing: 0.5 },
});

export default VehicleForm;
