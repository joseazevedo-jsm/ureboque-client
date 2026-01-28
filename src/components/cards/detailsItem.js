import React, { memo, useMemo } from "react";
import { View, StyleSheet, Text, TouchableOpacity } from "react-native";
import Icon from "react-native-vector-icons/MaterialIcons";
import { scale } from "react-native-size-matters";
import { colors, spacing, borderRadius } from "../../theme";

const DetailsItem = memo(({ destination, driver, clientCar, paymentMethod, onBackPress }) => {
  const towCarInfo = useMemo(() => {
    return `${driver?.car?.name} | ${driver?.car?.licensePlate}`;
  }, [driver?.car?.name, driver?.car?.licensePlate]);

  return (
    <View style={styles.containerStyle}>

      {/* Header with back button and title */}
      <View style={styles.headerContainer}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={onBackPress}
          activeOpacity={0.7}
        >
          <Icon name="arrow-back" size={scale(22)} color={colors.primary} />
        </TouchableOpacity>
        <Text style={styles.titleStyle}>DETALHES DA VIAGEM</Text>
        <Text>        </Text>

      </View>

      {/* Content in compact format */}
      <View style={styles.contentContainer}>
        <View style={styles.detailRow}>
          <Icon name="location-on" size={scale(18)} color={colors.primary} style={styles.rowIcon} />
          <View style={styles.rowContent}>
            <Text style={styles.labelText}>Indo para</Text>
            <Text style={styles.valueText}>{destination}</Text>
          </View>
        </View>

        <View style={styles.detailRow}>
          <Icon name="person" size={scale(18)} color={colors.primary} style={styles.rowIcon} />
          <View style={styles.rowContent}>
            <Text style={styles.labelText}>Motorista</Text>
            <Text style={styles.valueText}>{driver?.name}</Text>
          </View>
        </View>

        <View style={styles.detailRow}>
          <Icon name="directions-car" size={scale(18)} color={colors.primary} style={styles.rowIcon} />
          <View style={styles.rowContent}>
            <Text style={styles.labelText}>Seu carro</Text>
            <Text style={styles.valueText}>{clientCar}</Text>
          </View>
        </View>

        <View style={styles.detailRow}>
          <Icon name="local-shipping" size={scale(18)} color={colors.primary} style={styles.rowIcon} />
          <View style={styles.rowContent}>
            <Text style={styles.labelText}>Reboque</Text>
            <Text style={styles.valueText}>{towCarInfo}</Text>
          </View>
        </View>

        <View style={[styles.detailRow, styles.lastRow]}>
          <Icon name="payment" size={scale(18)} color={colors.primary} style={styles.rowIcon} />
          <View style={styles.rowContent}>
            <Text style={styles.labelText}>Pagamento</Text>
            <Text style={styles.valueText}>{paymentMethod}</Text>
          </View>
        </View>
      </View>
    </View>
  );
});

const styles = StyleSheet.create({
  containerStyle: {
    backgroundColor: 'transparent',
    paddingBottom: spacing.xl,
  },
  headerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.lg,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  backButton: {
    padding: spacing.sm,
    marginRight: spacing.md,
    backgroundColor: colors.primaryLight,
    borderRadius: borderRadius.xxl,
  },
  titleStyle: {
    fontSize: scale(14),
    color: colors.primary,
    fontWeight: "800",
    letterSpacing: 0.5,
  },
  contentContainer: {
    paddingHorizontal: spacing.xl,
    paddingTop: spacing.sm,
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing.lg,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  lastRow: {
    borderBottomWidth: 0,
  },
  rowIcon: {
    width: scale(24),
    marginRight: spacing.lg,
  },
  rowContent: {
    flex: 1,
  },
  labelText: {
    fontSize: scale(11),
    color: colors.textSecondary,
    fontWeight: '600',
    marginBottom: spacing.xs,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  valueText: {
    fontSize: scale(15),
    color: colors.textPrimary,
    fontWeight: '600',
  },
});

export default DetailsItem;
