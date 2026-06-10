import React, { memo, useMemo } from "react";
import { View, StyleSheet, Text, TouchableOpacity, Image } from "react-native";
import Icon from "react-native-vector-icons/MaterialIcons";
import { scale } from "react-native-size-matters";
import { colors, spacing, borderRadius, shadows, typography } from "../../theme";

const DetailsItem = memo(({ origin, destination, driver, clientCar, paymentMethod, paymentPrice, type, onBackPress }) => {
  const carInfoParts = useMemo(() => {
    if (!clientCar) return { brand: '', details: '', license: '' };
    const parts = clientCar.split(' | ');
    return {
      brand: parts[0] || '',
      model: parts[1] || '',
      color: parts[2] || '',
      license: parts[3] || ''
    };
  }, [clientCar]);

  const carIcon = useMemo(() => {
    return type === "JEEP"
      ? require("../../../resources/icons/UREB_JEEP.png")
      : require("../../../resources/icons/UREB_TUR.png");
  }, [type]);

  const imgDef = "https://w7.pngwing.com/pngs/178/595/png-transparent-user-profile-computer-icons-login-user-avatars-thumbnail.png";


  const formattedPrice = useMemo(() => {
    if (paymentPrice !== undefined && paymentPrice !== null && !isNaN(paymentPrice)) {
      return Number(paymentPrice).toLocaleString('pt-AO', { style: 'currency', currency: 'AOA' });
    }
    return "0,00 Kzs";
  }, [paymentPrice]);


  const renderTimeline = () => (
    <View style={styles.timelineContainer}>
      <View style={styles.timelineLeft}>
        <View style={styles.dot} />
        <View style={styles.line} />
        <Icon name="location-pin" size={scale(16)} color={colors.primary} style={styles.pinIcon} />
      </View>
      <View style={styles.timelineRight}>
        <View style={styles.locationItem}>
          <Text style={styles.locationText} numberOfLines={1}>{origin || "Origem"}</Text>
        </View>
        <View style={[styles.locationItem, { marginTop: scale(20) }]}>
          <Text style={styles.locationText} numberOfLines={2}>{destination || "Destino"}</Text>
        </View>
      </View>
    </View>
  );

  return (
    <View style={styles.containerStyle}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={onBackPress} style={styles.closeButton}>
          <Icon name="close" size={scale(20)} color={colors.primary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Detalhes da Viagem</Text>
        <TouchableOpacity style={styles.hiddenButton} disabled>
          {/* Invisible spacer for balance */}
        </TouchableOpacity>
      </View>

      <View style={styles.content}>

        {/* Section 1: Driver */}
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionLabel}>Motorista</Text>
        </View>
        <View style={styles.driverRow}>
          <Image
            source={{ uri: driver?.photo || imgDef }}
            style={styles.driverAvatar}
          />
          <View style={styles.driverInfo}>
            <Text style={styles.primaryText}>{driver?.name}</Text>
            <Text style={styles.secondaryText}>Eu não consigo falar em portug...</Text>
          </View>
          <TouchableOpacity style={styles.actionButton}>
            <Icon name="near-me" size={scale(20)} color={colors.surface} />
          </TouchableOpacity>
        </View>

        <View style={styles.divider} />

        {/* Section 2: Car */}
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionLabel}>Carro do motorista</Text>
        </View>
        <View style={styles.carRow}>
          <Image
            source={carIcon}
            style={styles.carImage}
            resizeMode="contain"
          />
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

        {/* Section 3: Location */}
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionLabel}>Pontos de Localização</Text>
        </View>
        {renderTimeline()}

        <View style={styles.divider} />

        {/* Section 4: Payment */}
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionLabel}>Método de pagamento</Text>
        </View>
        <View style={styles.paymentRow}>
          <View style={styles.paymentMethod}>
            <Icon name="payments" size={scale(24)} color={colors.success} />
            <Text style={styles.paymentText}>{paymentMethod || "Dinheiro"}</Text>
          </View>
          <Text style={styles.priceText}>
            {formattedPrice}
          </Text>
        </View>

      </View>
    </View>
  );
});

const styles = StyleSheet.create({
  containerStyle: {
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.xxl,
    flex: 1, // Integrate with bottom sheet
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: spacing.lg,
    marginTop: spacing.sm,
  },
  headerTitle: {
    ...typography.h3,
    fontSize: scale(18),
    color: colors.primary,
    fontWeight: '700',
    textAlign: 'center',
  },
  closeButton: {
    width: scale(36),
    height: scale(36),
    borderRadius: scale(18),
    backgroundColor: colors.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
  },
  hiddenButton: {
    width: scale(36),
    height: scale(36),
  },
  content: {
    paddingTop: spacing.xs,
  },
  sectionHeader: {
    marginBottom: spacing.sm,
  },
  sectionLabel: {
    ...typography.label,
    fontSize: scale(13),
    color: colors.textSecondary,
    fontWeight: '600',
  },
  divider: {
    height: 1.5,
    backgroundColor: colors.primary, // Increased visibility
    marginVertical: spacing.lg, // Increased spacing
  },
  // Driver Section
  driverRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  driverAvatar: {
    width: scale(54),
    height: scale(54),
    borderRadius: scale(16),
    marginRight: spacing.md,
    backgroundColor: colors.background,
  },
  driverInfo: {
    flex: 1,
  },
  primaryText: {
    ...typography.body,
    fontWeight: '700',
    fontSize: scale(16),
    color: colors.textPrimary,
  },
  secondaryText: {
    ...typography.caption,
    fontSize: scale(13),
    color: colors.textSecondary,
    marginTop: scale(2),
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
  // Car Section
  carRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: spacing.xs,
  },
  carImage: {
    width: scale(70),
    height: scale(45),
    marginRight: spacing.md,
  },
  carInfo: {
    flex: 1,
  },
  carText: {
    ...typography.body,
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
  // Timeline Section
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
  pinIcon: {
    marginBottom: scale(2),
  },
  timelineRight: {
    flex: 1,
    paddingBottom: spacing.xs,
  },
  locationItem: {
    justifyContent: 'center',
    minHeight: scale(26),
  },
  locationText: {
    ...typography.body,
    fontSize: scale(15),
    color: colors.textPrimary,
    fontWeight: '500',
  },
  // Payment Section
  paymentRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: spacing.xs,
  },
  paymentMethod: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  paymentText: {
    marginLeft: spacing.md,
    fontSize: scale(15),
    fontWeight: '700',
    color: colors.textPrimary,
  },
  priceText: {
    fontSize: scale(18),
    fontWeight: '800',
    color: colors.textPrimary,
  },
});

export default DetailsItem;
