import React, { useState } from "react";
import {
  ActivityIndicator,
  View,
  Image,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  ScrollView,
} from "react-native";
import { scale } from "react-native-size-matters";
import { useNavigation } from "@react-navigation/native";
import MaterialIcons from "@expo/vector-icons/MaterialIcons";
const Icon = MaterialIcons;
import useProfileScreen from "../components/profile/useProfileScreen";
import { useLogger } from "../hooks/useLogger";
import { extractCountryCode, extractPhoneNumber } from "../utils/phoneUtils";
import OTPModal from "../components/modals/OTP/OTPModal";
import KeyboardAvoidingWrapper from "../components/common/KeyboardAvoidingWrapper";
import { colors, spacing, shadows, borderRadius } from "../theme";
import Animated, { FadeInDown } from 'react-native-reanimated';
import { useAlert } from "../context/AlertContext";
import VehiclesModal from "../components/vehicles/VehiclesModal";
import EmergencyContactsModal from "../components/emergencyContacts/EmergencyContactsModal";
import InsuranceModal from "../components/insurance/InsuranceModal";
import AccessibilityModal from "../components/accessibility/AccessibilityModal";

// Import your images
import phoneIcon from "../../resources/icons/profile_settings/phone.png";
import emailIcon from "../../resources/icons/profile_settings/email.png";
import leaveIcon from "../../resources/icons/profile_settings/leave.png";
import optionsIcon from "../../resources/icons/profile_settings/options.png";

const ProfileScreen = () => {
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
    <KeyboardAvoidingWrapper style={styles.container}>
      {/* Header */}
      <Animated.View style={styles.headerContainer} entering={FadeInDown.delay(0).springify().damping(28).stiffness(180)}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => {
            logger.logUserInteraction('menu_button_pressed', { from: 'ProfileScreen' });
            navigation.openDrawer();
          }}
        >
          <Icon name="menu" size={scale(22)} color={colors.primary} />
        </TouchableOpacity>
        <Text style={styles.headerText}>PERFIL</Text>

        <View style={{
          paddingHorizontal: spacing.lg,
        }} />
      </Animated.View>

      <ScrollView style={styles.contentContainer} contentContainerStyle={styles.contentContainerInner} showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
        {/* Profile Image Section */}
        <Animated.View style={styles.profileSection} entering={FadeInDown.delay(80).springify().damping(28).stiffness(180)}>
          <View style={styles.profileImageContainer}>
            <TouchableOpacity onPress={() => {
              logger.logUserInteraction('profile_image_picker_opened', { hasCurrentImage: !!models?.image || !!models?.user?.photo });
              operations.handleOpenImagePicker();
            }}>
              <Image
                source={{
                  uri: models?.image || models?.user?.photo || 'https://w7.pngwing.com/pngs/178/595/png-transparent-user-profile-computer-icons-login-user-avatars-thumbnail.png',
                }}
                style={styles.profileImage}
              />
              <View style={styles.editIconContainer}>
                <Icon name="edit" size={scale(16)} color={colors.surface} />
              </View>
            </TouchableOpacity>
          </View>
        </Animated.View>

        {/* Personal Information Section */}
        <Animated.View style={styles.formSection} entering={FadeInDown.delay(160).springify().damping(28).stiffness(180)}>
          <Text style={styles.sectionTitle}>Informações Pessoais</Text>

          <View style={styles.inputContainer}>
            <Text style={styles.inputLabel}>Nome</Text>
            <TextInput
              style={styles.textInput}
              value={models?.name ?? models?.user?.name?.split(" ", 2)[0] ?? ''}
              placeholderTextColor={colors.textMuted}
              onChangeText={operations.handleNameChange}
            />
          </View>

          <View style={styles.inputContainer}>
            <Text style={styles.inputLabel}>Sobrenome</Text>
            <TextInput
              style={styles.textInput}
              value={models?.surname ?? models?.user?.name?.split(" ", 2)[1] ?? ''}
              placeholderTextColor={colors.textMuted}
              onChangeText={operations.handleSurnameChange}
            />
          </View>

          <View style={styles.inputContainer}>
            <Text style={styles.inputLabel}>Telefone</Text>
            <View style={styles.phoneRow}>
              <View style={styles.shortInputContainer}>
                <TextInput
                  style={styles.textInput}
                  value={`+${extractCountryCode(models?.user?.phone)}`}
                  placeholderTextColor={colors.textMuted}
                  editable={false}
                />
              </View>
              <View style={styles.longInputContainer}>
                <View style={styles.inputWithIcon}>
                  <Image
                    source={phoneIcon}
                    style={styles.icon_small}
                    resizeMode="contain"
                  />
                  <TextInput
                    style={styles.textInputInContainer}
                    placeholder={extractPhoneNumber(models?.user?.phone)}
                    placeholderTextColor={colors.textMuted}
                    value={models?.phoneNumberInput}
                    onChangeText={operations.handlePhoneNumberChange}
                    keyboardType="numeric"
                  />
                </View>
              </View>
            </View>
          </View>

          <View style={styles.inputContainer}>
            <Text style={styles.inputLabel}>Email</Text>
            <View style={styles.inputWithIcon}>
              <Image source={emailIcon} style={styles.icon_small} resizeMode="contain" />
              <TextInput
                style={styles.textInputInContainer}
                value={models?.email}
                placeholderTextColor={colors.textMuted}
                onChangeText={operations.handleEmailChange}
              />
            </View>
          </View>

          <TouchableOpacity
            style={[styles.saveButton, (models?.isSaving || !models?.hasChanges) && styles.saveButtonDisabled]}
            onPress={() => operations.handleSaveChanges(navigation)}
            disabled={models?.isSaving || !models?.hasChanges}
          >
            {models?.isSaving ? (
              <ActivityIndicator size="small" color={colors.surface} />
            ) : (
              <Text style={styles.saveButtonText}>Salvar alterações</Text>
            )}
          </TouchableOpacity>
        </Animated.View>

        {/* My Data Section */}
        <Animated.View style={styles.actionSection} entering={FadeInDown.delay(220).springify().damping(28).stiffness(180)}>
          <Text style={styles.sectionTitle}>Meus Dados</Text>
          {[
            { icon: 'directions-car', label: 'Meus Veículos', onPress: () => setVehiclesModalVisible(true) },
            { icon: 'contact-emergency', label: 'Contactos de Emergência', onPress: () => setEmergencyContactsModalVisible(true) },
            { icon: 'verified-user', label: 'Seguros', onPress: () => setInsuranceModalVisible(true) },
            { icon: 'accessibility', label: 'Acessibilidade', onPress: () => setAccessibilityModalVisible(true) },
          ].map((item) => (
            <TouchableOpacity key={item.label} style={[styles.actionItem, styles.actionItemSpaced]} onPress={item.onPress} activeOpacity={0.7}>
              <Icon name={item.icon} size={scale(22)} color={colors.primary} style={styles.actionIconMaterial} />
              <Text style={styles.actionText}>{item.label}</Text>
              <Icon name="arrow-forward-ios" size={scale(16)} style={styles.actionArrow} />
            </TouchableOpacity>
          ))}
        </Animated.View>

        {/* Settings Section */}
        <Animated.View style={styles.actionSection} entering={FadeInDown.delay(280).springify().damping(28).stiffness(180)}>
          <TouchableOpacity
            style={styles.actionItem}
            onPress={() => {
              logger.logUserInteraction('settings_button_pressed', { from: 'ProfileScreen' });
              logger.logNavigation('ProfileScreen', 'SettingsScreen', { action: 'navigate' });
              navigation.navigate('SettingsScreen');
            }}
          >
            <Image source={optionsIcon} style={styles.actionIcon} resizeMode="contain" />
            <Text style={styles.actionText}>Definições</Text>
            <Icon name="arrow-forward-ios" size={scale(16)} style={styles.actionArrow} />
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
        OTPChange={(otp) => operations.handleOTPVerification(otp)}
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
    paddingTop: spacing.headerHeight,
    paddingBottom: spacing.xl,
    paddingHorizontal: spacing.xxl,
    backgroundColor: 'transparent',
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  backButton: {
    padding: spacing.sm,
    borderRadius: borderRadius.xxl,
    backgroundColor: colors.surface,
    ...shadows.sm,
  },
  headerText: {
    fontWeight: "800",
    fontSize: scale(18),
    color: colors.textPrimary,
    letterSpacing: 0.5,
  },
  contentContainer: {
    flex: 1,
    paddingHorizontal: spacing.xxl,
  },
  contentContainerInner: {
    paddingBottom: spacing.xxxl,
  },
  profileSection: {
    alignItems: 'center',
    marginVertical: spacing.xl,
  },
  profileImageContainer: {
    width: scale(100),
    height: scale(100),
    borderRadius: borderRadius.full,
    padding: spacing.xs,
    backgroundColor: colors.surface,
    ...shadows.primaryGlow,
  },
  profileImage: {
    width: "100%",
    height: "100%",
    borderRadius: scale(46),
  },
  editIconContainer: {
    position: "absolute",
    bottom: 0,
    right: 0,
    backgroundColor: colors.primary,
    borderRadius: borderRadius.xxl,
    width: scale(36),
    height: scale(36),
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 3,
    borderColor: colors.surface,
    ...shadows.md,
  },
  formSection: {
    marginBottom: spacing.xxl,
  },
  sectionTitle: {
    fontSize: scale(14),
    fontWeight: '700',
    color: colors.textSecondary,
    marginBottom: spacing.lg,
    letterSpacing: 1,
    textTransform: 'uppercase',
  },
  inputContainer: {
    marginBottom: spacing.lg,
  },
  inputLabel: {
    fontSize: scale(13),
    fontWeight: '600',
    color: colors.textPrimary,
    marginBottom: spacing.sm,
  },
  textInput: {
    fontSize: scale(15),
    color: colors.textPrimary,
    paddingVertical: scale(14),
    paddingHorizontal: spacing.lg,
    backgroundColor: colors.surface,
    borderRadius: borderRadius.md,
    borderWidth: 1,
    borderColor: colors.border,
    ...shadows.sm,
  },
  phoneRow: {
    flexDirection: "row",
    gap: spacing.md,
  },
  shortInputContainer: {
    width: scale(80),
  },
  longInputContainer: {
    flex: 1,
  },
  inputWithIcon: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: colors.surface,
    borderRadius: borderRadius.md,
    borderWidth: 1,
    borderColor: colors.border,
    paddingHorizontal: spacing.lg,
    paddingVertical: scale(2),
    ...shadows.sm,
  },
  icon_small: {
    width: scale(20),
    height: scale(20),
    marginRight: spacing.md,
    tintColor: colors.textMuted,
  },
  textInputInContainer: {
    flex: 1,
    fontSize: scale(15),
    color: colors.textPrimary,
    paddingVertical: spacing.md,
  },
  saveButton: {
    backgroundColor: colors.primary,
    paddingVertical: spacing.lg,
    borderRadius: borderRadius.xl,
    alignItems: 'center',
    marginTop: spacing.xxl,
    ...shadows.primaryGlow,
  },
  saveButtonDisabled: {
    backgroundColor: colors.textDisabled,
    shadowOpacity: 0,
    elevation: 0,
  },
  saveButtonText: {
    color: colors.surface,
    fontSize: scale(16),
    fontWeight: "700",
    letterSpacing: 0.5,
  },
  actionSection: {
    marginBottom: scale(40),
  },
  actionItem: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: spacing.lg,
    paddingHorizontal: spacing.xl,
    backgroundColor: colors.surface,
    borderRadius: borderRadius.xl,
    borderWidth: 1,
    borderColor: colors.border,
    ...shadows.sm,
  },
  actionIcon: {
    width: scale(24),
    height: scale(24),
    marginRight: spacing.lg,
    tintColor: colors.primary,
  },
  actionText: {
    flex: 1,
    fontSize: scale(15),
    fontWeight: '600',
    color: colors.textPrimary,
  },
  actionArrow: {
    color: colors.textDisabled,
  },
  actionItemSpaced: {
    marginBottom: spacing.sm,
  },
  actionIconMaterial: {
    marginRight: spacing.lg,
  },
});

export default ProfileScreen;
