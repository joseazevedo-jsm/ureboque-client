import React, { memo } from "react";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { scale } from "react-native-size-matters";
import RouteItem from "../cards/routeItem";
import MaterialIcons from "@expo/vector-icons/MaterialIcons";
const Icon = MaterialIcons;
import DriverItem from "../cards/driverItem";
import ConnectionBanner from "./ConnectionBanner";
import { useDriverLocationStale } from "../../hooks/useMapDrivers";
import { colors, spacing, borderRadius, shadows } from "../../theme";
import { TRIP_STATUS } from "../../constants/tripStatus";

// A driver marker that stops moving is ambiguous: parked, or no longer
// reporting at all. Dimming the map pin was the previous signal, but it never
// reached the screen and is easy to miss even when it does. Say it in words on
// the card the rider is already looking at.
const DriverLocationStaleNotice = () => {
  const isStale = useDriverLocationStale();
  if (!isStale) return null;
  return (
    <View style={styles.staleNotice}>
      <Icon name="location-off" size={scale(15)} color={colors.warning} />
      <Text style={styles.staleNoticeText}>
        A localização do motorista não está a atualizar.
      </Text>
    </View>
  );
};

const DriverStatus = memo(({
  status,
  driver,
  origin,
  destination,
  tripDuration,
  onDetailsTrip,
  onCancelTrip,
  onShareLocation,
  onMessageDriver,
  onCallDriver,
  bttmSheetRef,
  unreadMessageCount = 0,
}) => {
  if (!driver) return null;

  return (
    <View style={styles.container}>
      <ConnectionBanner />
      <DriverLocationStaleNotice />
      <DriverItem
        status={status}
        origin={origin}
        destination={destination}
        driver={driver}
        tripDuration={tripDuration}
        onMessageDriver={onMessageDriver}
        onCallDriver={onCallDriver}
        unreadMessageCount={unreadMessageCount}
      />

      <View style={styles.routeContainer}>
        <RouteItem origin={origin} destination={destination} />
      </View>

      <View style={styles.divider} />

      <View style={styles.actions}>
        {/* Share location */}
        <TouchableOpacity
          style={[styles.actionBtn, styles.shareBtn]}
          onPress={onShareLocation}
          activeOpacity={0.8}
          accessibilityLabel="Partilhar localização"
          accessibilityRole="button"
        >
          <Icon name="near-me" size={scale(18)} color={colors.primary} style={styles.btnIcon} />
          <Text style={[styles.btnText, styles.shareBtnText]}>Partilhar localização</Text>
        </TouchableOpacity>

        {/* Trip details */}
        <TouchableOpacity
          style={[styles.actionBtn, styles.detailsBtn]}
          onPress={() => onDetailsTrip(bttmSheetRef)}
          activeOpacity={0.8}
          accessibilityLabel="Ver detalhes da viagem"
          accessibilityRole="button"
        >
          <Icon name="format-list-bulleted" size={scale(18)} color={colors.textPrimary} style={styles.btnIcon} />
          <Text style={[styles.btnText, styles.detailsBtnText]}>Detalhes da viagem</Text>
        </TouchableOpacity>

        {/* Cancel — available any time before the trip is actually in progress */}
        {status !== TRIP_STATUS.IN_PROGRESS && (
          <TouchableOpacity
            style={[styles.actionBtn, styles.cancelBtn]}
            onPress={onCancelTrip}
            activeOpacity={0.8}
            accessibilityLabel="Cancelar viagem"
            accessibilityRole="button"
          >
            <Icon name="cancel" size={scale(18)} color={colors.error} style={styles.btnIcon} />
            <Text style={[styles.btnText, styles.cancelBtnText]}>Cancelar viagem</Text>
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
});

const styles = StyleSheet.create({
  staleNotice: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.warningLight,
    borderRadius: borderRadius.md,
    paddingVertical: scale(9),
    paddingHorizontal: spacing.md,
    marginBottom: spacing.sm,
  },
  staleNoticeText: {
    flex: 1,
    marginLeft: spacing.sm,
    fontSize: scale(12.5),
    fontWeight: '600',
    color: colors.textPrimary,
  },
  container: {
    paddingBottom: spacing.lg,
  },
  routeContainer: {
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.lg,
  },
  divider: {
    height: 1,
    backgroundColor: colors.borderLight,
    marginHorizontal: spacing.lg,
    marginBottom: spacing.md,
  },
  actions: {
    paddingHorizontal: spacing.lg,
  },
  actionBtn: {
    flexDirection: "row",
    alignItems: "center",
    borderRadius: borderRadius.xl,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.lg,
    marginBottom: spacing.sm,
    borderWidth: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.07,
    shadowRadius: 6,
    elevation: 4,
  },
  btnIcon: {
    marginRight: spacing.md,
  },
  btnText: {
    fontSize: scale(15),
    fontWeight: "600",
    flex: 1,
  },
  shareBtn: {
    backgroundColor: colors.primaryLight,
    borderColor: colors.primary,
  },
  shareBtnText: {
    color: colors.primary,
  },
  detailsBtn: {
    backgroundColor: colors.surface,
    borderColor: colors.borderLight,
  },
  detailsBtnText: {
    color: colors.textPrimary,
  },
  cancelBtn: {
    backgroundColor: colors.errorSurface,
    borderColor: colors.errorBorder,
  },
  cancelBtnText: {
    color: colors.error,
  },
});

export default DriverStatus;
