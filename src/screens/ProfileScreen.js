import React from "react";
import {
  View,
  Image,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
} from "react-native";
import { scale } from "react-native-size-matters";
import { useNavigation } from "@react-navigation/native";
import Icon from "react-native-vector-icons/MaterialIcons";
import useProfileScreen from "../components/profile/useProfileScreen";
import { useLogger } from "../hooks/useLogger";
import { extractCountryCode, extractPhoneNumber } from "../utils/phoneUtils";

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
    <View style={styles.container}>
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
      </View>
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
      <View>
        <TextInput
          style={[styles.textInput, styles.underline]}
          placeholder={models?.user?.name.split(" ", 2)[0]}
          placeholderTextColor="#000"
          onChangeText={operations.handleNameChange}
        />
        <TextInput
          style={[styles.textInput, styles.underline]}
          placeholder={models?.user?.name.split(" ", 2)[1]}
          placeholderTextColor="#000"
          onChangeText={operations.handleSurnameChange}
        />
        <View style={styles.row}>
          <TextInput
            style={[styles.textInput, styles.shortInput]}
            value={`+${extractCountryCode(models?.user?.phone)}`}
            placeholderTextColor="#000"
            editable={false}
          />
          <View style={styles.inputWithIconUnderline}>
            <Image
              source={phoneIcon}
              style={styles.icon_small}
              resizeMode="contain"
            />
            <TextInput
              style={[styles.textInput, styles.longInput]}
              placeholder={extractPhoneNumber(models?.user?.phone)}
              placeholderTextColor="#000"
              value={models?.phoneNumberInput}
              onChangeText={operations.handlePhoneNumberChange}
              keyboardType="numeric"
            />
          </View>
        </View>
        <View style={styles.inputWithIconUnderline}>
          <Image source={emailIcon} style={styles.icon_small} resizeMode="contain" />
          <TextInput
            style={styles.textInput}
            placeholder={models?.user?.email}
            placeholderTextColor="#000"
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
      <TouchableOpacity>
        <View style={styles.settingsContainer}>
          <Image source={optionsIcon} style={styles.icon} resizeMode="contain" />
          <Text style={styles.settingsText}>Definições</Text>
          <Icon name="arrow-forward-ios" size={scale(25)} color="#000" />
        </View>
      </TouchableOpacity>
      <TouchableOpacity>
        <View style={styles.logoutContainer}>
          <Image source={leaveIcon} style={styles.icon} resizeMode="contain" />
          <Text style={styles.logoutText}>Sair</Text>
        </View>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    marginHorizontal: scale(20),
  },
  headerContainer: {
    height: "20%",
    flexDirection: "row",
  },
  backButton: {
    marginTop: scale(50),
  },
  headerText: {
    fontWeight: "bold",
    fontSize: scale(18),
    marginTop: scale(50),
    marginLeft: scale(100),
    textAlign: "center",
    color: "#0089FF",
  },
  profileImageContainer: {
    width: scale(100),
    height: scale(100),
    borderRadius: scale(75),
    borderColor: "#0089FF",
    borderWidth: scale(2),
    padding: scale(3),
    alignSelf: "center",
  },
  profileImage: {
    width: "100%",
    height: "100%",
    borderRadius: scale(75),
  },
  editIconContainer: {
    position: "absolute",
    bottom: scale(5),
    right: scale(5),
    backgroundColor: "#0089FF",
    borderRadius: scale(15),
    width: scale(30),
    height: scale(30),
    justifyContent: "center",
    alignItems: "center",
    borderWidth: scale(2),
    borderColor: "#FFF",
  },
  textInput: {
    color: "black",
    fontSize: scale(14),
    padding: scale(5),
    marginBottom: scale(7),
  },
  row: {
    flexDirection: "row",
    
  },
  shortInput: {
    marginRight: scale(15),
    width: scale(75),
    borderBottomWidth: scale(0.5),
  },
  longInput: {
   width: scale(190),
  },
  inputWithIcon: {
    flexDirection: "row",
    alignItems: "center",
  },
  inputWithIconUnderline: {
    flexDirection: "row",
    alignItems: "center",
    borderBottomWidth: scale(0.5),
    marginBottom: scale(7),
  },
  icon_small: {
    width: scale(18),
    height: scale(18),
    marginRight: scale(10),
  },
  icon: {
    width: scale(25),
    height: scale(25),
    marginRight: scale(5),
  },
  saveButton: {
    width: scale(310),
    height: scale(55),
    borderRadius: scale(7),
    backgroundColor: "#0089ff",
    marginHorizontal: scale(20),
    justifyContent: "center",
    alignItems: "center",
    alignSelf: "center",
    marginTop: scale(20),
    marginBottom: scale(35),
  },
  saveButtonDisabled: {
    backgroundColor: "#cccccc",
  },
  saveButtonText: {
    color: "#fff",
    fontSize: scale(18),
  },
  settingsContainer: {
    flexDirection: "row",
  },
  settingsText: {
    fontSize: scale(18),
    marginLeft: scale(20),
    marginRight: scale(150),
  },
  logoutContainer: {
    flexDirection: "row",
    justifyContent: "center",
    marginTop: scale(50),
  },
  logoutText: {
    fontSize: scale(18),
    color: "#0089FF",
    marginLeft: scale(10),
  },
  underline: {
    borderBottomWidth: 1,
    borderBottomColor: "#000",
  },
});

export default ProfileScreen;
