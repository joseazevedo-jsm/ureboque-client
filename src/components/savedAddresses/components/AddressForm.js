import React from 'react';
import {
  View,
  Text,
  TextInput,
  StyleSheet
} from 'react-native';
import Animated, { FadeInDown, FadeInUp } from 'react-native-reanimated';
import { scale } from 'react-native-size-matters';
import Icon from 'react-native-vector-icons/MaterialIcons';
import * as Haptics from 'expo-haptics';
import { ScalePressable } from '../../common/ScalePressable';
import { colors, shadows, borderRadius, spacing, componentStyles } from '../../../theme';
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
  const isEdit = state.mode === 'edit';
  const { currentAddress } = state;

  const handleSave = async () => {
    try {
      await saveAddress();
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => { });
      // Success handled in hook - returns to list
    } catch (error) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error).catch(() => { });
      showAlert({ type: 'error', title: 'Erro', message: 'Não foi possível salvar o endereço. Tente novamente.' });
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

  return (
    <View style={styles.container}>

      {/* Header - Same design as current AddressModal */}
      <View style={styles.header}>
        <ScalePressable style={styles.closeButton} onPress={onClose}>
          <Icon name="close" size={scale(25)} />
        </ScalePressable>
        {isEdit && (
          <ScalePressable style={styles.deleteButton} onPress={handleDelete}>
            <Text style={styles.deleteText}>Apagar</Text>
          </ScalePressable>
        )}
      </View>

      <View style={styles.content}>
        <View>
          {/* Title */}
          <Animated.View entering={FadeInDown.delay(100).springify()}>
            <Text style={styles.title}>
              {isEdit ? 'EDITAR' : 'NOVO'} ENDEREÇO
            </Text>
          </Animated.View>

          {/* Name Input */}
          <Animated.View entering={FadeInDown.delay(150).springify()}>
            <TextInput
              style={styles.nameInput}
              placeholderTextColor={colors.textMuted}
              placeholder="Nome do endereço"
              value={currentAddress.name}
              onChangeText={(text) => updateCurrentAddress('name', text)}
            />
          </Animated.View>

          {/* Address Input */}
          <Animated.View entering={FadeInDown.delay(200).springify()}>
            <View style={styles.addressContainer}>
              <ScalePressable style={styles.addressButton} onPress={openSearch}>
                <Text style={[styles.addressText, !currentAddress.description && { color: colors.textMuted }]}>
                  {currentAddress.description || "Localização"}
                </Text>
              </ScalePressable>
            </View>
          </Animated.View>

          {/* Instructions Input */}
          <Animated.View entering={FadeInDown.delay(250).springify()}>
            <TextInput
              style={styles.instructionsInput}
              placeholderTextColor={colors.textMuted}
              placeholder="Instruções para o motorista"
              value={currentAddress.instructions}
              onChangeText={(text) => updateCurrentAddress('instructions', text)}
              multiline
            />
          </Animated.View>
        </View>

        {/* Save Button - Same design */}
        <Animated.View entering={FadeInUp.delay(300).springify()}>
          <ScalePressable
            style={[styles.saveButton, !canSave && styles.saveButtonDisabled]}
            onPress={handleSave}
            disabled={state.isLoading || !canSave}
          >
            <Text style={styles.saveButtonText}>
              {state.isLoading ? 'SALVANDO...' : 'SALVAR'}
            </Text>
          </ScalePressable>
        </Animated.View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
    paddingHorizontal: spacing.xl,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingTop: spacing.modalSafeTop,
    paddingVertical: spacing.lg,
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
  deleteButton: {
    paddingTop: spacing.sm,
    paddingHorizontal: spacing.sm,
  },
  deleteText: {
    fontWeight: "600",
    color: colors.error,
    fontSize: scale(14),
  },
  title: {
    fontSize: scale(18),
    marginTop: spacing.xxl,
    marginBottom: spacing.xl,
    alignSelf: "center",
    color: colors.textPrimary,
    fontWeight: "700",
    letterSpacing: 0.5,
  },
  nameInput: {
    borderRadius: borderRadius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    fontSize: scale(16),
    padding: spacing.lg,
    marginBottom: spacing.xl,
    backgroundColor: colors.surface,
    color: colors.textPrimary,
    ...shadows.sm,
  },
  addressContainer: {
    borderRadius: borderRadius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    marginBottom: spacing.xl,
    backgroundColor: colors.surface,
    ...shadows.sm,
  },
  addressButton: {
    padding: spacing.lg,
  },
  addressText: {
    fontSize: scale(16),
    color: colors.textPrimary,
  },
  instructionsInput: {
    borderRadius: borderRadius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    fontSize: scale(16),
    padding: spacing.lg,
    paddingBottom: scale(80),
    backgroundColor: colors.surface,
    color: colors.textPrimary,
    textAlignVertical: 'top',
    ...shadows.sm,
  },
  saveButton: {
    backgroundColor: colors.primary,
    borderRadius: borderRadius.xl,
    width: scale(300),
    alignItems: "center",
    alignSelf: "center",
    paddingVertical: spacing.lg,
    marginBottom: spacing.xxl,
    ...shadows.primaryGlow,
  },
  saveButtonDisabled: {
    backgroundColor: colors.textDisabled,
    shadowOpacity: 0,
    elevation: 0,
  },
  saveButtonText: {
    color: colors.surface,
    fontWeight: "700",
    fontSize: scale(15),
    letterSpacing: 0.5,
  },
  content: {
    justifyContent: "space-between",
    flex: 1
  }
});

export default AddressForm;