import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Clipboard,
  Share,
  ActivityIndicator,
  Vibration,
} from "react-native";
import { scale } from "react-native-size-matters";
import { useNavigation } from "@react-navigation/native";
import Icon from "react-native-vector-icons/MaterialIcons";
import Animated, { FadeInDown } from "react-native-reanimated";
import { useInviteScreen } from "../components/invite/useInviteScreen";
import { useLogger } from "../hooks/useLogger";
import { useAlert } from "../context/AlertContext";
import { colors, spacing, shadows, borderRadius } from "../theme";

const InviteScreen = () => {
  const logger = useLogger("InviteScreen");
  const { models, operations } = useInviteScreen();
  const navigation = useNavigation();
  const { showAlert } = useAlert();

  const [isSharing, setIsSharing] = useState(false);
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    if (!models.inviteCode) return;
    Clipboard.setString(models.inviteCode);
    Vibration.vibrate(50);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
    logger.info("Invite code copied");
  };

  const handleShare = async () => {
    if (!models.inviteCode) return;
    setIsSharing(true);
    try {
      Vibration.vibrate(80);
      await Share.share({
        message: `Use o meu código ${models.inviteCode} no Ureboque e ganhe 30% de desconto na sua primeira viagem!`,
        title: "Convite Ureboque",
      });
      logger.info("Invite code shared");
    } catch (error) {
      logger.error("Share failed", error);
      showAlert({ type: "error", title: "Erro", message: "Não foi possível partilhar o código" });
    } finally {
      setIsSharing(false);
    }
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <Animated.View
        style={styles.header}
        entering={FadeInDown.delay(0).springify().damping(28).stiffness(180)}
      >
        <TouchableOpacity
          style={styles.menuButton}
          onPress={() => navigation.openDrawer()}
          activeOpacity={0.7}
        >
          <Icon name="menu" size={scale(22)} color={colors.primary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>CONVIDAR AMIGOS</Text>
        <View style={styles.headerSpacer} />
      </Animated.View>

      <ScrollView showsVerticalScrollIndicator={false}>

        {/* Hero Card */}
        <Animated.View
          style={styles.heroCard}
          entering={FadeInDown.delay(60).springify().damping(28).stiffness(180)}
        >
          <View style={styles.heroIconCircle}>
            <Icon name="card-giftcard" size={scale(32)} color={colors.surface} />
          </View>
          <Text style={styles.heroTitle}>Convide e Ganhe</Text>
          <Text style={styles.heroSubtitle}>
            Partilhe o Ureboque com amigos.{"\n"}Todo o mundo sai a ganhar!
          </Text>
        </Animated.View>

        {/* Benefits */}
        <View style={styles.section}>
          <Animated.View
            style={styles.benefitCard}
            entering={FadeInDown.delay(120).springify().damping(28).stiffness(180)}
          >
            <View style={[styles.benefitIcon, { backgroundColor: colors.primaryLight }]}>
              <Icon name="person-add" size={scale(22)} color={colors.primary} />
            </View>
            <View style={styles.benefitText}>
              <Text style={styles.benefitTitle}>O seu amigo ganha 30%</Text>
              <Text style={styles.benefitDesc}>De desconto na primeira viagem</Text>
            </View>
          </Animated.View>

          <Animated.View
            style={styles.benefitCard}
            entering={FadeInDown.delay(160).springify().damping(28).stiffness(180)}
          >
            <View style={[styles.benefitIcon, { backgroundColor: colors.successLight }]}>
              <Icon name="monetization-on" size={scale(22)} color={colors.success} />
            </View>
            <View style={styles.benefitText}>
              <Text style={styles.benefitTitle}>Você ganha 50%</Text>
              <Text style={styles.benefitDesc}>Assim que ele completar a viagem</Text>
            </View>
          </Animated.View>
        </View>

        {/* Invite Code */}
        <Animated.View
          style={styles.section}
          entering={FadeInDown.delay(220).springify().damping(28).stiffness(180)}
        >
          <Text style={styles.sectionLabel}>O seu código de convite</Text>
          <View style={styles.codeCard}>
            {models.isLoading ? (
              <ActivityIndicator color={colors.primary} />
            ) : models.error ? (
              <View style={styles.errorRow}>
                <Icon name="error-outline" size={scale(18)} color={colors.error} />
                <Text style={styles.errorText}>Não foi possível carregar o código</Text>
              </View>
            ) : (
              <View style={styles.codeRow}>
                <Text style={styles.codeText}>{models.inviteCode ?? "—"}</Text>
                <TouchableOpacity
                  style={[styles.copyButton, copied && styles.copyButtonSuccess]}
                  onPress={handleCopy}
                  disabled={!models.inviteCode}
                  activeOpacity={0.8}
                >
                  <Icon
                    name={copied ? "check" : "content-copy"}
                    size={scale(18)}
                    color={copied ? colors.success : colors.primary}
                  />
                  <Text style={[styles.copyText, copied && styles.copyTextSuccess]}>
                    {copied ? "Copiado" : "Copiar"}
                  </Text>
                </TouchableOpacity>
              </View>
            )}
          </View>
        </Animated.View>

        {/* Share Button */}
        <Animated.View
          style={styles.section}
          entering={FadeInDown.delay(280).springify().damping(28).stiffness(180)}
        >
          <TouchableOpacity
            style={[styles.shareButton, (!models.inviteCode || isSharing) && styles.shareButtonDisabled]}
            onPress={handleShare}
            disabled={!models.inviteCode || isSharing}
            activeOpacity={0.8}
          >
            {isSharing ? (
              <ActivityIndicator color={colors.surface} />
            ) : (
              <>
                <Icon name="share" size={scale(20)} color={colors.surface} style={{ marginRight: spacing.sm }} />
                <Text style={styles.shareButtonText}>Partilhar Código</Text>
              </>
            )}
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
    paddingTop: spacing.headerHeight,
    paddingBottom: spacing.xl,
    paddingHorizontal: spacing.xxl,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  menuButton: {
    width: scale(40),
    height: scale(40),
    borderRadius: borderRadius.xxl,
    backgroundColor: colors.surface,
    justifyContent: "center",
    alignItems: "center",
    ...shadows.sm,
  },
  headerSpacer: {
    width: scale(40),
    height: scale(40),
  },
  headerTitle: {
    fontSize: scale(17),
    fontWeight: "800",
    color: colors.textPrimary,
    letterSpacing: 0.5,
  },
  heroCard: {
    marginHorizontal: spacing.xxl,
    marginBottom: spacing.xxl,
    backgroundColor: colors.primary,
    borderRadius: borderRadius.xl,
    padding: spacing.xxl,
    alignItems: "center",
    ...shadows.primaryGlow,
  },
  heroIconCircle: {
    width: scale(64),
    height: scale(64),
    borderRadius: borderRadius.full,
    backgroundColor: "rgba(255,255,255,0.2)",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: spacing.lg,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.3)",
  },
  heroTitle: {
    fontSize: scale(22),
    fontWeight: "800",
    color: colors.surface,
    marginBottom: spacing.sm,
  },
  heroSubtitle: {
    fontSize: scale(14),
    color: "rgba(255,255,255,0.85)",
    textAlign: "center",
    lineHeight: scale(20),
  },
  section: {
    marginHorizontal: spacing.xxl,
    marginBottom: spacing.xl,
  },
  benefitCard: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: colors.surface,
    borderRadius: borderRadius.xl,
    padding: spacing.lg,
    marginBottom: spacing.md,
    borderWidth: 1,
    borderColor: colors.borderLight,
    ...shadows.sm,
  },
  benefitIcon: {
    width: scale(44),
    height: scale(44),
    borderRadius: borderRadius.md,
    justifyContent: "center",
    alignItems: "center",
    marginRight: spacing.lg,
  },
  benefitText: {
    flex: 1,
  },
  benefitTitle: {
    fontSize: scale(14),
    fontWeight: "700",
    color: colors.textPrimary,
    marginBottom: scale(2),
  },
  benefitDesc: {
    fontSize: scale(13),
    color: colors.textSecondary,
  },
  sectionLabel: {
    fontSize: scale(13),
    fontWeight: "700",
    color: colors.textSecondary,
    textTransform: "uppercase",
    letterSpacing: 0.8,
    marginBottom: spacing.md,
    marginLeft: spacing.xs,
  },
  codeCard: {
    backgroundColor: colors.surface,
    borderRadius: borderRadius.xl,
    padding: spacing.lg,
    borderWidth: 1,
    borderColor: colors.borderLight,
    minHeight: scale(64),
    justifyContent: "center",
    ...shadows.sm,
  },
  codeRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: spacing.sm,
  },
  codeText: {
    fontSize: scale(24),
    fontWeight: "800",
    color: colors.textPrimary,
    letterSpacing: 2,
  },
  copyButton: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: colors.primaryLight,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    borderRadius: borderRadius.md,
    gap: spacing.xs,
  },
  copyButtonSuccess: {
    backgroundColor: colors.successLight,
  },
  copyText: {
    fontSize: scale(13),
    fontWeight: "700",
    color: colors.primary,
  },
  copyTextSuccess: {
    color: colors.success,
  },
  errorRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
    justifyContent: "center",
  },
  errorText: {
    fontSize: scale(13),
    color: colors.error,
    fontWeight: "500",
  },
  shareButton: {
    flexDirection: "row",
    backgroundColor: colors.primary,
    borderRadius: borderRadius.xl,
    paddingVertical: spacing.lg,
    justifyContent: "center",
    alignItems: "center",
    ...shadows.primaryGlow,
  },
  shareButtonDisabled: {
    backgroundColor: colors.textDisabled,
    shadowOpacity: 0,
    elevation: 0,
  },
  shareButtonText: {
    fontSize: scale(15),
    fontWeight: "700",
    color: colors.surface,
    letterSpacing: 0.5,
  },
});

export default InviteScreen;
