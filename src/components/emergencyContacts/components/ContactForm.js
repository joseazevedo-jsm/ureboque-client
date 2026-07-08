import React from 'react';
import { View, Text, TextInput, StyleSheet, ScrollView } from 'react-native';
import Animated, { FadeInDown, FadeInUp } from 'react-native-reanimated';
import { scale } from 'react-native-size-matters';
import Icon from 'react-native-vector-icons/MaterialIcons';
import * as Haptics from 'expo-haptics';
import { ScalePressable } from '../../common/ScalePressable';
import { colors, shadows, borderRadius, spacing } from '../../../theme';
import { useAlert } from '../../../context/AlertContext';

const ContactForm = ({ state, updateCurrentContact, saveContact, deleteContact, onClose }) => {
  const { showAlert } = useAlert();
  const isEdit = state.mode === 'edit';
  const { currentContact } = state;

  const canSave =
    currentContact.name.trim().length > 0 &&
    currentContact.phone.trim().replace(/\D/g, '').length >= 7;

  const handleSave = async () => {
    try {
      await saveContact();
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});
    } catch (error) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error).catch(() => {});
      showAlert({ type: 'error', title: 'Erro', message: 'Não foi possível guardar o contacto. Tente novamente.' });
    }
  };

  const handleDelete = () => {
    showAlert({
      type: 'warning',
      title: 'Confirmar',
      message: 'Deseja realmente excluir este contacto?',
      buttons: [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Excluir',
          style: 'destructive',
          onPress: async () => {
            try {
              await deleteContact(currentContact.id);
              Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});
            } catch (error) {
              showAlert({ type: 'error', title: 'Erro', message: 'Não foi possível excluir o contacto.' });
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
          <Text style={styles.title}>{isEdit ? 'EDITAR' : 'NOVO'} CONTACTO</Text>
        </Animated.View>

        {[
          { key: 'name', label: 'Nome', placeholder: 'Ex: Maria Silva', keyboardType: 'default', autoCapitalize: 'words' },
          { key: 'phone', label: 'Telefone', placeholder: 'Ex: 923 456 789', keyboardType: 'phone-pad', autoCapitalize: 'none' },
          { key: 'relation', label: 'Relação', placeholder: 'Ex: Mãe, Pai, Cônjuge', keyboardType: 'default', autoCapitalize: 'words' },
        ].map((field, index) => (
          <Animated.View key={field.key} entering={FadeInDown.delay(150 + index * 60).springify()} style={styles.fieldGroup}>
            <Text style={styles.fieldLabel}>{field.label}</Text>
            <TextInput
              style={styles.input}
              placeholder={field.placeholder}
              placeholderTextColor={colors.textMuted}
              value={currentContact[field.key]}
              onChangeText={(text) => updateCurrentContact(field.key, text)}
              keyboardType={field.keyboardType}
              autoCapitalize={field.autoCapitalize}
            />
          </Animated.View>
        ))}
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
    backgroundColor: colors.error,
    borderRadius: borderRadius.xl,
    paddingVertical: spacing.lg,
    alignItems: 'center',
  },
  saveButtonDisabled: { backgroundColor: colors.textDisabled },
  saveButtonText: { color: colors.surface, fontWeight: '700', fontSize: scale(15), letterSpacing: 0.5 },
});

export default ContactForm;
