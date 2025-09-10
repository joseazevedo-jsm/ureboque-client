import React from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Alert,
} from "react-native";
import { scale } from "react-native-size-matters";
import { useNavigation } from "@react-navigation/native";
import Icon from "react-native-vector-icons/MaterialIcons";
import useSettingsScreen from "../components/settings/useSettingsScreen";
import { useLogger } from "../hooks/useLogger";

const SettingsScreen = () => {
  const logger = useLogger('SettingsScreen', { 
    enableLifecycleLogging: true,
    logProps: true 
  });
  
  const navigation = useNavigation();
  const { models, operations } = useSettingsScreen();
  
  logger.debug('SettingsScreen rendered', {
    hasUser: !!models?.user,
    userName: models?.user?.name
  });

  const SettingItem = ({ icon, title, subtitle, onPress, showArrow = true, danger = false }) => (
    <TouchableOpacity style={styles.settingItem} onPress={onPress}>
      <View style={styles.settingIcon}>
        <Icon name={icon} size={scale(24)} color={danger ? "#E53E3E" : "#4A5568"} />
      </View>
      <View style={styles.settingContent}>
        <Text style={[styles.settingTitle, danger && styles.dangerText]}>{title}</Text>
        {subtitle && <Text style={styles.settingSubtitle}>{subtitle}</Text>}
      </View>
      {showArrow && (
        <Icon name="arrow-forward-ios" size={scale(16)} color="#A0AEC0" />
      )}
    </TouchableOpacity>
  );

  const SettingSection = ({ title, children }) => (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>{title}</Text>
      <View style={styles.sectionContent}>
        {children}
      </View>
    </View>
  );

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.headerContainer}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => {
            logger.logUserInteraction('back_button_pressed', { from: 'SettingsScreen' });
            logger.logNavigation('SettingsScreen', 'previous', { action: 'back' });
            navigation.goBack();
          }}
        >
          <Icon name="arrow-back" size={scale(25)} color="#0089FF" />
        </TouchableOpacity>
        <Text style={styles.headerText}>DEFINIÇÕES</Text>
      </View>

      <ScrollView 
        style={styles.scrollContainer}
        contentContainerStyle={styles.contentContainer}
        showsVerticalScrollIndicator={false}
      >
        {/* Security Section */}
        <SettingSection title="Segurança">
          <SettingItem
            icon="lock"
            title="Alterar Senha"
            subtitle="Mude a sua senha de acesso"
            onPress={() => {
              logger.logUserInteraction('change_password_pressed', { from: 'SettingsScreen' });
              operations.handleChangePassword();
            }}
          />
          <SettingItem
            icon="security"
            title="Autenticação de Dois Fatores"
            subtitle="Proteja a sua conta com 2FA"
            onPress={() => {
              logger.logUserInteraction('two_factor_pressed', { from: 'SettingsScreen' });
              Alert.alert("2FA", "Funcionalidade em desenvolvimento");
            }}
          />
        </SettingSection>

        {/* Account Section */}
        <SettingSection title="Conta">
          <SettingItem
            icon="person"
            title="Informações Pessoais"
            subtitle="Gerir os seus dados pessoais"
            onPress={() => {
              logger.logUserInteraction('personal_info_pressed', { from: 'SettingsScreen' });
              navigation.goBack(); // Go back to ProfileScreen
            }}
          />
          <SettingItem
            icon="privacy_tip"
            title="Privacidade"
            subtitle="Controle a privacidade da sua conta"
            onPress={() => {
              logger.logUserInteraction('privacy_pressed', { from: 'SettingsScreen' });
              Alert.alert("Privacidade", "Funcionalidade em desenvolvimento");
            }}
          />
        </SettingSection>

        {/* Notifications Section */}
        <SettingSection title="Notificações">
          <SettingItem
            icon="notifications"
            title="Notificações Push"
            subtitle="Gerir notificações do aplicativo"
            onPress={() => {
              logger.logUserInteraction('push_notifications_pressed', { from: 'SettingsScreen' });
              Alert.alert("Notificações", "Funcionalidade em desenvolvimento");
            }}
          />
          <SettingItem
            icon="email"
            title="Notificações por Email"
            subtitle="Receber notificações por email"
            onPress={() => {
              logger.logUserInteraction('email_notifications_pressed', { from: 'SettingsScreen' });
              Alert.alert("Email", "Funcionalidade em desenvolvimento");
            }}
          />
        </SettingSection>

        {/* Preferences Section */}
        <SettingSection title="Preferências">
          <SettingItem
            icon="language"
            title="Idioma"
            subtitle="Português"
            onPress={() => {
              logger.logUserInteraction('language_pressed', { from: 'SettingsScreen' });
              Alert.alert("Idioma", "Funcionalidade em desenvolvimento");
            }}
          />
          <SettingItem
            icon="palette"
            title="Tema"
            subtitle="Claro"
            onPress={() => {
              logger.logUserInteraction('theme_pressed', { from: 'SettingsScreen' });
              Alert.alert("Tema", "Funcionalidade em desenvolvimento");
            }}
          />
        </SettingSection>

        {/* About Section */}
        <SettingSection title="Sobre">
          <SettingItem
            icon="info"
            title="Versão do App"
            subtitle="1.0.0"
            onPress={() => {
              logger.logUserInteraction('app_version_pressed', { from: 'SettingsScreen' });
            }}
            showArrow={false}
          />
          <SettingItem
            icon="description"
            title="Termos de Serviço"
            onPress={() => {
              logger.logUserInteraction('terms_pressed', { from: 'SettingsScreen' });
              Alert.alert("Termos", "Funcionalidade em desenvolvimento");
            }}
          />
          <SettingItem
            icon="policy"
            title="Política de Privacidade"
            onPress={() => {
              logger.logUserInteraction('privacy_policy_pressed', { from: 'SettingsScreen' });
              Alert.alert("Política", "Funcionalidade em desenvolvimento");
            }}
          />
        </SettingSection>

        {/* Logout Section */}
        <SettingSection title="">
          <SettingItem
            icon="logout"
            title="Terminar Sessão"
            onPress={() => {
              logger.logUserInteraction('logout_pressed', { from: 'SettingsScreen' });
              operations.handleLogout();
            }}
            showArrow={false}
            danger={true}
          />
        </SettingSection>
      </ScrollView>
    </View>
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
    paddingHorizontal: scale(20),
    paddingTop: scale(30),
    backgroundColor: "#fff",
  },
  backButton: {
    padding: scale(5),
  },
  headerText: {
    fontWeight: "bold",
    fontSize: scale(18),
    color: "#0089FF",
    marginLeft: scale(80),
  },
  scrollContainer: {
    flex: 1,
  },
  contentContainer: {
    paddingHorizontal: scale(20),
    paddingVertical: scale(20),
    paddingBottom: scale(40),
  },
  section: {
    marginBottom: scale(30),
  },
  sectionTitle: {
    fontSize: scale(14),
    fontWeight: '600',
    color: '#4A5568',
    marginBottom: scale(12),
    marginLeft: scale(4),
    letterSpacing: scale(0.5),
    textTransform: 'uppercase',
  },
  sectionContent: {
    backgroundColor: '#FFFFFF',
    borderRadius: scale(12),
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: scale(2),
    },
    shadowOpacity: 0.05,
    shadowRadius: scale(8),
    elevation: 3,
  },
  settingItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: scale(16),
    paddingHorizontal: scale(16),
    borderBottomWidth: 0.5,
    borderBottomColor: '#E2E8F0',
  },
  settingIcon: {
    width: scale(40),
    height: scale(40),
    borderRadius: scale(20),
    backgroundColor: '#F7FAFC',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: scale(12),
  },
  settingContent: {
    flex: 1,
  },
  settingTitle: {
    fontSize: scale(16),
    fontWeight: '500',
    color: '#2D3748',
    marginBottom: scale(2),
  },
  settingSubtitle: {
    fontSize: scale(12),
    color: '#718096',
    lineHeight: scale(16),
  },
  dangerText: {
    color: '#E53E3E',
  },
});

export default SettingsScreen;