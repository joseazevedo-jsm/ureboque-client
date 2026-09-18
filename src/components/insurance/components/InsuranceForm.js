import React from 'react';
import { View, StyleSheet, ScrollView } from 'react-native';
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
import { componentStyles, sizes, colors, spacing, typography } from "../../../theme";
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
      <AppHeader title={isEdit ? 'Editar seguro' : 'Novo seguro'} subtitle="Preencha os dados da apólice."
        leftIcon="close" leftLabel="Fechar seguro" onLeftPress={onClose}
        rightIcon={isEdit ? 'delete-outline' : undefined} rightLabel="Apagar seguro"
        rightColor={colors.error} onRightPress={handleDelete} />

      <ScrollView style={styles.scroll} showsVerticalScrollIndicator={false}>
        {[
          { key: 'company', label: 'Seguradora', placeholder: 'Ex: ENSA, AAA Seguros', autoCapitalize: 'words' },
          { key: 'policyNumber', label: 'Número de Apólice', placeholder: 'Ex: AP-2024-001234', autoCapitalize: 'characters' },
          { key: 'vehicleLicense', label: 'Matrícula do Veículo', placeholder: 'LD-00-00', autoCapitalize: 'characters' },
        ].map((field, index) => (
          <Animated.View key={field.key} entering={FadeInDown.delay(150 + index * 60).springify()} style={styles.fieldGroup}>
            <AppField label={field.label} placeholder={field.placeholder}
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
        <AppButton onPress={handleSave} loading={state.isLoading} disabled={!canSave}>GUARDAR</AppButton>
      </Animated.View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  scroll: { flex: 1, paddingHorizontal: spacing.xl },
  fieldGroup: { marginBottom: spacing.lg },
  formError: { color: colors.error, fontSize: typography.caption.fontSize, lineHeight: typography.caption.lineHeight, marginTop: spacing.xs, marginLeft: spacing.xs },
  footer: { paddingHorizontal: spacing.xl, paddingBottom: spacing.xxl, paddingTop: spacing.md },
});

export default InsuranceForm;
