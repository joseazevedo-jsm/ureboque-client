import React from "react";
import { version as appVersion } from '../../package.json';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
} from "react-native";
import { scale } from "react-native-size-matters";
import { useNavigation } from "@react-navigation/native";
import Icon from "react-native-vector-icons/MaterialIcons";
import useSettingsScreen from "../components/settings/useSettingsScreen";
import { useLogger } from "../hooks/useLogger";
import { useAlert } from "../context/AlertContext";
import Animated, { FadeInDown } from "react-native-reanimated";
import { colors, spacing, borderRadius, shadows, typography } from "../theme";

const SettingsScreen = () => {
  const logger = useLogger("SettingsScreen", {
    enableLifecycleLogging: true,
    logProps: true,
  });

  const navigation = useNavigation();
  const { models, operations } = useSettingsScreen();
  const { showAlert } = useAlert();

  const SettingItem = ({
    icon,
    title,
    subtitle,
    onPress,
    showArrow = true,
    danger = false,
    last = false,
    disabled = false,
  }) => (
    <TouchableOpacity
      style={[styles.settingItem, last && styles.settingItemLast, disabled && styles.settingItemDisabled]}
      onPress={disabled ? undefined : onPress}
      activeOpacity={disabled ? 1 : 0.7}
      disabled={disabled}
    >
      <View style={[styles.settingIconWrap, danger && styles.settingIconWrapDanger]}>
        <Icon
          name={icon}
          size={scale(20)}
          color={danger ? colors.error : colors.primary}
        />
      </View>
      <View style={styles.settingContent}>
        <Text style={[styles.settingTitle, danger && styles.dangerText]}>
          {title}
        </Text>
        {subtitle && (
          <Text style={styles.settingSubtitle}>{subtitle}</Text>
        )}
      </View>
      {showArrow && !disabled && (
        <Icon name="chevron-right" size={scale(18)} color={colors.textMuted} />
      )}
    </TouchableOpacity>
  );

  const SettingSection = ({ title, children, delay = 0 }) => (
    <Animated.View
      entering={FadeInDown.delay(delay).springify().damping(28).stiffness(180)}
      style={styles.section}
    >
      {title ? <Text style={styles.sectionTitle}>{title}</Text> : null}
      <View style={styles.sectionCard}>{children}</View>
    </Animated.View>
  );

  return (
    <View style={styles.container}>
      <Animated.View
        style={styles.header}
        entering={FadeInDown.delay(0).springify().damping(28).stiffness(180)}
      >
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.goBack()}
          activeOpacity={0.7}
        >
          <Icon name="arrow-back" size={scale(22)} color={colors.primary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>DEFINIÇÕES</Text>
        <View style={styles.headerSpacer} />
      </Animated.View>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <SettingSection title="Segurança" delay={60}>
          <SettingItem
            icon="lock"
            title="Alterar Senha"
            subtitle="Mude a sua senha de acesso"
            onPress={() => operations.handleChangePassword()}
          />
          <SettingItem
            icon="security"
            title="Autenticação de Dois Fatores"
            subtitle="Em breve"
            last
            disabled
          />
        </SettingSection>

        <SettingSection title="Conta" delay={130}>
          <SettingItem
            icon="person"
            title="Informações Pessoais"
            subtitle="Gerir os seus dados pessoais"
            onPress={() => navigation.goBack()}
          />
          <SettingItem
            icon="privacy-tip"
            title="Privacidade"
            subtitle="Em breve"
            last
            disabled
          />
        </SettingSection>

        <SettingSection title="Notificações" delay={200}>
          <SettingItem
            icon="notifications"
            title="Notificações Push"
            subtitle="Em breve"
            disabled
          />
          <SettingItem
            icon="email"
            title="Notificações por Email"
            subtitle="Em breve"
            last
            disabled
          />
        </SettingSection>

        <SettingSection title="Preferências" delay={270}>
          <SettingItem
            icon="language"
            title="Idioma"
            subtitle="Em breve"
            disabled
          />
          <SettingItem
            icon="palette"
            title="Tema"
            subtitle="Em breve"
            last
            disabled
          />
        </SettingSection>

        <SettingSection title="Sobre" delay={340}>
          <SettingItem
            icon="info"
            title="Versão do App"
            subtitle={appVersion}
            showArrow={false}
            onPress={() => {}}
          />
          <SettingItem
            icon="description"
            title="Termos de Serviço"
            subtitle="Em breve"
            onPress={() => {}}
          />
          <SettingItem
            icon="policy"
            title="Política de Privacidade"
            subtitle="Em breve"
            last
            onPress={() => {}}
          />
        </SettingSection>

        <Animated.View
          entering={FadeInDown.delay(410).springify().damping(28).stiffness(180)}
        >
          <TouchableOpacity
            style={styles.logoutButton}
            onPress={() =>
              showAlert({
                type: 'warning',
                title: 'Terminar Sessão',
                message: 'Tem a certeza que deseja terminar sessão?',
                buttons: [
                  { text: 'Cancelar' },
                  { text: 'Terminar', onPress: () => operations.handleLogout() },
                ],
              })
            }
            activeOpacity={0.8}
          >
            <Icon name="logout" size={scale(20)} color={colors.error} />
            <Text style={styles.logoutText}>Terminar Sessão</Text>
          </TouchableOpacity>
        </Animated.View>

        <View style={styles.bottomPadding} />
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  header: {
    paddingTop: spacing.headerHeight,
    paddingBottom: spacing.xl,
    paddingHorizontal: spacing.xxl,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  backButton: {
    width: scale(40),
    height: scale(40),
    borderRadius: borderRadius.xxl,
    backgroundColor: colors.surface,
    justifyContent: "center",
    alignItems: "center",
    ...shadows.sm,
  },
  headerTitle: {
    ...typography.h3,
    fontSize: scale(17),
    letterSpacing: 0.8,
  },
  headerSpacer: {
    width: scale(40),
  },
  scroll: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: spacing.xxl,
    paddingTop: spacing.sm,
  },
  section: {
    marginBottom: spacing.xxl,
  },
  sectionTitle: {
    ...typography.sectionTitle,
    marginBottom: spacing.md,
    marginLeft: spacing.xs,
  },
  sectionCard: {
    backgroundColor: colors.surface,
    borderRadius: borderRadius.xl,
    borderWidth: 1,
    borderColor: colors.borderLight,
    overflow: "hidden",
    ...shadows.sm,
  },
  settingItem: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: scale(14),
    paddingHorizontal: spacing.lg,
    borderBottomWidth: 1,
    borderBottomColor: colors.borderLight,
  },
  settingItemLast: {
    borderBottomWidth: 0,
  },
  settingItemDisabled: {
    opacity: 0.45,
  },
  settingIconWrap: {
    width: scale(36),
    height: scale(36),
    borderRadius: borderRadius.md,
    backgroundColor: colors.primaryLight,
    justifyContent: "center",
    alignItems: "center",
    marginRight: spacing.md,
  },
  settingIconWrapDanger: {
    backgroundColor: colors.errorLight,
  },
  settingContent: {
    flex: 1,
  },
  settingTitle: {
    fontSize: scale(15),
    fontWeight: "600",
    color: colors.textPrimary,
  },
  settingSubtitle: {
    fontSize: scale(12),
    color: colors.textMuted,
    marginTop: scale(2),
  },
  dangerText: {
    color: colors.error,
  },
  logoutButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: colors.errorLight,
    borderRadius: borderRadius.xl,
    paddingVertical: spacing.lg,
    borderWidth: 1,
    borderColor: colors.errorBorder,
    gap: spacing.sm,
  },
  logoutText: {
    fontSize: scale(15),
    fontWeight: "700",
    color: colors.error,
  },
  bottomPadding: {
    height: scale(40),
  },
});

export default SettingsScreen;
