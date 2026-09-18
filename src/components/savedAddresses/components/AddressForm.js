import React from 'react';
import { AppHeader } from '../../common/AppHeader';
import { View, StyleSheet, ScrollView, KeyboardAvoidingView } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { AppField } from '../../common/AppField';
import { AppButton } from '../../common/AppButton';
import { AppText as Text } from '../../common/AppText';

import * as Haptics from 'expo-haptics';
import { ScalePressable } from '../../common/ScalePressable';
import { colors, spacing, componentStyles, typography, layout, keyboardConfig, sizes } from '../../../theme';
import { useAlert } from '../../../context/AlertContext';

const AddressForm = ({
  state,
  updateCurrentAddress,
  saveAddress,
  deleteAddress,
  openSearch,
  onClose
}) => {
  const { showAlert } = useAlert();
  const insets = useSafeAreaInsets();
  const isEdit = state.mode === 'edit';
  const { currentAddress } = state;

  const handleSave = async () => {
    try {
      await saveAddress();
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => { });
      // Success handled in hook - returns to list
    } catch (error) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error).catch(() => { });
      // Some failures are the user's to fix — a duplicate name, a missing
      // location — and telling them only to "try again" sends them round the
      // same loop with no idea what to change. Show the reason when we have one.
      showAlert({
        type: 'error',
        title: 'Erro',
        message: error?.message || 'Não foi possível salvar o endereço. Tente novamente.',
      });
    }
  };

  const handleDelete = async () => {
    showAlert({
      type: 'warning',
      title: 'Confirmar',
      message: 'Deseja realmente excluir este endereço?',
      buttons: [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Excluir',
          style: 'destructive',
          onPress: async () => {
            try {
              await deleteAddress(currentAddress.id);
            } catch (error) {
              showAlert({ type: 'error', title: 'Erro', message: 'Não foi possível excluir o endereço.' });
            }
          }
        }
      ]
    });
  };

  // Calculate if save button should be enabled
  const canSave = currentAddress.name && currentAddress.coordinates;

  // A name with no location looks complete but cannot be saved; say so rather
  // than leaving SALVAR inert.
  const missingFields = [
    !currentAddress.name && 'um nome',
    !currentAddress.coordinates && 'uma localização',
  ].filter(Boolean);
  const hasStarted = !!currentAddress.name || !!currentAddress.coordinates;

  return (
    <View style={styles.container}>

      <AppHeader
        title={isEdit ? 'Editar endereço' : 'Novo endereço'}
        subtitle="Preencha os dados do local."
        onLeftPress={onClose}
        leftLabel="Fechar endereço"
        rightIcon={isEdit ? 'delete-outline' : undefined}
        rightLabel="Apagar endereço"
        rightColor={colors.error}
        onRightPress={handleDelete}
      />

      <KeyboardAvoidingView style={styles.keyboard} behavior={keyboardConfig.behavior}>
        <ScrollView keyboardShouldPersistTaps="handled" contentContainerStyle={[styles.content, { paddingBottom: insets.bottom + spacing.xxl }]}>
          <View style={styles.fields}>
            <AppField label="Nome do endereço" placeholder="Ex.: Casa" value={currentAddress.name}
              onChangeText={(text) => updateCurrentAddress('name', text)} />
            <View style={styles.field}>
              <Text style={typography.label}>Localização</Text>
              <ScalePressable style={styles.addressButton} onPress={openSearch} accessibilityLabel="Escolher localização"
                accessibilityHint={currentAddress.description || 'Pesquise um endereço ou escolha no mapa'}>
                <Text style={typography.body}>{currentAddress.description || 'Escolher no mapa ou pesquisar'}</Text>
              </ScalePressable>
            </View>
            <AppField label="Instruções para o motorista" hint="Opcional. Indique um ponto de referência."
              placeholder="Ex.: Entrada junto ao portão azul" value={currentAddress.instructions}
              onChangeText={(text) => updateCurrentAddress('instructions', text)} multiline style={styles.instructionsInput} />
            {hasStarted && missingFields.length > 0 ? (
              <Text accessibilityLiveRegion="polite" style={styles.formError}>{`Falta ${missingFields.join(' e ')}`}</Text>
            ) : null}
          </View>
          <AppButton onPress={handleSave} loading={state.isLoading} disabled={!canSave}>
            {state.isLoading ? 'Salvando…' : 'Salvar endereço'}
          </AppButton>
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  keyboard: { flex: 1 },
  content: { flexGrow: 1, width: '100%', maxWidth: layout.formMaxWidth, alignSelf: 'center', padding: spacing.lg, gap: spacing.xxl, justifyContent: 'space-between' },
  fields: { gap: spacing.xxl },
  field: { gap: spacing.sm },
  addressButton: { ...componentStyles.input, justifyContent: 'center' },
  instructionsInput: { minHeight: sizes.placeCardMinHeight, textAlignVertical: 'top' },
  formError: { ...typography.bodySmall, color: colors.error },
});

export default AddressForm;
