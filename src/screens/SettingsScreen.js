import { useSafeAreaInsets } from "react-native-safe-area-context";
import React from "react";
import { version as appVersion } from "../../package.json";
import { View, StyleSheet, ScrollView } from 'react-native';
import { AppText as Text } from '../components/common/AppText';
import { AppPressable as TouchableOpacity } from '../components/common/AppPressable';
import { AppHeader } from '../components/common/AppHeader';

import { scale } from "react-native-size-matters";
import { useNavigation } from "@react-navigation/native";
import MaterialIcons from "@expo/vector-icons/MaterialIcons";
const Icon = MaterialIcons;
import Animated, { FadeInDown } from "react-native-reanimated";
import useSettingsScreen from "../components/settings/useSettingsScreen";
import { useAlert } from "../context/AlertContext";
import { colors, spacing, borderRadius, shadows, typography, sizes, layout } from "../theme";

const SettingItem = ({ icon, title, subtitle, onPress, danger = false, last = false }) => (
  <TouchableOpacity
    style={[styles.item, last && styles.itemLast]}
    onPress={onPress}
    activeOpacity={0.7}
  >
    <View style={[styles.itemIcon, danger && styles.itemIconDanger]}>
      <Icon name={icon} size={scale(20)} color={danger ? colors.error : colors.primary} />
    </View>
    <View style={styles.itemContent}>
      <Text style={[styles.itemTitle, danger && styles.dangerText]}>{title}</Text>
      {subtitle ? <Text style={styles.itemSubtitle}>{subtitle}</Text> : null}
    </View>
    <Icon name="chevron-right" size={sizes.icon} color={colors.textMuted} />
  </TouchableOpacity>
);

const Section = ({ title, children, delay }) => (
  <Animated.View
    style={styles.section}
    entering={FadeInDown.delay(delay).springify().damping(28).stiffness(180)}
  >
    <Text style={styles.sectionTitle}>{title}</Text>
    <View style={styles.sectionCard}>{children}</View>
  </Animated.View>
);

const SettingsScreen = () => {
  const insets = useSafeAreaInsets();
  const navigation = useNavigation();
  const { operations } = useSettingsScreen();
  const { showAlert } = useAlert();

  return (
    <View style={[styles.container, { paddingBottom: insets.bottom }]}>
      <AppHeader
        title="DEFINIÇÕES"
        leftIcon="menu"
        leftLabel="Abrir menu"
        onLeftPress={() => navigation.openDrawer()}
        style={styles.header}
      />

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        <Section title="Segurança" delay={60}>
          <SettingItem
            icon="lock"
            title="Alterar Palavra-passe"
            subtitle="Enviar email de redefinição"
            onPress={() => operations.handleChangePassword()}
            last
          />
        </Section>

        <Section title="Conta" delay={130}>
          <SettingItem
            icon="person"
            title="Informações da Conta"
            subtitle="Gerir os seus dados pessoais"
            onPress={() => navigation.navigate("Perfil")}
            last
          />
        </Section>

        <Section title="Sobre" delay={200}>
          <SettingItem
            icon="info-outline"
            title="Versão"
            subtitle={`Ureboque v${appVersion}`}
            onPress={() => {}}
          />
          <SettingItem
            icon="support-agent"
            title="Contacte-nos"
            subtitle="WhatsApp, email ou chamada"
            onPress={() => navigation.navigate("ComplaintsScreen")}
          />
          <SettingItem
            icon="description"
            title="Termos de Serviço"
            onPress={() => navigation.navigate("TermsScreen", { type: "terms" })}
          />
          <SettingItem
            icon="policy"
            title="Política de Privacidade"
            onPress={() => navigation.navigate("PrivacyPolicyScreen", { type: "privacy" })}
            last
          />
        </Section>

        <Animated.View
          entering={FadeInDown.delay(270).springify().damping(28).stiffness(180)}
        >
          <TouchableOpacity
            style={styles.logoutButton}
            onPress={() =>
              showAlert({
                type: "warning",
                title: "Terminar Sessão",
                message: "Tem a certeza que deseja terminar sessão?",
                buttons: [
                  { text: "Cancelar", style: "cancel" },
                  { text: "Terminar", onPress: () => operations.handleLogout() },
                ],
              })
            }
            activeOpacity={0.8}
          >
            <Icon name="logout" size={scale(20)} color={colors.error} />
            <Text style={styles.logoutText}>Terminar Sessão</Text>
          </TouchableOpacity>
        </Animated.View>

        <View style={{ height: scale(40) }} />
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
    maxWidth: layout.contentMaxWidth,
    alignSelf: "center",
  },
  scrollContent: {
    width: "100%",
    maxWidth: layout.contentMaxWidth,
    alignSelf: "center",
    paddingHorizontal: spacing.xl,
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
  item: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.lg,
    borderBottomWidth: 1,
    borderBottomColor: colors.borderLight,
  },
  itemLast: {
    borderBottomWidth: 0,
  },
  itemIcon: {
    width: scale(36),
    height: scale(36),
    borderRadius: borderRadius.md,
    backgroundColor: colors.primaryLight,
    justifyContent: "center",
    alignItems: "center",
    marginRight: spacing.md,
  },
  itemIconDanger: {
    backgroundColor: colors.errorLight,
  },
  itemContent: {
    flex: 1,
  },
  itemTitle: {
    fontSize: typography.bodySmall.fontSize, lineHeight: typography.bodySmall.lineHeight,
    fontWeight: "600",
    color: colors.textPrimary,
  },
  itemSubtitle: {
    fontSize: typography.caption.fontSize, lineHeight: typography.caption.lineHeight,
    color: colors.textMuted,
    marginTop: spacing.xs,
  },
  dangerText: {
    color: colors.error,
  },
  logoutButton: {
    minHeight: sizes.control,
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
    fontSize: typography.bodySmall.fontSize, lineHeight: typography.bodySmall.lineHeight,
    fontWeight: "700",
    color: colors.error,
  },
});

export default SettingsScreen;
