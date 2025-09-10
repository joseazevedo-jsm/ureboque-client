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
            logger.logUserInteraction('back_button_pressed', { from: 'ProfileScreen' });
            logger.logNavigation('ProfileScreen', 'previous', { action: 'back' });
            navigation.goBack();
          }}
        >
          <Icon name="arrow-back" size={scale(25)} color="#0089FF" />
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
            style={[styles.saveButton, models?.isSaving && styles.saveButtonDisabled]}
            onPress={() => operations.handleSaveChanges(navigation)}
            disabled={models?.isSaving}
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
    backgroundColor: '#F8FAFE',
  },
  headerContainer: {
    height: scale(80),
    flexDirection: "row",
    alignItems: "center",
    justifyContent:"space-between",
    paddingHorizontal: scale(20),
    paddingTop: scale(30),
    backgroundColor: "#fff",
  },
  backButton: {
  },
  headerText: {
    fontWeight: "bold",
    fontSize: scale(18),
    color: "#0089FF",
   },
  contentContainer: {
    flex: 1,
    justifyContent:"space-around",
    paddingHorizontal: scale(20),
  },
  profileSection: {
    alignItems: 'center',
    marginTop: scale(5),
    marginBottom: scale(10),
  },
  profileImageContainer: {
    width: scale(80),
    height: scale(80),
    borderRadius: scale(40),
    padding: scale(3),
    backgroundColor: '#FFFFFF',
    shadowColor: '#0089FF',
    shadowOffset: {
      width: 0,
      height: scale(4),
    },
    shadowOpacity: 0.15,
    shadowRadius: scale(8),
    elevation: 6,
  },
  profileImage: {
    width: "100%",
    height: "100%",
    borderRadius: scale(37),
  },
  editIconContainer: {
    position: "absolute",
    bottom: scale(0),
    right: scale(0),
    backgroundColor: "#0089FF",
    borderRadius: scale(18),
    width: scale(30),
    height: scale(30),
    justifyContent: "center",
    alignItems: "center",
    borderWidth: scale(3),
    borderColor: "#FFFFFF",
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: scale(2),
    },
    shadowOpacity: 0.1,
    shadowRadius: scale(4),
    elevation: 4,
  },
  formSection: {
    backgroundColor: '#FFFFFF',
    borderRadius: scale(12),
    padding: scale(12),
    marginBottom: scale(8),
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: scale(2),
    },
    shadowOpacity: 0.05,
    shadowRadius: scale(6),
    elevation: 3,
  },
  sectionTitle: {
    fontSize: scale(14),
    fontWeight: '600',
    color: '#2D3748',
    marginBottom: scale(12),
    letterSpacing: scale(0.3),
  },
  inputContainer: {
    marginBottom: scale(6),
  },
  inputLabel: {
    fontSize: scale(12),
    fontWeight: '500',
    color: '#718096',
    marginBottom: scale(5),
    letterSpacing: scale(0.2),
  },
  textInput: {
    fontSize: scale(14),
    color: '#2D3748',
    paddingVertical: scale(10),
    paddingHorizontal: scale(12),
    backgroundColor: '#F7FAFC',
    borderRadius: scale(8),
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  textInputFocused: {
    borderColor: '#0089FF',
    backgroundColor: '#FFFFFF',
  },
  phoneRow: {
    flexDirection: "row",
    gap: scale(10),
  },
  shortInputContainer: {
    flex: 0.3,
  },
  longInputContainer: {
    flex: 0.7,
  },
  inputWithIcon: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: '#F7FAFC',
    borderRadius: scale(8),
    borderWidth: 1,
    borderColor: '#E2E8F0',
    paddingHorizontal: scale(12),
  },
  inputWithIconFocused: {
    borderColor: '#0089FF',
    backgroundColor: '#FFFFFF',
  },
  icon_small: {
    width: scale(20),
    height: scale(20),
    marginRight: scale(10),
    tintColor: '#718096',
  },
  textInputInContainer: {
    flex: 1,
    fontSize: scale(14),
    color: '#2D3748',
    paddingVertical: scale(10),
  },
  saveButton: {
    backgroundColor: '#0089FF',
    paddingVertical: scale(8),
    paddingHorizontal: scale(24),
    borderRadius: scale(10),
    alignItems: 'center',
    marginVertical: scale(8),
    shadowColor: '#0089FF',
    shadowOffset: {
      width: 0,
      height: scale(3),
    },
    shadowOpacity: 0.25,
    shadowRadius: scale(6),
    elevation: 5,
  },
  saveButtonDisabled: {
    backgroundColor: "#CBD5E0",
    shadowOpacity: 0,
    elevation: 0,
  },
  saveButtonText: {
    color: "#FFFFFF",
    fontSize: scale(16),
    fontWeight: "600",
    letterSpacing: scale(0.3),
  },
  actionSection: {
    backgroundColor: '#FFFFFF',
    borderRadius: scale(12),
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: scale(2),
    },
    shadowOpacity: 0.05,
    shadowRadius: scale(6),
    elevation: 3,
  },
  actionItem: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: scale(12),
    paddingHorizontal: scale(16),
  },
  actionIcon: {
    width: scale(24),
    height: scale(24),
    marginRight: scale(15),
    tintColor: '#4A5568',
  },
  actionText: {
    flex: 1,
    fontSize: scale(14),
    fontWeight: '500',
    color: '#2D3748',
    letterSpacing: scale(0.2),
  },
  actionArrow: {
    color: '#A0AEC0',
  }, 
});

export default ProfileScreen;
