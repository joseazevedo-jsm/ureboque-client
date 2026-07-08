import React, { useMemo } from "react";
import {
  Image,
  Modal,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { scale } from "react-native-size-matters";
import Icon from "react-native-vector-icons/MaterialIcons";
import Animated, { FadeInUp } from "react-native-reanimated";

import { useConfirmationModal } from "./components/useConfirmationModal";
import { useAlert } from "../../../context/AlertContext";
import StarRating from "../../cards/starRating";
import { colors, shadows, borderRadius, spacing } from "../../../theme";

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
          <TouchableOpacity style={styles.closeButton} onPress={closeModal}>
            <Icon name="close" size={scale(22)} color={colors.surface} />
          </TouchableOpacity>

          <View style={styles.successBadge}>
            <Icon name="check" size={scale(36)} color={colors.primary} />
          </View>
          <Text style={styles.successTitle}>Viagem Concluída!</Text>
        </View>

        {/* ── Receipt card — pulls up over header ───────────── */}
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
              size={scale(36)}
              gap={scale(4)}
            />
          </View>
        </Animated.View>

        {/* ── Push actions to the bottom ────────────────────── */}
        <View style={styles.spacer} />

        <View style={styles.actions}>
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
    borderBottomLeftRadius: scale(36),
    borderBottomRightRadius: scale(36),
    paddingTop: spacing.modalSafeTop,
    paddingBottom: scale(64),           // breathing room for the card pull-up
    alignItems: "center",
    justifyContent: "flex-end",
  },
  closeButton: {
    position: "absolute",
    top: spacing.modalSafeTop,
    left: spacing.xl,
    width: scale(44),
    height: scale(44),
    borderRadius: scale(22),
    backgroundColor: "rgba(255,255,255,0.2)",
    alignItems: "center",
    justifyContent: "center",
  },
  successBadge: {
    width: scale(72),
    height: scale(72),
    borderRadius: scale(36),
    backgroundColor: colors.surface,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: spacing.md,
    ...shadows.md,
  },
  successTitle: {
    fontSize: scale(20),
    fontWeight: "800",
    color: colors.surface,
    letterSpacing: 0.3,
  },

  // ── Receipt card ──────────────────────────────────────────
  card: {
    marginHorizontal: spacing.xl,
    marginTop: -scale(44),             // pull up over the header
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
    fontSize: scale(12),
    color: colors.textMuted,
    fontWeight: "600",
    marginBottom: scale(4),
  },
  amountValue: {
    fontSize: scale(25),
    fontWeight: "800",
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
    fontSize: scale(14),
    fontWeight: "700",
    color: colors.textPrimary,
  },

  divider: {
    height: 1,
    backgroundColor: colors.borderLight,
    marginVertical: spacing.xl,
  },

  // Driver + rating
  driverSection: {
    alignItems: "center",
  },
  avatarRing: {
    borderRadius: scale(48),
    borderWidth: 3,
    borderColor: colors.primary,
    marginBottom: spacing.md,
    ...shadows.primaryGlow,
  },
  avatar: {
    width: scale(88),
    height: scale(88),
    borderRadius: scale(44),
  },
  driverName: {
    fontSize: scale(18),
    fontWeight: "700",
    color: colors.textPrimary,
    marginBottom: scale(4),
  },
  ratingLabel: {
    fontSize: scale(13),
    color: colors.textMuted,
    fontWeight: "600",
    marginBottom: spacing.lg,
  },

  // ── Bottom actions ────────────────────────────────────────
  spacer: {
    flex: 1,
  },
  actions: {
    paddingHorizontal: spacing.xxl,
    paddingBottom: spacing.xxxl,
    alignItems: "center",
  },
  problemButton: {
    paddingVertical: spacing.sm,
    marginBottom: spacing.sm,
  },
  problemText: {
    color: colors.textSecondary,
    fontSize: scale(14),
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
    fontSize: scale(16),
    fontWeight: "700",
    letterSpacing: 0.5,
  },
});

export default ConfirmationModal;
