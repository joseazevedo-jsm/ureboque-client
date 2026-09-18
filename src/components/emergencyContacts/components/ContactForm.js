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
import { componentStyles, sizes, colors, spacing } from "../../../theme";
import { useAlert } from '../../../context/AlertContext';

const ContactForm = ({ state, updateCurrentContact, saveContact, deleteContact, onClose }) => {
  const { showAlert } = useAlert();
  const isEdit = state.mode === 'edit';
  const { currentContact } = state;

  const phoneDigits = currentContact.phone.trim().replace(/\D/g, '');
  const canSave = currentContact.name.trim().length > 0 && phoneDigits.length >= 7;

  // Say why GUARDAR is inert. Without this the form silently refuses to save
  // and the button just looks broken.
  const fieldHint = {
    name: currentContact.name.length > 0 && !currentContact.name.trim()
      ? 'Introduza um nome'
      : null,
    phone: currentContact.phone.length > 0 && phoneDigits.length < 7
      ? 'O telefone deve ter pelo menos 7 dígitos'
      : null,
  };

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
      <AppHeader title={isEdit ? 'Editar contacto' : 'Novo contacto'} subtitle="Preencha os dados do contacto."
        leftIcon="close" leftLabel="Fechar contacto" onLeftPress={onClose}
        rightIcon={isEdit ? 'delete-outline' : undefined} rightLabel="Apagar contacto"
        rightColor={colors.error} onRightPress={handleDelete} />

      <ScrollView style={styles.scroll} showsVerticalScrollIndicator={false}>
        {[
          { key: 'name', label: 'Nome', placeholder: 'Ex: Maria Silva', keyboardType: 'default', autoCapitalize: 'words' },
          { key: 'phone', label: 'Telefone', placeholder: 'Ex: 923 456 789', keyboardType: 'phone-pad', autoCapitalize: 'none' },
          { key: 'relation', label: 'Relação', placeholder: 'Ex: Mãe, Pai, Cônjuge', keyboardType: 'default', autoCapitalize: 'words' },
        ].map((field, index) => (
          <Animated.View key={field.key} entering={FadeInDown.delay(150 + index * 60).springify()} style={styles.fieldGroup}>
            <AppField
              label={field.label}
              error={fieldHint[field.key]}
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
        <AppButton onPress={handleSave} loading={state.isLoading} disabled={!canSave}>GUARDAR</AppButton>
      </Animated.View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  scroll: { flex: 1, paddingHorizontal: spacing.xl },
  fieldGroup: { marginBottom: spacing.lg },
  footer: { paddingHorizontal: spacing.xl, paddingBottom: spacing.xxl, paddingTop: spacing.md },
});

export default ContactForm;
