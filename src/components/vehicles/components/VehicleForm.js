import React from 'react';
import { View, Switch, StyleSheet, ScrollView } from 'react-native';
import { AppText as Text, AppTextInput as TextInput } from '../../common/AppText';
import { AppHeader } from '../../common/AppHeader';
import { AppField } from '../../common/AppField';
import { AppButton } from '../../common/AppButton';

import Animated, { FadeInDown, FadeInUp } from 'react-native-reanimated';
import { scale } from 'react-native-size-matters';
import MaterialIcons from '@expo/vector-icons/MaterialIcons';
const Icon = MaterialIcons;
import * as Haptics from 'expo-haptics';
import { ScalePressable } from '../../common/ScalePressable';
import { componentStyles, sizes, colors, shadows, borderRadius, spacing, typography } from "../../../theme";
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

  // The licence rule in particular is invisible: without this the button just
  // stays inert and the user has no way to know what shape is expected.
  const licenseTyped = currentVehicle.license.length > 0;
  const licenseInvalid =
    licenseTyped && !/^[A-Z0-9-]{5,9}$/.test(currentVehicle.license.trim().toUpperCase());
  const missingFields = [
    !currentVehicle.brand.trim() && 'Marca',
    !currentVehicle.model.trim() && 'Modelo',
    !currentVehicle.color.trim() && 'Cor',
  ].filter(Boolean);
  const hasStarted =
    currentVehicle.brand.length > 0 ||
    currentVehicle.model.length > 0 ||
    currentVehicle.color.length > 0 ||
    licenseTyped;

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
      <AppHeader title={isEdit ? 'Editar veículo' : 'Novo veículo'} subtitle="Preencha os dados do veículo."
        leftIcon="close" leftLabel="Fechar veículo" onLeftPress={onClose}
        rightIcon={isEdit ? 'delete-outline' : undefined} rightLabel="Apagar veículo"
        rightColor={colors.error} onRightPress={handleDelete} />

      <ScrollView style={styles.scroll} showsVerticalScrollIndicator={false}>
        <View style={styles.grid}>
          {FIELDS.map((field, index) => (
            <Animated.View key={field.key} entering={FadeInDown.delay(150 + index * 50).springify()} style={styles.gridItem}>
              <AppField label={field.label} placeholder={field.placeholder}
                error={field.key === 'license' && licenseInvalid ? 'Use 5 a 9 letras, números ou hífen' : undefined}
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
        {hasStarted && missingFields.length > 0 ? (
          <Text style={styles.formError}>{`Preencha ${missingFields.join(', ')} para guardar`}</Text>
        ) : null}
      </ScrollView>

      <Animated.View entering={FadeInUp.delay(400).springify()} style={styles.footer}>
        <AppButton onPress={handleSave} loading={state.isLoading} disabled={!canSave}>GUARDAR</AppButton>
      </Animated.View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  scroll: { flex: 1, paddingHorizontal: spacing.xl },
  grid: { gap: spacing.lg },
  gridItem: { width: '100%' },
  formError: { color: colors.error, fontSize: typography.caption.fontSize, lineHeight: typography.caption.lineHeight, marginTop: spacing.xs, marginLeft: spacing.xs },
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
  switchLabel: { fontSize: typography.bodySmall.fontSize, lineHeight: typography.bodySmall.lineHeight, fontWeight: '600', color: colors.textPrimary },
  switchHint: { fontSize: typography.caption.fontSize, lineHeight: typography.caption.lineHeight, color: colors.textMuted, marginTop: spacing.sm, marginHorizontal: spacing.xs },
  footer: { paddingHorizontal: spacing.xl, paddingBottom: spacing.xxl, paddingTop: spacing.md },
});

export default VehicleForm;
