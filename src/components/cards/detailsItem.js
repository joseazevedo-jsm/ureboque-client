import React, { memo, useMemo } from "react";
import { View, StyleSheet, Image } from 'react-native';
import { AppText as Text } from '../common/AppText';
import { AppPressable as TouchableOpacity } from '../common/AppPressable';
import { AppHeader } from '../common/AppHeader';

import MaterialIcons from "@expo/vector-icons/MaterialIcons";
const Icon = MaterialIcons;
import { scale } from "react-native-size-matters";
import { colors, spacing, borderRadius, borderWidths, shadows, sizes, layout, typography } from "../../theme";

const PAYMENT_ICONS = {
  DINHEIRO: require("../../../resources/icons/payment/CASH.png"),
  MULTICAIXA: require("../../../resources/icons/payment/MULTICARD.png"),
};

const PAYMENT_LABELS = {
  DINHEIRO: "Cash",
  MULTICAIXA: "Multicaixa",
};

const imgDef =
  "https://w7.pngwing.com/pngs/178/595/png-transparent-user-profile-computer-icons-login-user-avatars-thumbnail.png";

const DetailsItem = memo(({ origin, destination, driver, clientCar, paymentMethod, paymentPrice, type, onBackPress, onMessageDriver }) => {
  const carInfoParts = useMemo(() => {
    if (!clientCar) return { brand: '', model: '', color: '', license: '' };
    const parts = clientCar.split(' | ');
    return {
      brand: parts[0] || '',
      model: parts[1] || '',
      color: parts[2] || '',
      license: parts[3] || '',
    };
  }, [clientCar]);

  const carIcon = useMemo(() => (
    type === "JEEP"
      ? require("../../../resources/icons/UREB_JEEP.png")
      : require("../../../resources/icons/UREB_TUR.png")
  ), [type]);

  const paymentIcon = PAYMENT_ICONS[paymentMethod] ?? PAYMENT_ICONS.DINHEIRO;
  const paymentLabel = PAYMENT_LABELS[paymentMethod] ?? "Cash";

  const formattedPrice = useMemo(() => {
    if (paymentPrice !== undefined && paymentPrice !== null && !isNaN(paymentPrice)) {
      return Number(paymentPrice).toLocaleString('pt-AO', { style: 'currency', currency: 'AOA' });
    }
    return "0,00 Kzs";
  }, [paymentPrice]);

  return (
    <View style={styles.container}>
      {/* AppHeader carries its own horizontal padding, which stacked on this
          card's and pushed the close button 40dp in — twice as far as the
          section labels below it. Drop it so the × lines up with them. */}
      <AppHeader title="Detalhes da Viagem" leftIcon="close" leftLabel="Fechar detalhes da viagem"
        onLeftPress={onBackPress} safeArea={false} style={{ paddingHorizontal: 0 }} />

      <View style={styles.content}>

        {/* Driver */}
        <Text style={styles.sectionLabel}>Motorista</Text>
        <View style={styles.driverRow}>
          <Image
            source={{ uri: driver?.photo || imgDef }}
            style={styles.driverAvatar}
          />
          <View style={styles.driverInfo}>
            <Text style={styles.primaryText}>{driver?.name}</Text>
            <Text style={styles.secondaryText} numberOfLines={1}>
              Eu não consigo falar em portug...
            </Text>
          </View>
          <TouchableOpacity accessibilityRole="button" accessibilityLabel="Enviar mensagem ao motorista" style={styles.actionButton} onPress={onMessageDriver}>
            <Icon name="message" size={scale(20)} color={colors.surface} />
          </TouchableOpacity>
        </View>

        <View style={styles.divider} />

        {/* Car */}
        <Text style={styles.sectionLabel}>Carro do motorista</Text>
        <View style={styles.carRow}>
          <Image source={carIcon} style={styles.carImage} resizeMode="contain" />
          <View style={styles.carInfo}>
            <Text style={styles.carText}>
              {carInfoParts.brand}, {carInfoParts.model}, {carInfoParts.color}
            </Text>
            <View style={styles.licenseBadge}>
              <Text style={styles.licenseText}>{carInfoParts.license}</Text>
            </View>
          </View>
        </View>

        <View style={styles.divider} />

        {/* Location */}
        <Text style={styles.sectionLabel}>Pontos de Localização</Text>
        <View style={styles.timelineContainer}>
          <View style={styles.timelineLeft}>
            <View style={styles.dot} />
            <View style={styles.line} />
            <Icon name="location-pin" size={scale(16)} color={colors.primary} />
          </View>
          <View style={styles.timelineRight}>
            <View style={styles.locationItem}>
              <Text style={styles.locationText}>{origin || "Origem"}</Text>
            </View>
            <View style={[styles.locationItem, styles.destinationItem]}>
              <Text style={styles.locationText}>{destination || "Destino"}</Text>
            </View>
          </View>
        </View>

        <View style={styles.divider} />

        {/* Payment */}
        <Text style={styles.sectionLabel}>Método de pagamento</Text>
        <View style={styles.paymentRow}>
          <View style={styles.paymentLeft}>
            <Image source={paymentIcon} style={styles.paymentImage} resizeMode="contain" />
            <Text style={styles.paymentText}>{paymentLabel}</Text>
          </View>
          <Text style={styles.priceText}>{formattedPrice}</Text>
        </View>

      </View>
    </View>
  );
});

const styles = StyleSheet.create({
  container: {
    width: "100%",
    maxWidth: layout.sheetMaxWidth,
    alignSelf: "center",
    paddingHorizontal: spacing.xl,
    paddingBottom: spacing.xxl,
    // No flex: the sheet is sized from what this measures, so it hugs its
    // content instead of stretching and leaving blank space underneath.
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginTop: spacing.sm,
    marginBottom: spacing.lg,
  },
  headerTitle: {
    flex: 1,
    textAlign: "center",
    marginHorizontal: spacing.sm,
    fontSize: typography.body.fontSize, lineHeight: typography.body.lineHeight,
    color: colors.primary,
    fontWeight: '700',
  },
  closeButton: {
    width: sizes.control,
    height: sizes.control,
    borderRadius: borderRadius.lg,
    backgroundColor: colors.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerSpacer: {
    width: sizes.control,
    height: sizes.control,
  },
  content: {
    paddingTop: spacing.xs,
  },
  sectionLabel: {
    fontSize: typography.caption.fontSize, lineHeight: typography.caption.lineHeight,
    color: colors.textMuted,
    fontWeight: '600',
    marginBottom: spacing.sm,
  },
  divider: {
    height: borderWidths.thin,
    backgroundColor: colors.border,
    marginVertical: spacing.lg,
  },
  // Driver
  driverRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  driverAvatar: {
    width: scale(54),
    height: scale(54),
    borderRadius: borderRadius.md,
    marginRight: spacing.md,
    backgroundColor: colors.background,
    borderWidth: 1,
    borderColor: colors.borderLight,
  },
  driverInfo: {
    minWidth: 0,
    marginRight: spacing.md,
    flex: 1,
  },
  primaryText: {
    fontWeight: '700',
    fontSize: typography.bodySmall.fontSize, lineHeight: typography.bodySmall.lineHeight,
    color: colors.textPrimary,
    marginBottom: spacing.xs,
  },
  secondaryText: {
    fontSize: typography.caption.fontSize, lineHeight: typography.caption.lineHeight,
    color: colors.textMuted,
  },
  actionButton: {
    width: sizes.control,
    height: sizes.control,
    borderRadius: borderRadius.xxl,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    ...shadows.sm,
  },
  // Car
  carRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  carImage: {
    width: scale(80),
    height: scale(55),
    marginRight: spacing.md,
  },
  carInfo: {
    flex: 1,
  },
  carText: {
    fontSize: typography.bodySmall.fontSize, lineHeight: typography.bodySmall.lineHeight,
    fontWeight: '600',
    color: colors.textPrimary,
    marginBottom: spacing.xs,
  },
  licenseBadge: {
    backgroundColor: colors.primary,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    borderRadius: borderRadius.sm,
    alignSelf: 'flex-start',
  },
  licenseText: {
    color: colors.surface,
    fontSize: typography.caption.fontSize, lineHeight: typography.caption.lineHeight,
    fontWeight: '700',
  },
  // Timeline
  timelineContainer: {
    flexDirection: 'row',
    alignItems: 'stretch',
    paddingVertical: spacing.xs,
  },
  timelineLeft: {
    width: scale(24),
    alignItems: 'center',
    marginRight: spacing.md,
  },
  dot: {
    width: scale(12),
    height: scale(12),
    borderRadius: borderRadius.sm,
    backgroundColor: colors.primary,
    marginTop: spacing.xs,
  },
  line: {
    width: borderWidths.thin,
    flex: 1,
    backgroundColor: colors.border,
    marginVertical: spacing.xs,
  },
  timelineRight: {
    flex: 1,
    paddingBottom: spacing.xs,
  },
  locationItem: {
    justifyContent: 'center',
    minHeight: scale(26),
  },
  destinationItem: {
    marginTop: spacing.xl,
  },
  locationText: {
    fontSize: typography.bodySmall.fontSize, lineHeight: typography.bodySmall.lineHeight,
    color: colors.textPrimary,
    fontWeight: '500',
  },
  // Payment
  paymentRow: {
    flexWrap: "wrap",
    gap: spacing.md,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  paymentLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  paymentImage: {
    width: scale(40),
    height: scale(28),
    marginRight: spacing.md,
  },
  paymentText: {
    fontSize: typography.bodySmall.fontSize, lineHeight: typography.bodySmall.lineHeight,
    fontWeight: '700',
    color: colors.textPrimary,
  },
  priceText: {
    fontSize: typography.body.fontSize, lineHeight: typography.body.lineHeight,
    fontWeight: '700',
    color: colors.textPrimary,
  },
});

export default DetailsItem;
