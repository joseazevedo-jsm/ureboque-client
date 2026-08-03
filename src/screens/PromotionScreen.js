import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  ScrollView,
  ActivityIndicator,
} from "react-native";
import { scale } from "react-native-size-matters";
import { useNavigation } from "@react-navigation/native";
import Icon from "react-native-vector-icons/MaterialIcons";
import Animated, { FadeInDown } from "react-native-reanimated";
import { usePromotionScreen } from "../components/promotion/usePromotionScreen";
import DiscountItem from "../components/cards/discountItem";
import { useLogger } from "../hooks/useLogger";
import KeyboardAvoidingWrapper from "../components/common/KeyboardAvoidingWrapper";
import { colors, spacing, shadows, borderRadius } from "../theme";

const BENEFITS = [
  { icon: "flash-on", label: "Ativação\nImediata", bg: colors.primaryLight, color: colors.primary },
  { icon: "savings", label: "Poupe nas\nViagens", bg: colors.successLight, color: colors.success },
  { icon: "autorenew", label: "Aplicação\nAutomática", bg: colors.warningLight, color: colors.warning },
];

const STEPS = [
  { icon: "keyboard", title: "Insira o código", desc: "Digite o código promocional no campo abaixo" },
  { icon: "touch-app", title: "Ative", desc: "Toque no botão para aplicar o desconto" },
  { icon: "directions-car", title: "Viaje com desconto", desc: "O desconto é aplicado automaticamente na próxima viagem" },
];

const PromotionScreen = () => {
  const logger = useLogger("PromotionScreen");
  const { models, operations } = usePromotionScreen();
  const navigation = useNavigation();

  const [isActivating, setIsActivating] = useState(false);
  const [inputFocused, setInputFocused] = useState(false);
  const [successVisible, setSuccessVisible] = useState(false);

  const isPromoActive = models.user?.discount?.active;

  const handleActivateCode = async () => {
    if (!models.code.trim()) return;
    setIsActivating(true);
    try {
      const result = await operations.handleActivateCode();
      if (result?.success) {
        setSuccessVisible(true);
        setTimeout(() => setSuccessVisible(false), 3000);
      }
    } catch (error) {
      logger.error("Error activating code", error);
    } finally {
      setIsActivating(false);
    }
  };

  return (
    <KeyboardAvoidingWrapper style={styles.container}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
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
          <Text style={styles.headerTitle}>PROMOÇÕES</Text>
          <View style={styles.headerSpacer} />
        </Animated.View>

        {/* Hero Card */}
        <Animated.View
          style={styles.heroCard}
          entering={FadeInDown.delay(60).springify().damping(28).stiffness(180)}
        >
          <View style={styles.heroIconCircle}>
            <Icon name="local-offer" size={scale(32)} color={colors.surface} />
          </View>
          <Text style={styles.heroTitle}>Códigos Promocionais</Text>
          <Text style={styles.heroSubtitle}>
            Insira o seu código e economize{"\n"}em cada viagem com o Ureboque
          </Text>
        </Animated.View>

        {/* Benefit Tiles */}
        <Animated.View
          style={styles.benefitsRow}
          entering={FadeInDown.delay(120).springify().damping(28).stiffness(180)}
        >
          {BENEFITS.map((b, i) => (
            <View key={i} style={styles.benefitTile}>
              <View style={[styles.benefitIcon, { backgroundColor: b.bg }]}>
                <Icon name={b.icon} size={scale(22)} color={b.color} />
              </View>
              <Text style={styles.benefitLabel}>{b.label}</Text>
            </View>
          ))}
        </Animated.View>

        {/* Active Promotion */}
        {isPromoActive && (
          <Animated.View
            style={styles.activePromo}
            entering={FadeInDown.delay(180).springify().damping(28).stiffness(180)}
          >
            <View style={styles.activePromoHeader}>
              <Icon name="check-circle" size={scale(20)} color={colors.success} />
              <Text style={styles.activePromoTitle}>Promoção Ativa</Text>
            </View>
            <DiscountItem
              code={models.user.discount.promotion.code}
              description={models.user.discount.promotion.description}
            />
          </Animated.View>
        )}

        {/* Input */}
        <Animated.View
          style={styles.inputSection}
          entering={FadeInDown.delay(200).springify().damping(28).stiffness(180)}
        >
          <Text style={styles.sectionLabel}>Código Promocional</Text>
          <View
            style={[
              styles.inputContainer,
              inputFocused && styles.inputFocused,
              models.codeError && styles.inputError,
            ]}
          >
            <Icon
              name="confirmation-number"
              size={scale(20)}
              color={inputFocused ? colors.primary : colors.textMuted}
              style={{ marginRight: spacing.md }}
            />
            <TextInput
              style={styles.textInput}
              placeholder="Ex: UBER30OFF"
              placeholderTextColor={colors.textMuted}
              value={models.code}
              onChangeText={operations.onCodeTextChange}
              onFocus={() => setInputFocused(true)}
              onBlur={() => setInputFocused(false)}
              editable={!isPromoActive}
              autoCapitalize="characters"
            />
          </View>

          {models.codeError ? (
            <View style={styles.feedbackRow}>
              <Icon name="error" size={scale(14)} color={colors.error} />
              <Text style={styles.errorText}>{models.codeError}</Text>
            </View>
          ) : successVisible ? (
            <View style={styles.feedbackRow}>
              <Icon name="check-circle" size={scale(14)} color={colors.success} />
              <Text style={styles.successText}>Código aplicado com sucesso!</Text>
            </View>
          ) : null}
        </Animated.View>

        {/* Activate Button */}
        <Animated.View
          style={styles.buttonWrapper}
          entering={FadeInDown.delay(240).springify().damping(28).stiffness(180)}
        >
          <TouchableOpacity
            style={[
              styles.actionButton,
              (isPromoActive || isActivating || !models.code.trim()) &&
                styles.actionButtonDisabled,
            ]}
            onPress={handleActivateCode}
            disabled={isPromoActive || isActivating || !models.code.trim()}
            activeOpacity={0.8}
          >
            {isActivating ? (
              <ActivityIndicator size="small" color={colors.surface} />
            ) : (
              <>
                <Icon
                  name={isPromoActive ? "check-circle" : "add-circle"}
                  size={scale(20)}
                  color={colors.surface}
                  style={{ marginRight: spacing.sm }}
                />
                <Text style={styles.actionButtonText}>
                  {isPromoActive ? "PROMOÇÃO ATIVA" : "ATIVAR CÓDIGO"}
                </Text>
              </>
            )}
          </TouchableOpacity>
        </Animated.View>

        {/* How it works */}
        <Animated.View
          style={styles.stepsSection}
          entering={FadeInDown.delay(300).springify().damping(28).stiffness(180)}
        >
          <Text style={styles.sectionLabel}>Como funciona</Text>
          {STEPS.map((step, i) => (
            <View key={i} style={styles.stepCard}>
              <View style={styles.stepLeft}>
                <View style={styles.stepIconCircle}>
                  <Icon name={step.icon} size={scale(20)} color={colors.primary} />
                </View>
                {i < STEPS.length - 1 && <View style={styles.stepConnector} />}
              </View>
              <View style={styles.stepContent}>
                <Text style={styles.stepTitle}>{step.title}</Text>
                <Text style={styles.stepDesc}>{step.desc}</Text>
              </View>
            </View>
          ))}
        </Animated.View>

        <View style={{ height: scale(40) }} />
      </ScrollView>
    </KeyboardAvoidingWrapper>
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
    fontSize: scale(20),
    fontWeight: "800",
    color: colors.surface,
    marginBottom: spacing.sm,
    textAlign: "center",
  },
  heroSubtitle: {
    fontSize: scale(13),
    color: "rgba(255,255,255,0.85)",
    textAlign: "center",
    lineHeight: scale(19),
  },
  benefitsRow: {
    flexDirection: "row",
    marginHorizontal: spacing.xxl,
    marginBottom: spacing.xxl,
    gap: spacing.md,
  },
  benefitTile: {
    flex: 1,
    backgroundColor: colors.surface,
    borderRadius: borderRadius.xl,
    padding: spacing.md,
    alignItems: "center",
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
    marginBottom: spacing.sm,
  },
  benefitLabel: {
    fontSize: scale(11),
    fontWeight: "600",
    color: colors.textSecondary,
    textAlign: "center",
    lineHeight: scale(15),
  },
  activePromo: {
    backgroundColor: colors.surface,
    marginHorizontal: spacing.xxl,
    borderRadius: borderRadius.xl,
    padding: spacing.xl,
    marginBottom: spacing.xl,
    borderLeftWidth: scale(4),
    borderLeftColor: colors.success,
    ...shadows.sm,
  },
  activePromoHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: spacing.md,
    gap: spacing.sm,
  },
  activePromoTitle: {
    fontSize: scale(15),
    fontWeight: "700",
    color: colors.success,
  },
  inputSection: {
    marginHorizontal: spacing.xxl,
    marginBottom: spacing.xl,
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
  inputContainer: {
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1,
    borderColor: colors.borderLight,
    borderRadius: borderRadius.lg,
    paddingHorizontal: spacing.lg,
    backgroundColor: colors.surface,
    ...shadows.sm,
  },
  inputFocused: {
    borderColor: colors.primary,
  },
  inputError: {
    borderColor: colors.error,
    backgroundColor: colors.errorLight,
  },
  textInput: {
    flex: 1,
    fontSize: scale(16),
    fontWeight: "600",
    color: colors.textPrimary,
    paddingVertical: spacing.md,
    letterSpacing: 1,
  },
  feedbackRow: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: spacing.sm,
    gap: spacing.xs,
    paddingLeft: spacing.xs,
  },
  errorText: {
    fontSize: scale(13),
    color: colors.error,
    fontWeight: "500",
  },
  successText: {
    fontSize: scale(13),
    color: colors.success,
    fontWeight: "600",
  },
  buttonWrapper: {
    marginHorizontal: spacing.xxl,
    marginBottom: spacing.xxxl,
  },
  actionButton: {
    flexDirection: "row",
    backgroundColor: colors.primary,
    borderRadius: borderRadius.xl,
    paddingVertical: spacing.lg,
    justifyContent: "center",
    alignItems: "center",
    ...shadows.primaryGlow,
  },
  actionButtonDisabled: {
    backgroundColor: colors.textDisabled,
    shadowOpacity: 0,
    elevation: 0,
  },
  actionButtonText: {
    color: colors.surface,
    fontSize: scale(15),
    fontWeight: "700",
    letterSpacing: 0.5,
  },
  stepsSection: {
    marginHorizontal: spacing.xxl,
  },
  stepCard: {
    flexDirection: "row",
    marginBottom: 0,
  },
  stepLeft: {
    alignItems: "center",
    marginRight: spacing.lg,
  },
  stepIconCircle: {
    width: scale(44),
    height: scale(44),
    borderRadius: borderRadius.full,
    backgroundColor: colors.primaryLight,
    justifyContent: "center",
    alignItems: "center",
  },
  stepConnector: {
    width: scale(2),
    height: scale(32),
    backgroundColor: colors.borderLight,
    marginVertical: scale(4),
  },
  stepContent: {
    flex: 1,
    paddingTop: spacing.sm,
    paddingBottom: spacing.xl,
  },
  stepTitle: {
    fontSize: scale(14),
    fontWeight: "700",
    color: colors.textPrimary,
    marginBottom: scale(3),
  },
  stepDesc: {
    fontSize: scale(13),
    color: colors.textSecondary,
    lineHeight: scale(18),
  },
});

export default PromotionScreen;
