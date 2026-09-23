import React, { memo } from "react";
import { View, StyleSheet } from 'react-native';
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
  formatScheduledDate,
} from "../../utils/serviceFormatters";

const ServiceHistoryItem = memo(({ service, onPress }) => {
  // Handle nested service structure: { car: {...}, service: {...} }
  const serviceData = service.service || service;
  const carData = service.car;
  
  const statusInfo = getStatusInfo(serviceData.status);
  const { origin, destination } = getOriginDestination(serviceData.locations);
  const price = formatPrice(serviceData.payment, null);
  const schedule = formatScheduledDate(serviceData.scheduledFor);
  const isScheduled = serviceData.status === 'scheduled' && schedule;

  return (
    <TouchableOpacity style={[styles.container, isScheduled && styles.scheduledContainer]} onPress={onPress}
      accessibilityRole="button" accessibilityLabel={`${statusInfo.text}, ${origin}, ${destination}`}>
      <View style={styles.header}>
        <View style={styles.leftSection}>
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
          <Text style={styles.dateText}>{isScheduled ? 'RECOLHA MARCADA' : formatServiceDate(serviceData.createdAt)}</Text>
        </View>
        <View style={styles.rightSection}>
          <Icon name="chevron-right" size={scale(20)} color={colors.textMuted} />
        </View>
      </View>

      {isScheduled && (
        <View style={styles.scheduleRow}>
          <View style={styles.calendarTile}>
            <Text style={styles.calendarDay}>{schedule.day}</Text>
            <Text style={styles.calendarMonth}>{schedule.month}</Text>
          </View>
          <View style={styles.scheduleCopy}>
            <Text style={styles.scheduleDate}>{schedule.date}</Text>
            <Text style={styles.scheduleTime}>{schedule.time}</Text>
          </View>
          <Icon name="notifications-none" size={sizes.iconLarge} color={colors.primaryDark} />
        </View>
      )}

      <View style={styles.routeContainer}>
        <RouteItem 
          origin={origin}
          destination={destination}
        />
      </View>

      {price && (
        <View style={styles.paymentRow}>
          <View style={styles.paymentLabel}>
            <Icon name="payments" size={sizes.icon} color={colors.primaryDark} />
            <Text style={styles.paymentMethod}>{serviceData.payment?.method || 'Pagamento'}</Text>
          </View>
          <Text style={styles.priceText}>{price}</Text>
        </View>
      )}

      <View style={styles.footer}>
        <View style={styles.carInfo}>
          <Icon name="directions-car" size={scale(16)} color={colors.textSecondary} />
          <Text style={styles.carText}>{carData ? formatCarDetails(carData) : (serviceData.user_car_details || 'Veículo por confirmar')}</Text>
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
    borderRadius: borderRadius.xxl,
    padding: spacing.lg,
    marginBottom: spacing.md,
    borderWidth: 1,
    borderColor: colors.borderLight,
    ...shadows.sm,
  },
  scheduledContainer: { borderColor: colors.primary, borderWidth: 1 },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: spacing.md,
  },
  leftSection: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  rightSection: {
    flexDirection: "row",
    alignItems: "center",
  },
  dateText: {
    fontSize: typography.bodySmall.fontSize, lineHeight: typography.bodySmall.lineHeight,
    color: colors.textMuted,
    fontFamily: typography.caption.fontFamily,
    fontSize: typography.caption.fontSize,
    lineHeight: typography.caption.lineHeight,
    letterSpacing: 0.5,
  },
  statusBadge: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderRadius: borderRadius.full,
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
    fontFamily: typography.h4.fontFamily,
    color: colors.textPrimary,
    flexShrink: 0,
    fontVariant: ['tabular-nums'],
  },
  routeContainer: {
    marginBottom: spacing.md,
    paddingLeft: spacing.xs,
  },
  scheduleRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.md, padding: spacing.md, marginBottom: spacing.md, backgroundColor: colors.primaryLight, borderRadius: borderRadius.xl },
  calendarTile: { width: 48, height: 52, alignItems: 'center', justifyContent: 'center', borderRadius: borderRadius.md, backgroundColor: colors.surface },
  calendarDay: { ...typography.h3, color: colors.primaryDark, lineHeight: 23, fontVariant: ['tabular-nums'] },
  calendarMonth: { ...typography.caption, color: colors.primaryDark, fontFamily: typography.label.fontFamily, letterSpacing: 0.8 },
  scheduleCopy: { flex: 1 },
  scheduleDate: { ...typography.bodySmall, color: colors.textPrimary, textTransform: 'capitalize' },
  scheduleTime: { ...typography.h3, color: colors.primaryDark, fontVariant: ['tabular-nums'] },
  paymentRow: { minHeight: 48, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: spacing.md, paddingVertical: spacing.sm, paddingHorizontal: spacing.md, marginBottom: spacing.md, borderRadius: borderRadius.lg, backgroundColor: colors.background },
  paymentLabel: { flex: 1, flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  paymentMethod: { ...typography.caption, color: colors.textSecondary },
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
    borderTopColor: colors.borderLight,
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
