import React, { memo, useMemo } from "react";
import { View, StyleSheet, Text, TouchableOpacity, Image } from "react-native";
import Icon from "react-native-vector-icons/MaterialIcons";
import { scale } from "react-native-size-matters";
import { colors, spacing, borderRadius, shadows } from "../../theme";

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

const DetailsItem = memo(({ origin, destination, driver, clientCar, paymentMethod, paymentPrice, type, onBackPress }) => {
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
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={onBackPress} style={styles.closeButton}>
          <Icon name="close" size={scale(20)} color={colors.textPrimary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Detalhes da Viagem</Text>
        <View style={styles.headerSpacer} />
      </View>

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
          <TouchableOpacity style={styles.actionButton}>
            <Icon name="near-me" size={scale(20)} color={colors.surface} />
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
              <Text style={styles.locationText} numberOfLines={1}>{origin || "Origem"}</Text>
            </View>
            <View style={[styles.locationItem, styles.destinationItem]}>
              <Text style={styles.locationText} numberOfLines={2}>{destination || "Destino"}</Text>
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
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.xxl,
    flex: 1,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginTop: spacing.sm,
    marginBottom: spacing.lg,
  },
  headerTitle: {
    fontSize: scale(18),
    color: colors.primary,
    fontWeight: '700',
  },
  closeButton: {
    width: scale(36),
    height: scale(36),
    borderRadius: scale(18),
    backgroundColor: colors.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerSpacer: {
    width: scale(36),
    height: scale(36),
  },
  content: {
    paddingTop: spacing.xs,
  },
  sectionLabel: {
    fontSize: scale(12),
    color: colors.textMuted,
    fontWeight: '600',
    marginBottom: spacing.sm,
  },
  divider: {
    height: 1.5,
    backgroundColor: colors.primary,
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
    borderRadius: scale(10),
    marginRight: spacing.md,
    backgroundColor: colors.background,
    borderWidth: 1,
    borderColor: colors.borderLight,
  },
  driverInfo: {
    flex: 1,
  },
  primaryText: {
    fontWeight: '700',
    fontSize: scale(15),
    color: colors.textPrimary,
    marginBottom: scale(2),
  },
  secondaryText: {
    fontSize: scale(13),
    color: colors.textMuted,
  },
  actionButton: {
    width: scale(44),
    height: scale(44),
    borderRadius: scale(22),
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
    fontSize: scale(15),
    fontWeight: '600',
    color: colors.textPrimary,
    marginBottom: scale(6),
  },
  licenseBadge: {
    backgroundColor: colors.primary,
    paddingHorizontal: spacing.md,
    paddingVertical: scale(4),
    borderRadius: borderRadius.sm,
    alignSelf: 'flex-start',
  },
  licenseText: {
    color: colors.surface,
    fontSize: scale(13),
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
    borderRadius: scale(6),
    backgroundColor: colors.primary,
    marginTop: scale(6),
  },
  line: {
    width: 1.5,
    flex: 1,
    backgroundColor: colors.border,
    marginVertical: scale(4),
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
    marginTop: scale(20),
  },
  locationText: {
    fontSize: scale(15),
    color: colors.textPrimary,
    fontWeight: '500',
  },
  // Payment
  paymentRow: {
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
    fontSize: scale(15),
    fontWeight: '700',
    color: colors.textPrimary,
  },
  priceText: {
    fontSize: scale(17),
    fontWeight: '800',
    color: colors.textPrimary,
  },
});

export default DetailsItem;
