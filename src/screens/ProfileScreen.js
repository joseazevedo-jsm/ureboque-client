import { useSafeAreaInsets } from "react-native-safe-area-context";
import React, { useState } from "react";
import { View, Image, StyleSheet, ScrollView } from 'react-native';
import { AppText as Text, AppTextInput as TextInput } from '../components/common/AppText';
import { AppPressable as TouchableOpacity } from '../components/common/AppPressable';
import { AppHeader } from '../components/common/AppHeader';
import { AppButton } from '../components/common/AppButton';

import { useNavigation } from "@react-navigation/native";
import MaterialIcons from "@expo/vector-icons/MaterialIcons";
const Icon = MaterialIcons;
import useProfileScreen from "../components/profile/useProfileScreen";
import { useLogger } from "../hooks/useLogger";
import { extractCountryCode, extractPhoneNumber } from "../utils/phoneUtils";
import OTPModal from "../components/modals/OTP/OTPModal";
import KeyboardAvoidingWrapper from "../components/common/KeyboardAvoidingWrapper";
import { colors, spacing, shadows, borderRadius, borderWidths, sizes, layout, typography, fonts } from "../theme";
import Animated, { FadeInDown } from 'react-native-reanimated';
import { useAlert } from "../context/AlertContext";
import VehiclesModal from "../components/vehicles/VehiclesModal";
import EmergencyContactsModal from "../components/emergencyContacts/EmergencyContactsModal";
import InsuranceModal from "../components/insurance/InsuranceModal";
import AccessibilityModal from "../components/accessibility/AccessibilityModal";

const ProfileScreen = () => {
  const insets = useSafeAreaInsets();
  const logger = useLogger('ProfileScreen', {
    enableLifecycleLogging: true,
    logProps: true
  });

  const { showAlert } = useAlert();
  const { models, operations } = useProfileScreen(showAlert);
  const navigation = useNavigation();

  const [vehiclesModalVisible, setVehiclesModalVisible] = useState(false);
  const [emergencyContactsModalVisible, setEmergencyContactsModalVisible] = useState(false);
  const [insuranceModalVisible, setInsuranceModalVisible] = useState(false);
  const [accessibilityModalVisible, setAccessibilityModalVisible] = useState(false);

  logger.debug('ProfileScreen rendered', {
    hasUser: !!models?.user,
    userName: models?.user?.name,
    hasProfileImage: !!models?.image || !!models?.user?.photo
  });

  return (
    <KeyboardAvoidingWrapper style={[styles.container, { paddingBottom: insets.bottom }]}>
      <AppHeader title="PERFIL" leftIcon="menu" leftLabel="Abrir menu"
        onLeftPress={() => {
          logger.logUserInteraction('menu_button_pressed', { from: 'ProfileScreen' });
          navigation.openDrawer();
        }} style={styles.headerContainer} />

      <ScrollView style={styles.contentContainer} contentContainerStyle={styles.contentContainerInner} showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
        <Animated.View style={styles.identitySection} entering={FadeInDown.delay(80).springify().damping(28).stiffness(180)}>
          <TouchableOpacity
            accessibilityLabel="Alterar fotografia de perfil"
            onPress={() => {
              logger.logUserInteraction('profile_image_picker_opened', { hasCurrentImage: !!models?.image || !!models?.user?.photo });
              operations.handleOpenImagePicker();
            }}
            style={styles.profileImageContainer}
          >
            <Image
              source={{ uri: models?.image || models?.user?.photo || 'https://w7.pngwing.com/pngs/178/595/png-transparent-user-profile-computer-icons-login-user-avatars-thumbnail.png' }}
              style={styles.profileImage}
            />
            <View style={styles.editIconContainer}>
              <Icon name="photo-camera" size={sizes.icon} color={colors.surface} />
            </View>
          </TouchableOpacity>
          <Text style={styles.profileName} numberOfLines={2}>
            {[models?.name ?? models?.user?.name?.split(" ", 2)[0], models?.surname ?? models?.user?.name?.split(" ", 2)[1]].filter(Boolean).join(' ') || 'Perfil'}
          </Text>
        </Animated.View>

        <Animated.View style={styles.personalCard} entering={FadeInDown.delay(140).springify().damping(28).stiffness(180)}>
          <Text style={styles.sectionTitle}>Informações pessoais</Text>

          <View style={styles.fieldRow}>
            <View style={styles.fieldContent}>
              <Text style={styles.inputLabel}>Nome</Text>
              <TextInput accessibilityLabel="Nome" style={styles.inlineInput}
                value={models?.name ?? models?.user?.name?.split(" ", 2)[0] ?? ''}
                onChangeText={operations.handleNameChange} />
            </View>
            <Icon name="edit" size={sizes.icon} color={colors.primary} />
          </View>

          <View style={styles.fieldRow}>
            <View style={styles.fieldContent}>
              <Text style={styles.inputLabel}>Sobrenome</Text>
              <TextInput accessibilityLabel="Sobrenome" style={styles.inlineInput}
                value={models?.surname ?? models?.user?.name?.split(" ", 2)[1] ?? ''}
                onChangeText={operations.handleSurnameChange} />
            </View>
            <Icon name="edit" size={sizes.icon} color={colors.primary} />
          </View>

          <View style={styles.fieldRow}>
            <View style={styles.fieldContent}>
              <Text style={styles.inputLabel}>Telefone</Text>
              <View style={styles.phoneInlineRow}>
                <Text style={styles.countryCode}>+{extractCountryCode(models?.user?.phone)}</Text>
                <TextInput accessibilityLabel="Telefone" style={[styles.inlineInput, styles.phoneInput]}
                  placeholder={extractPhoneNumber(models?.user?.phone)} value={models?.phoneNumberInput}
                  onChangeText={operations.handlePhoneNumberChange} keyboardType="numeric" />
              </View>
            </View>
            <Icon name="edit" size={sizes.icon} color={colors.primary} />
          </View>

          <View style={[styles.fieldRow, styles.fieldRowLast]}>
            <View style={styles.fieldContent}>
              <Text style={styles.inputLabel}>Email</Text>
              <TextInput accessibilityLabel="Email" style={styles.inlineInput}
                value={models?.email} onChangeText={operations.handleEmailChange}
                keyboardType="email-address" autoCapitalize="none" />
            </View>
            <Icon name="edit" size={sizes.icon} color={colors.primary} />
          </View>

          <AppButton
            style={styles.saveButton}
            onPress={() => operations.handleSaveChanges(navigation)}
            disabled={models?.isSaving || !models?.hasChanges}
            loading={models?.isSaving}
          >
            Guardar alterações
          </AppButton>
        </Animated.View>

        <Animated.View style={styles.actionGrid} entering={FadeInDown.delay(220).springify().damping(28).stiffness(180)}>
          {[
            { icon: 'directions-car', label: 'Veículos', onPress: () => setVehiclesModalVisible(true) },
            { icon: 'contact-emergency', label: 'Contactos', onPress: () => setEmergencyContactsModalVisible(true) },
            { icon: 'verified-user', label: 'Seguros', onPress: () => setInsuranceModalVisible(true) },
            { icon: 'accessibility', label: 'Acessibilidade', onPress: () => setAccessibilityModalVisible(true) },
          ].map((item) => (
            <TouchableOpacity key={item.label} style={styles.actionTile} onPress={item.onPress}>
              <View style={styles.actionIconBubble}><Icon name={item.icon} size={sizes.iconLarge} color={colors.primary} /></View>
              <Text style={styles.actionText} numberOfLines={2}>{item.label}</Text>
            </TouchableOpacity>
          ))}
        </Animated.View>

        <Animated.View entering={FadeInDown.delay(280).springify().damping(28).stiffness(180)}>
          <TouchableOpacity style={styles.settingsItem} onPress={() => {
            logger.logUserInteraction('settings_button_pressed', { from: 'ProfileScreen' });
            logger.logNavigation('ProfileScreen', 'SettingsScreen', { action: 'navigate' });
            navigation.navigate('SettingsScreen');
          }}>
            <View style={styles.actionIconBubble}><Icon name="settings" size={sizes.iconLarge} color={colors.primary} /></View>
            <Text style={styles.actionText}>Definições</Text>
            <Icon name="chevron-right" size={sizes.iconLarge} color={colors.textDisabled} />
          </TouchableOpacity>
        </Animated.View>
      </ScrollView>

      <VehiclesModal visible={vehiclesModalVisible} onClose={() => setVehiclesModalVisible(false)} />
      <EmergencyContactsModal visible={emergencyContactsModalVisible} onClose={() => setEmergencyContactsModalVisible(false)} />
      <InsuranceModal visible={insuranceModalVisible} onClose={() => setInsuranceModalVisible(false)} />
      <AccessibilityModal visible={accessibilityModalVisible} onClose={() => setAccessibilityModalVisible(false)} />

      {/* OTP Modal for Phone Number Verification */}
      <OTPModal
        visible={models?.showOTPModal}
        // The modal reports every keystroke (and "" when it resets); verify only
        // once the code is complete, or the first digit fails as "incomplete".
        OTPChange={(otp) => { if (otp?.length === 4) operations.handleOTPVerification(otp); }}
        number={models?.pendingPhoneNumber}
        isLoading={models?.isVerifyingOTP}
        onClose={() => operations.handleOTPModalClose()}
      />
    </KeyboardAvoidingWrapper>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  headerContainer: {
    maxWidth: layout.formMaxWidth,
    alignSelf: "center",
  },
  contentContainer: {
    flex: 1,
  },
  contentContainerInner: {
    paddingHorizontal: spacing.xxl,
    width: "100%",
    maxWidth: layout.formMaxWidth,
    alignSelf: "center",
    paddingBottom: spacing.xxxl,
  },
  identitySection: {
    alignItems: 'center',
    paddingBottom: spacing.md,
  },
  profileImageContainer: {
    width: sizes.avatar + spacing.sm,
    height: sizes.avatar + spacing.sm,
    borderRadius: borderRadius.full,
    padding: spacing.xs,
    backgroundColor: colors.surface,
    ...shadows.sm,
  },
  profileImage: {
    width: "100%",
    height: "100%",
    borderRadius: borderRadius.full,
  },
  editIconContainer: {
    width: sizes.control,
    height: sizes.control,
    justifyContent: "center",
    alignItems: "center",
    position: "absolute",
    bottom: 0,
    right: 0,
    backgroundColor: colors.primary,
    borderRadius: borderRadius.full,
    borderWidth: borderWidths.focus,
    borderColor: colors.surface,
    ...shadows.sm,
  },
  profileName: {
    ...typography.h3,
    fontFamily: fonts.semiBold,
    textAlign: 'center',
    marginTop: spacing.sm,
  },
  personalCard: {
    backgroundColor: colors.surface,
    borderRadius: borderRadius.lg,
    borderWidth: borderWidths.thin,
    borderColor: colors.border,
    padding: spacing.md,
    marginBottom: spacing.lg,
    ...shadows.sm,
  },
  sectionTitle: {
    ...typography.label,
    fontFamily: fonts.bold,
    color: colors.textPrimary,
    marginBottom: spacing.xs,
    letterSpacing: 0.6,
    textTransform: 'uppercase',
  },
  fieldRow: {
    minHeight: sizes.control,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    paddingVertical: spacing.xs,
    borderBottomWidth: borderWidths.thin,
    borderBottomColor: colors.borderLight,
  },
  fieldRowLast: {
    borderBottomWidth: borderWidths.none,
  },
  fieldContent: {
    flex: 1,
  },
  inputLabel: {
    ...typography.caption,
    color: colors.textSecondary,
  },
  inlineInput: {
    ...typography.body,
    color: colors.textPrimary,
    minHeight: sizes.iconLarge + spacing.sm,
    paddingVertical: spacing.none,
    paddingHorizontal: spacing.none,
    borderWidth: borderWidths.none,
  },
  phoneInlineRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  countryCode: {
    ...typography.body,
    color: colors.textPrimary,
  },
  phoneInput: { flex: 1 },
  saveButton: {
    marginTop: spacing.lg,
  },
  actionGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.md,
    marginBottom: spacing.md,
  },
  actionTile: {
    flexGrow: 1,
    flexBasis: '46%',
    minWidth: '46%',
    minHeight: sizes.controlLarge + spacing.xxl,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    backgroundColor: colors.surface,
    borderRadius: borderRadius.lg,
    borderWidth: borderWidths.thin,
    borderColor: colors.border,
    padding: spacing.md,
    ...shadows.sm,
  },
  actionIconBubble: {
    width: sizes.handleWidth,
    height: sizes.handleWidth,
    borderRadius: borderRadius.full,
    backgroundColor: colors.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
  },
  actionText: {
    flex: 1,
    ...typography.bodySmall,
    fontFamily: fonts.semiBold,
    color: colors.textPrimary,
  },
  settingsItem: {
    minHeight: sizes.controlLarge + spacing.xxl,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    backgroundColor: colors.surface,
    borderRadius: borderRadius.lg,
    borderWidth: borderWidths.thin,
    borderColor: colors.border,
    padding: spacing.md,
    ...shadows.sm,
  },
});

export default ProfileScreen;
