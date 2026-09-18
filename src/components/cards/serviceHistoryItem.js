import React, { memo } from "react";
import { View, StyleSheet, Image } from 'react-native';
import { AppText as Text } from '../common/AppText';
import { AppPressable as TouchableOpacity } from '../common/AppPressable';

import MaterialIcons from "@expo/vector-icons/MaterialIcons";
const Icon = MaterialIcons;
import { scale } from "react-native-size-matters";
import RouteItem from "./routeItem";
import { colors, shadows, spacing, borderRadius, typography, sizes } from "../../theme";
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
              size={sizes.iconSmall} 
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
    fontSize: typography.bodySmall.fontSize, lineHeight: typography.bodySmall.lineHeight,
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
    fontSize: typography.caption.fontSize, lineHeight: typography.caption.lineHeight,
    fontWeight: "600",
  },
  priceText: {
    fontSize: typography.body.fontSize, lineHeight: typography.body.lineHeight,
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
    fontSize: typography.caption.fontSize, lineHeight: typography.caption.lineHeight,
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
    fontSize: typography.caption.fontSize, lineHeight: typography.caption.lineHeight,
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
    fontSize: typography.caption.fontSize, lineHeight: typography.caption.lineHeight,
    color: colors.textSecondary,
    marginLeft: spacing.xs,
    flex: 1,
  },
  licensePlate: {
    backgroundColor: colors.borderLight,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderRadius: borderRadius.sm,
  },
  licensePlateText: {
    fontSize: typography.caption.fontSize, lineHeight: typography.caption.lineHeight,
    color: colors.textPrimary,
    fontWeight: "bold",
  },
});

export default ServiceHistoryItem;
