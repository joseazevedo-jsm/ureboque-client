import React, { useMemo } from "react";
import { Image, Modal, StyleSheet, View } from 'react-native';
import { AppText as Text } from '../../common/AppText';
import { AppPressable as TouchableOpacity } from '../../common/AppPressable';
import { AppIconButton } from '../../common/AppIconButton';

import { scale } from "react-native-size-matters";
import MaterialIcons from "@expo/vector-icons/MaterialIcons";
const Icon = MaterialIcons;
import Animated, { FadeInUp } from "react-native-reanimated";

import { useConfirmationModal } from "./components/useConfirmationModal";
import { useAlert } from "../../../context/AlertContext";
import StarRating from "../../cards/starRating";
import { colors, shadows, borderRadius, borderWidths, spacing, typography, sizes } from "../../../theme";
import { useNavBarPad } from "../../map/useMeasuredSheet";

const imgDef =
  "https://w7.pngwing.com/pngs/178/595/png-transparent-user-profile-computer-icons-login-user-avatars-thumbnail.png";

const PAYMENT_ICONS = {
  DINHEIRO: require("../../../../resources/icons/payment/CASH.png"),
  MULTICAIXA: require("../../../../resources/icons/payment/MULTICARD.png"),
};

const PAYMENT_LABELS = {
  DINHEIRO: "Cash",
  MULTICAIXA: "Multicaixa",
};

const ConfirmationModal = ({ visible, closeModal, payment_total, payment_type, service }) => {
  // This modal is edge-to-edge, so a fixed bottom pad put "Confirmar" under
  // the system nav bar. Clear the bar, then add the visual breathing room.
  const navBarPad = useNavBarPad();
  const { models, operations } = useConfirmationModal(service, closeModal);
  const { showAlert } = useAlert();

  const formattedTotal = useMemo(() => {
    const n = Number(payment_total);
    if (!payment_total || isNaN(n)) return "0 AOA";
    return `AOA ${n.toLocaleString("pt-AO")}`;
  }, [payment_total]);

  const paymentIcon = PAYMENT_ICONS[payment_type] ?? PAYMENT_ICONS.DINHEIRO;
  const paymentLabel = PAYMENT_LABELS[payment_type] ?? payment_type ?? "Cash";

  const handleProblemPress = () => {
    showAlert({
      type: "warning",
      title: "Reportar Problema",
      message:
        "Para reportar um problema com esta viagem, contacte o nosso suporte através do email suporte@ureboque.com ou pelo número de apoio ao cliente.",
      buttons: [{ text: "Fechar" }],
    });
  };

  return (
    <Modal onRequestClose={closeModal} visible={visible} animationType="fade">
      <View style={styles.container}>

        {/* ── Compact blue header ───────────────────────────── */}
        <View style={styles.header}>
          <AppIconButton icon="close" label="Fechar viagem concluída" variant="ghostOnColor" onPress={closeModal} style={styles.closeButton} />

          <View style={styles.successBadge}>
            <Icon name="check" size={sizes.iconXL} color={colors.primary} />
          </View>
          <Text style={styles.successTitle}>Viagem Concluída!</Text>
        </View>

        {/* ── Receipt card, centred in the space left ─────── */}
        <View style={styles.body}>
        <Animated.View
          entering={FadeInUp.delay(150).springify().damping(28).stiffness(180)}
          style={styles.card}
        >
          {/* Amount row */}
          <View style={styles.amountRow}>
            <View>
              <Text style={styles.amountLabel}>Total a pagar</Text>
              <Text style={styles.amountValue}>{formattedTotal}</Text>
            </View>
            <View style={styles.paymentChip}>
              <Image source={paymentIcon} style={styles.paymentImage} resizeMode="contain" />
              <Text style={styles.paymentChipText}>{paymentLabel}</Text>
            </View>
          </View>

          <View style={styles.divider} />

          {/* Driver + rating */}
          <View style={styles.driverSection}>
            <View style={styles.avatarRing}>
              <Image
                source={{ uri: service.driver?.photo || imgDef }}
                style={styles.avatar}
              />
            </View>
            <Text style={styles.driverName}>{service.driver?.name}</Text>
            <Text style={styles.ratingLabel}>Avalie o motorista</Text>
            <StarRating
              rating={models.rating}
              onRate={operations.handleRate}
              size={sizes.iconXL}
              gap={scale(4)}
            />
          </View>
        </Animated.View>
        </View>

        <View style={[styles.actions, { paddingBottom: navBarPad + spacing.xl }]}>
          <TouchableOpacity
            style={styles.problemButton}
            onPress={handleProblemPress}
            accessibilityRole="button"
          >
            <Text style={styles.problemText}>Algum problema?</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.confirmButton}
            onPress={operations.handleConfirmRate}
            activeOpacity={0.85}
            accessibilityRole="button"
          >
            <Text style={styles.confirmText}>Confirmar</Text>
          </TouchableOpacity>
        </View>

      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },

  // ── Header ────────────────────────────────────────────────
  header: {
    backgroundColor: colors.primary,
    // A full radius on a full-width box drew a semicircle that ran off both
    // screen edges; a card-sized radius keeps it a band.
    borderBottomLeftRadius: borderRadius.xxl,
    borderBottomRightRadius: borderRadius.xxl,
    paddingTop: spacing.modalSafeTop,
    paddingBottom: spacing.xxl,
    alignItems: "center",
    justifyContent: "flex-end",
  },
  closeButton: {
    position: "absolute",
    top: spacing.modalSafeTop,
    left: spacing.xl,
    width: scale(44),
    height: scale(44),
    borderRadius: borderRadius.xxl,
    backgroundColor: colors.surfaceTint20,
    alignItems: "center",
    justifyContent: "center",
  },
  successBadge: {
    width: scale(72),
    height: scale(72),
    borderRadius: borderRadius.full,
    backgroundColor: colors.surface,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: spacing.md,
    ...shadows.md,
  },
  successTitle: {
    fontSize: typography.h3.fontSize, lineHeight: typography.h3.lineHeight,
    fontWeight: "700",
    color: colors.surface,
    letterSpacing: 0.3,
  },

  // ── Receipt card ──────────────────────────────────────────
  // The card sits centred between the header and the actions, so the spare
  // height on tall screens is shared above and below it instead of piling
  // up as one empty gap over the buttons.
  body: {
    flex: 1,
    justifyContent: "center",
    paddingVertical: spacing.xl,
  },
  card: {
    marginHorizontal: spacing.xl,
    backgroundColor: colors.surface,
    borderRadius: borderRadius.xxl,
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.xl,
    ...shadows.lg,
    borderWidth: 1,
    borderColor: colors.borderLight,
  },

  // Amount
  amountRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  amountLabel: {
    fontSize: typography.caption.fontSize, lineHeight: typography.caption.lineHeight,
    color: colors.textMuted,
    fontWeight: "600",
    marginBottom: spacing.xs,
  },
  amountValue: {
    fontSize: typography.h2.fontSize, lineHeight: typography.h2.lineHeight,
    fontWeight: "700",
    color: colors.primary,
    letterSpacing: 0.5,
  },
  paymentChip: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: colors.background,
    borderRadius: borderRadius.xl,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderWidth: 1,
    borderColor: colors.borderLight,
  },
  paymentImage: {
    width: scale(34),
    height: scale(22),
    marginRight: spacing.sm,
  },
  paymentChipText: {
    fontSize: typography.bodySmall.fontSize, lineHeight: typography.bodySmall.lineHeight,
    fontWeight: "700",
    color: colors.textPrimary,
  },

  divider: {
    height: borderWidths.thin,
    backgroundColor: colors.borderLight,
    marginVertical: spacing.xl,
  },

  // Driver + rating
  driverSection: {
    alignItems: "center",
  },
  avatarRing: {
    borderRadius: borderRadius.full,
    borderWidth: 3,
    borderColor: colors.primary,
    marginBottom: spacing.md,
    ...shadows.primaryGlow,
  },
  avatar: {
    width: scale(88),
    height: scale(88),
    borderRadius: borderRadius.full,
  },
  driverName: {
    fontSize: typography.body.fontSize, lineHeight: typography.body.lineHeight,
    fontWeight: "700",
    color: colors.textPrimary,
    marginBottom: spacing.xs,
  },
  ratingLabel: {
    fontSize: typography.caption.fontSize, lineHeight: typography.caption.lineHeight,
    color: colors.textMuted,
    fontWeight: "600",
    marginBottom: spacing.lg,
  },

  // ── Bottom actions ────────────────────────────────────────
  actions: {
    paddingHorizontal: spacing.xxl,
    alignItems: "center",
  },
  problemButton: {
    paddingVertical: spacing.sm,
    marginBottom: spacing.sm,
  },
  problemText: {
    color: colors.textSecondary,
    fontSize: typography.bodySmall.fontSize, lineHeight: typography.bodySmall.lineHeight,
    fontWeight: "600",
    textDecorationLine: "underline",
  },
  confirmButton: {
    backgroundColor: colors.primary,
    borderRadius: borderRadius.xl,
    width: "100%",
    height: scale(54),
    alignItems: "center",
    justifyContent: "center",
    ...shadows.primaryGlow,
  },
  confirmText: {
    color: colors.surface,
    fontSize: typography.body.fontSize, lineHeight: typography.body.lineHeight,
    fontWeight: "700",
    letterSpacing: 0.5,
  },
});

export default ConfirmationModal;
