import React, { memo } from "react";
import { View, TouchableOpacity, StyleSheet, Text, Image } from "react-native";
import Icon from "react-native-vector-icons/MaterialIcons";
import { scale } from "react-native-size-matters";
import RouteItem from "./routeItem";
import { colors, shadows, spacing, borderRadius } from "../../theme";
import {
  getStatusInfo,
  formatServiceDate,
  formatPrice,
  formatCarDetails,
  getOriginDestination,
} from "../../utils/serviceFormatters";

const ServiceHistoryItem = memo(({ service, onPress }) => {
  // Handle nested service structure: { car: {...}, service: {...} }
  const serviceData = service.service || service;
  const carData = service.car;
  
  const statusInfo = getStatusInfo(serviceData.status);
  const { origin, destination } = getOriginDestination(serviceData.locations);
  const price = formatPrice(serviceData.payment, null);

  return (
    <TouchableOpacity style={styles.container} onPress={onPress}>
      <View style={styles.header}>
        <View style={styles.leftSection}>
          <Text style={styles.dateText}>{formatServiceDate(serviceData.createdAt)}</Text>
          <View style={[styles.statusBadge, { backgroundColor: statusInfo.bgColor }]}>
            <Icon 
              name={statusInfo.icon} 
              size={scale(12)} 
              color={statusInfo.color} 
              style={styles.statusIcon} 
            />
            <Text style={[styles.statusText, { color: statusInfo.color }]}>
              {statusInfo.text}
            </Text>
          </View>
        </View>
        <View style={styles.rightSection}>
          {price && (
            <Text style={styles.priceText}>{price}</Text>
          )}
          <Icon name="chevron-right" size={scale(20)} color={colors.textMuted} />
        </View>
      </View>

      <View style={styles.routeContainer}>
        <RouteItem 
          origin={origin}
          destination={destination}
        />
      </View>

      <View style={styles.footer}>
        <View style={styles.carInfo}>
          <Icon name="directions-car" size={scale(16)} color={colors.textSecondary} />
          <Text style={styles.carText}>{formatCarDetails(carData)}</Text>
        </View>
        
        {serviceData.type_car && (
          <View style={styles.typeInfo}>
            <Text style={styles.typeText}>{serviceData.type_car}</Text>
          </View>
        )}
      </View>

      {serviceData.driver && typeof serviceData.driver === 'object' && serviceData.driver.details?.name && (
        <View style={styles.driverInfo}>
          <Icon name="person" size={scale(16)} color={colors.textSecondary} />
          <Text style={styles.driverText}>Motorista: {serviceData.driver.details.name}</Text>
          {serviceData.driver.details.car && serviceData.driver.details.car.licensePlate && (
            <View style={styles.licensePlate}>
              <Text style={styles.licensePlateText}>{serviceData.driver.details.car.licensePlate}</Text>
            </View>
          )}
        </View>
      )}
    </TouchableOpacity>
  );
});

const styles = StyleSheet.create({
  container: {
    backgroundColor: colors.surface,
    borderRadius: borderRadius.md,
    padding: spacing.lg,
    marginBottom: spacing.md,
    borderWidth: 1,
    borderColor: colors.background,
    ...shadows.md,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: spacing.md,
  },
  leftSection: {
    flex: 1,
  },
  rightSection: {
    flexDirection: "row",
    alignItems: "center",
  },
  dateText: {
    fontSize: scale(14),
    color: colors.textPrimary,
    fontWeight: "500",
    marginBottom: spacing.xs,
  },
  statusBadge: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderRadius: borderRadius.md,
    alignSelf: "flex-start",
  },
  statusIcon: {
    marginRight: spacing.xs,
  },
  statusText: {
    fontSize: scale(12),
    fontWeight: "600",
  },
  priceText: {
    fontSize: scale(16),
    fontWeight: "bold",
    color: colors.primary,
    marginRight: spacing.sm,
  },
  routeContainer: {
    marginBottom: spacing.md,
    paddingLeft: spacing.xs,
  },
  footer: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: spacing.sm,
  },
  carInfo: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
  },
  carText: {
    fontSize: scale(12),
    color: colors.textSecondary,
    marginLeft: spacing.xs,
    flex: 1,
  },
  typeInfo: {
    backgroundColor: colors.background,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderRadius: borderRadius.sm,
  },
  typeText: {
    fontSize: scale(10),
    color: colors.textSecondary,
    fontWeight: "600",
  },
  driverInfo: {
    flexDirection: "row",
    alignItems: "center",
    paddingTop: spacing.sm,
    borderTopWidth: 1,
    borderTopColor: colors.background,
  },
  driverText: {
    fontSize: scale(12),
    color: colors.textSecondary,
    marginLeft: spacing.xs,
    flex: 1,
  },
  licensePlate: {
    backgroundColor: colors.borderLight,
    paddingHorizontal: spacing.sm,
    paddingVertical: scale(2),
    borderRadius: borderRadius.sm,
  },
  licensePlateText: {
    fontSize: scale(10),
    color: colors.textPrimary,
    fontWeight: "bold",
  },
});

export default ServiceHistoryItem;