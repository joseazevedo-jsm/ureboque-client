import { useSafeAreaInsets } from "react-native-safe-area-context";
import React, { useState } from "react";
import { View, StyleSheet, ScrollView, ActivityIndicator } from 'react-native';
import { AppText as Text, AppTextInput as TextInput } from '../components/common/AppText';
import { AppPressable as TouchableOpacity } from '../components/common/AppPressable';
import { AppHeader } from '../components/common/AppHeader';

import { scale } from "react-native-size-matters";
import { useNavigation } from "@react-navigation/native";
import MaterialIcons from "@expo/vector-icons/MaterialIcons";
const Icon = MaterialIcons;
import Animated, { FadeInDown } from "react-native-reanimated";
import { usePromotionScreen } from "../components/promotion/usePromotionScreen";
import DiscountItem from "../components/cards/discountItem";
import { useLogger } from "../hooks/useLogger";
import KeyboardAvoidingWrapper from "../components/common/KeyboardAvoidingWrapper";
import { colors, spacing, shadows, borderRadius, sizes, layout, typography } from "../theme";

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
  const insets = useSafeAreaInsets();
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
    <KeyboardAvoidingWrapper style={[styles.container, { paddingBottom: insets.bottom }]}>
      <ScrollView
        contentContainerStyle={styles.pageContent}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        <AppHeader title="PROMOÇÕES" leftIcon="menu" leftLabel="Abrir menu"
          onLeftPress={() => navigation.openDrawer()} style={styles.header} />

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
                <Icon name={b.icon} size={sizes.icon} color={b.color} />
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
              <Icon name="error" size={sizes.iconSmall} color={colors.error} />
              <Text style={styles.errorText}>{models.codeError}</Text>
            </View>
          ) : successVisible ? (
            <View style={styles.feedbackRow}>
              <Icon name="check-circle" size={sizes.iconSmall} color={colors.success} />
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
  pageContent: { width: "100%", maxWidth: layout.contentMaxWidth, alignSelf: "center" },
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  header: {
    maxWidth: layout.contentMaxWidth,
    alignSelf: "center",
  },
  heroCard: {
    marginHorizontal: spacing.lg,
    marginBottom: spacing.lg,
    backgroundColor: colors.primary,
    borderRadius: borderRadius.xl,
    paddingVertical: spacing.xl,
    paddingHorizontal: spacing.lg,
    alignItems: "flex-start",
    ...shadows.sm,
  },
  heroIconCircle: {
    width: scale(64),
    height: scale(64),
    borderRadius: borderRadius.full,
    backgroundColor: colors.surfaceTint20,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: spacing.md,
    borderWidth: 1,
    borderColor: colors.surfaceTint30,
  },
  heroTitle: {
    fontSize: typography.h3.fontSize, lineHeight: typography.h3.lineHeight,
    fontWeight: "700",
    color: colors.surface,
    marginBottom: spacing.sm,
    textAlign: "left",
  },
  heroSubtitle: {
    fontSize: typography.caption.fontSize, lineHeight: typography.caption.lineHeight,
    color: colors.surfaceTint85,
    textAlign: "left",
    lineHeight: typography.bodySmall.lineHeight,
  },
  benefitsRow: {
    flexDirection: "row",
    marginHorizontal: spacing.lg,
    marginBottom: spacing.lg,
    gap: spacing.sm,
  },
  benefitTile: {
    flex: 1,
    backgroundColor: colors.surface,
    borderRadius: borderRadius.lg,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.xs,
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
    fontSize: typography.caption.fontSize, lineHeight: typography.caption.lineHeight,
    fontWeight: "600",
    color: colors.textSecondary,
    textAlign: "center",
    lineHeight: 16,
  },
  activePromo: {
    backgroundColor: colors.surface,
    marginHorizontal: spacing.lg,
    borderRadius: borderRadius.xl,
    padding: spacing.lg,
    marginBottom: spacing.lg,
    borderWidth: 1,
    borderColor: colors.successLight,
    ...shadows.sm,
  },
  activePromoHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: spacing.md,
    gap: spacing.sm,
  },
  activePromoTitle: {
    fontSize: typography.bodySmall.fontSize, lineHeight: typography.bodySmall.lineHeight,
    fontWeight: "700",
    color: colors.success,
  },
  inputSection: {
    marginHorizontal: spacing.lg,
    marginBottom: spacing.lg,
  },
  sectionLabel: {
    fontSize: typography.caption.fontSize, lineHeight: typography.caption.lineHeight,
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
    minHeight: sizes.control,
    flex: 1,
    fontSize: typography.body.fontSize, lineHeight: typography.body.lineHeight,
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
    fontSize: typography.caption.fontSize, lineHeight: typography.caption.lineHeight,
    color: colors.error,
    fontWeight: "500",
  },
  successText: {
    fontSize: typography.caption.fontSize, lineHeight: typography.caption.lineHeight,
    color: colors.success,
    fontWeight: "600",
  },
  buttonWrapper: {
    marginHorizontal: spacing.lg,
    marginBottom: spacing.xxl,
  },
  actionButton: {
    flexDirection: "row",
    backgroundColor: colors.primary,
    borderRadius: borderRadius.lg,
    minHeight: sizes.control,
    paddingVertical: spacing.md,
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
    fontSize: typography.bodySmall.fontSize, lineHeight: typography.bodySmall.lineHeight,
    fontWeight: "700",
    letterSpacing: 0.5,
  },
  stepsSection: {
    marginHorizontal: spacing.lg,
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
    marginVertical: spacing.xs,
  },
  stepContent: {
    flex: 1,
    paddingTop: spacing.sm,
    paddingBottom: spacing.xl,
  },
  stepTitle: {
    fontSize: typography.bodySmall.fontSize, lineHeight: typography.bodySmall.lineHeight,
    fontWeight: "700",
    color: colors.textPrimary,
    marginBottom: spacing.xs,
  },
  stepDesc: {
    fontSize: typography.caption.fontSize, lineHeight: typography.caption.lineHeight,
    color: colors.textSecondary,
    lineHeight: 20,
  },
});

export default PromotionScreen;
