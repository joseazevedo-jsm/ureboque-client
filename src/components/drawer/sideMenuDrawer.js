import React, { useContext, useCallback } from "react";
import {
  View,
  Text,
  Image,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { scale } from "react-native-size-matters";
import Icon from "react-native-vector-icons/MaterialIcons";
import Animated, { FadeInLeft } from "react-native-reanimated";
import { UserContext } from "../../context/UserContext";
import { useUserData } from "../../context/UserDataContext";
import { useTripState } from "../../context/TripStateContext";
import { useAlert } from "../../context/AlertContext";
import { colors, spacing, borderRadius, shadows } from "../../theme";

const MAIN_ITEMS = [
  { route: "Map",         label: "Início",          icon: "home" },
  { route: "Perfil",      label: "Perfil",           icon: "person" },
  { route: "Historico",   label: "Histórico",        icon: "history" },
  { route: "Promocoes",   label: "Promoções",        icon: "local-offer" },
  { route: "Notificacoes",label: "Notificações",     icon: "notifications" },
  { route: "Convidar",    label: "Convidar Amigos",  icon: "group-add" },
];

const BOTTOM_ITEMS = [
  { route: "ComplaintsScreen", label: "Reclamacoes", icon: "support-agent" },
  { route: "SettingsScreen", label: "Definições", icon: "settings" },
];

const MenuItem = ({ label, icon, active, badge, onPress, delay }) => (
  <Animated.View entering={FadeInLeft.delay(delay).springify().damping(28).stiffness(180)}>
    <TouchableOpacity
      style={[styles.menuItem, active && styles.menuItemActive]}
      onPress={onPress}
      activeOpacity={0.7}
    >
      <View style={[styles.menuIconWrap, active && styles.menuIconWrapActive]}>
        <Icon
          name={icon}
          size={scale(20)}
          color={active ? colors.primary : colors.textSecondary}
        />
      </View>
      <Text style={[styles.menuLabel, active && styles.menuLabelActive]}>
        {label}
      </Text>
      {badge > 0 && (
        <View style={styles.badge}>
          <Text style={styles.badgeText}>{badge > 99 ? "99+" : badge}</Text>
        </View>
      )}
    </TouchableOpacity>
  </Animated.View>
);

const SideMenuDrawer = (props) => {
  const insets = useSafeAreaInsets();
  const { user, logout } = useContext(UserContext);
  const { unreadNotificationsCount } = useUserData();
  const { isTripActive } = useTripState();
  const { showAlert } = useAlert();

  const activeRoute = props.state?.routeNames?.[props.state?.index];

  const navigateWithGuard = useCallback((screenName, params) => {
    if (isTripActive) {
      showAlert({
        type: "confirmation",
        title: "Viagem em andamento",
        message: "Tem uma viagem ativa. Deseja sair desta tela?",
        buttons: [
          { text: "Cancelar", style: "cancel" },
          { text: "Continuar", onPress: () => props.navigation.navigate(screenName, params) },
        ],
      });
    } else {
      props.navigation.navigate(screenName, params);
    }
  }, [isTripActive, showAlert, props.navigation]);

  const handleLogout = useCallback(() => {
    showAlert({
      type: "confirmation",
      title: "Terminar Sessão",
      message: "Tem a certeza que deseja sair da sua conta?",
      buttons: [
        { text: "Cancelar", style: "cancel" },
        { text: "Sair", style: "destructive", onPress: () => logout() },
      ],
    });
  }, [showAlert, logout]);

  return (
    <View style={styles.container}>
      {/* Header */}
      <Animated.View
        style={[styles.header, { paddingTop: insets.top + spacing.xl }]}
        entering={FadeInLeft.delay(0).springify().damping(28).stiffness(180)}
      >
        <View style={styles.avatarRing}>
          <Image
            source={
              user?.photo
                ? { uri: user.photo }
                : require("../../../resources/icons/side_bar/profile.png")
            }
            style={styles.avatar}
          />
        </View>
        <View style={styles.userInfo}>
          <Text style={styles.userName} numberOfLines={1}>
            {user?.name ?? "Utilizador"}
          </Text>
          <Text style={styles.userSub} numberOfLines={1}>
            {user?.phone ?? user?.email ?? ""}
          </Text>
        </View>
      </Animated.View>

      {/* Nav Items */}
      <ScrollView
        style={styles.scroll}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        <View style={styles.section}>
          {MAIN_ITEMS.map((item, i) => (
            <MenuItem
              key={item.route}
              label={item.label}
              icon={item.icon}
              active={activeRoute === item.route}
              badge={item.route === "Notificacoes" ? unreadNotificationsCount : 0}
              onPress={() => navigateWithGuard(item.route)}
              delay={40 + i * 40}
            />
          ))}
        </View>

        <View style={styles.divider} />

        <View style={styles.section}>
          {BOTTOM_ITEMS.map((item, i) => (
            <MenuItem
              key={item.route}
              label={item.label}
              icon={item.icon}
              active={activeRoute === item.route}
              onPress={() => navigateWithGuard(item.route)}
              delay={280 + i * 40}
            />
          ))}
        </View>
      </ScrollView>

      {/* Logout */}
      <Animated.View
        style={[styles.logoutWrapper, { paddingBottom: insets.bottom + spacing.lg }]}
        entering={FadeInLeft.delay(340).springify().damping(28).stiffness(180)}
      >
        <View style={styles.divider} />
        <TouchableOpacity
          style={styles.logoutButton}
          onPress={handleLogout}
          activeOpacity={0.7}
        >
          <View style={styles.logoutIconWrap}>
            <Icon name="logout" size={scale(20)} color={colors.error} />
          </View>
          <Text style={styles.logoutLabel}>Terminar Sessão</Text>
        </TouchableOpacity>
      </Animated.View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.surface,
    borderTopRightRadius: scale(24),
    borderBottomRightRadius: scale(24),
    overflow: "hidden",
    ...shadows.lg,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: colors.primary,
    paddingHorizontal: spacing.xxl,
    paddingBottom: spacing.xxl,
    gap: spacing.lg,
  },
  avatarRing: {
    borderRadius: scale(36),
    borderWidth: 2,
    borderColor: "rgba(255,255,255,0.4)",
    padding: 3,
  },
  avatar: {
    width: scale(56),
    height: scale(56),
    borderRadius: scale(28),
    backgroundColor: "rgba(255,255,255,0.15)",
  },
  userInfo: {
    flex: 1,
  },
  userName: {
    color: colors.surface,
    fontSize: scale(16),
    fontWeight: "700",
    letterSpacing: 0.2,
    marginBottom: scale(3),
  },
  userSub: {
    color: "rgba(255,255,255,0.7)",
    fontSize: scale(12),
    fontWeight: "500",
  },
  scroll: {
    flex: 1,
  },
  scrollContent: {
    paddingVertical: spacing.lg,
  },
  section: {
    paddingHorizontal: spacing.lg,
  },
  menuItem: {
    flexDirection: "row",
    alignItems: "center",
    borderRadius: borderRadius.lg,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.md,
    marginBottom: scale(2),
  },
  menuItemActive: {
    backgroundColor: colors.primaryLight,
  },
  menuIconWrap: {
    width: scale(36),
    height: scale(36),
    borderRadius: borderRadius.md,
    justifyContent: "center",
    alignItems: "center",
    marginRight: spacing.md,
    backgroundColor: colors.background,
  },
  menuIconWrapActive: {
    backgroundColor: "rgba(0,137,255,0.12)",
  },
  menuLabel: {
    flex: 1,
    fontSize: scale(14),
    fontWeight: "600",
    color: colors.textSecondary,
  },
  menuLabelActive: {
    color: colors.primary,
    fontWeight: "700",
  },
  badge: {
    backgroundColor: colors.error,
    borderRadius: scale(10),
    minWidth: scale(20),
    height: scale(20),
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: scale(5),
  },
  badgeText: {
    color: colors.surface,
    fontSize: scale(10),
    fontWeight: "700",
  },
  divider: {
    height: 1,
    backgroundColor: colors.borderLight,
    marginHorizontal: spacing.xxl,
    marginVertical: spacing.lg,
  },
  logoutWrapper: {
    paddingHorizontal: spacing.lg,
  },
  logoutButton: {
    flexDirection: "row",
    alignItems: "center",
    borderRadius: borderRadius.lg,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.md,
  },
  logoutIconWrap: {
    width: scale(36),
    height: scale(36),
    borderRadius: borderRadius.md,
    justifyContent: "center",
    alignItems: "center",
    marginRight: spacing.md,
    backgroundColor: colors.errorLight,
  },
  logoutLabel: {
    fontSize: scale(14),
    fontWeight: "600",
    color: colors.error,
  },
});

export default SideMenuDrawer;
