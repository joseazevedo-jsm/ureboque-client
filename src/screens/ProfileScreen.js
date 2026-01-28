import React from "react";
import {
  View,
  Image,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  KeyboardAvoidingView,
  Platform,
  Alert,
} from "react-native";
import { scale } from "react-native-size-matters";
import { useNavigation } from "@react-navigation/native";
import Icon from "react-native-vector-icons/MaterialIcons";
import useProfileScreen from "../components/profile/useProfileScreen";
import { useLogger } from "../hooks/useLogger";
import { extractCountryCode, extractPhoneNumber } from "../utils/phoneUtils";
import OTPModal from "../components/modals/OTP/OTPModal";

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

  const { models, operations } = useProfileScreen();
  const navigation = useNavigation();

  logger.debug('ProfileScreen rendered', {
    hasUser: !!models?.user,
    userName: models?.user?.name,
    hasProfileImage: !!models?.image || !!models?.user?.photo
  });

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === "ios" ? "padding" : "height"}
      keyboardVerticalOffset={Platform.OS === "ios" ? 0 : 10}
    >
      {/* Header */}
      <View style={styles.headerContainer}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => {
            logger.logUserInteraction('menu_button_pressed', { from: 'ProfileScreen' });
            navigation.openDrawer();
          }}
        >
          <Icon name="menu" size={scale(25)} color="#0089FF" />
        </TouchableOpacity>
        <Text style={styles.headerText}>PERFIL</Text>
        <Text> </Text>

      </View>

      <View style={styles.contentContainer}>
        {/* Profile Image Section */}
        <View style={styles.profileSection}>
          <View style={styles.profileImageContainer}>
            <TouchableOpacity onPress={() => {
              logger.logUserInteraction('profile_image_picker_opened', { hasCurrentImage: !!models?.image || !!models?.user?.photo });
              operations.handleOpenImagePicker();
            }}>
              <Image
                source={{
                  uri: models?.image ? models?.image : models?.user?.photo,
                }}
                style={styles.profileImage}
              />
              <View style={styles.editIconContainer}>
                <Icon name="edit" size={scale(16)} color="#FFF" />
              </View>
            </TouchableOpacity>
          </View>
        </View>

        {/* Personal Information Section */}
        <View style={styles.formSection}>
          <Text style={styles.sectionTitle}>Informações Pessoais</Text>

          <View style={styles.inputContainer}>
            <Text style={styles.inputLabel}>Nome</Text>
            <TextInput
              style={styles.textInput}
              placeholder={models?.user?.name.split(" ", 2)[0]}
              placeholderTextColor="#A0AEC0"
              onChangeText={operations.handleNameChange}
            />
          </View>

          <View style={styles.inputContainer}>
            <Text style={styles.inputLabel}>Sobrenome</Text>
            <TextInput
              style={styles.textInput}
              placeholder={models?.user?.name.split(" ", 2)[1]}
              placeholderTextColor="#A0AEC0"
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
                  placeholderTextColor="#A0AEC0"
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
                    placeholderTextColor="#A0AEC0"
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
                placeholder={models?.user?.email}
                placeholderTextColor="#A0AEC0"
                onChangeText={operations.handleEmailChange}
              />
            </View>
          </View>

          <TouchableOpacity
            style={[styles.saveButton, (models?.isSaving || !models?.hasChanges) && styles.saveButtonDisabled]}
            onPress={() => operations.handleSaveChanges(navigation)}
            disabled={models?.isSaving || !models?.hasChanges}
          >
            <Text style={styles.saveButtonText}>
              {models?.isSaving ? 'Salvando...' : 'Salvar alterações'}
            </Text>
          </TouchableOpacity>
        </View>

        {/* Settings Section */}
        <View style={styles.actionSection}>
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
        </View>
      </View>

      {/* OTP Modal for Phone Number Verification */}
      <OTPModal
        visible={models?.showOTPModal}
        OTPChange={(otp) => operations.handleOTPVerification(otp)}
        number={models?.pendingPhoneNumber}
        isLoading={models?.isVerifyingOTP}
        onClose={() => operations.handleOTPModalClose()}
      />
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FAFC', // Slate 50
  },
  headerContainer: {
    paddingTop: scale(60),
    paddingBottom: scale(20),
    paddingHorizontal: scale(24),
    backgroundColor: 'transparent', // Let content flow
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  backButton: {
    padding: scale(8),
    borderRadius: scale(20),
    backgroundColor: '#fff',
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  headerText: {
    fontWeight: "800",
    fontSize: scale(18),
    color: "#1E293B",
    letterSpacing: 0.5,
  },
  contentContainer: {
    flex: 1,
    paddingHorizontal: scale(24),
  },
  profileSection: {
    alignItems: 'center',
    marginVertical: scale(20),
  },
  profileImageContainer: {
    width: scale(100),
    height: scale(100),
    borderRadius: scale(50),
    padding: scale(4),
    backgroundColor: '#FFFFFF',
    shadowColor: '#0089FF',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.2,
    shadowRadius: 16,
    elevation: 8,
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
    backgroundColor: "#0089FF",
    borderRadius: scale(20),
    width: scale(36),
    height: scale(36),
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 3,
    borderColor: "#fff",
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
    elevation: 4,
  },
  formSection: {
    marginBottom: scale(24),
  },
  sectionTitle: {
    fontSize: scale(14),
    fontWeight: '700',
    color: '#64748B',
    marginBottom: scale(16),
    letterSpacing: 1,
    textTransform: 'uppercase',
  },
  inputContainer: {
    marginBottom: scale(16),
  },
  inputLabel: {
    fontSize: scale(13),
    fontWeight: '600',
    color: '#1E293B',
    marginBottom: scale(8),
  },
  textInput: {
    fontSize: scale(15),
    color: '#1E293B',
    paddingVertical: scale(14),
    paddingHorizontal: scale(16),
    backgroundColor: '#fff',
    borderRadius: scale(12),
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.05)',
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.02,
    shadowRadius: 4,
    elevation: 1,
  },
  phoneRow: {
    flexDirection: "row",
    gap: scale(12),
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
    backgroundColor: '#fff',
    borderRadius: scale(12),
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.05)',
    paddingHorizontal: scale(16),
    paddingVertical: scale(2), // Adjust for vertically centered text
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.02,
    shadowRadius: 4,
    elevation: 1,
  },
  icon_small: {
    width: scale(20),
    height: scale(20),
    marginRight: scale(12),
    tintColor: '#94A3B8',
  },
  textInputInContainer: {
    flex: 1,
    fontSize: scale(15),
    color: '#1E293B',
    paddingVertical: scale(12),
  },
  saveButton: {
    backgroundColor: '#0089FF',
    paddingVertical: scale(16),
    borderRadius: scale(16),
    alignItems: 'center',
    marginTop: scale(24),
    shadowColor: '#0089FF',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
  },
  saveButtonDisabled: {
    backgroundColor: "#CBD5E0",
    shadowOpacity: 0,
    elevation: 0,
  },
  saveButtonText: {
    color: "#FFFFFF",
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
    paddingVertical: scale(16),
    paddingHorizontal: scale(20),
    backgroundColor: '#fff',
    borderRadius: scale(16),
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.05)',
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.03,
    shadowRadius: 6,
    elevation: 2,
  },
  actionIcon: {
    width: scale(24),
    height: scale(24),
    marginRight: scale(16),
    tintColor: '#0089FF',
  },
  actionText: {
    flex: 1,
    fontSize: scale(15),
    fontWeight: '600',
    color: '#1E293B',
  },
  actionArrow: {
    color: '#CBD5E0',
  },
});

export default ProfileScreen;
