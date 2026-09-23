import React, { memo } from "react";
import { StyleSheet, View } from 'react-native';
import { AppText as Text } from '../common/AppText';
import { AppButton } from '../common/AppButton';

import RouteItem from "../cards/routeItem";
import MaterialIcons from "@expo/vector-icons/MaterialIcons";
const Icon = MaterialIcons;
import DriverItem from "../cards/driverItem";
import ConnectionBanner from "./ConnectionBanner";
import { useDriverLocationStale } from "../../hooks/useMapDrivers";
import { colors, spacing, borderRadius, borderWidths, typography, sizes, layout } from "../../theme";
import { TRIP_STATUS } from "../../constants/tripStatus";
import { SheetFold } from "../map/useMeasuredSheet";

// A driver marker that stops moving is ambiguous: parked, or no longer
// reporting at all. Dimming the map pin was the previous signal, but it never
// reached the screen and is easy to miss even when it does. Say it in words on
// the card the rider is already looking at.
const DriverLocationStaleNotice = () => {
  const isStale = useDriverLocationStale();
  if (!isStale) return null;
  return (
    <View style={styles.staleNotice}>
      <Icon name="location-off" size={sizes.icon} color={colors.warning} />
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
  onFoldLayout,
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

      {/* The fold. The sheet rests on this line, so the actions below it are
          exactly what a drag up reveals. */}
      <SheetFold onLayout={onFoldLayout} />

      <View style={styles.actions}>
        <AppButton variant="secondary" onPress={onShareLocation}
          icon={<Icon name="near-me" size={sizes.icon} color={colors.primary} />}>
          Partilhar localização
        </AppButton>
        <AppButton variant="neutral" onPress={() => onDetailsTrip(bttmSheetRef)}
          icon={<Icon name="format-list-bulleted" size={sizes.icon} color={colors.textPrimary} />}>
          Detalhes da viagem
        </AppButton>
        {status !== TRIP_STATUS.IN_PROGRESS && (
          <AppButton variant="dangerOutline" onPress={onCancelTrip}
            icon={<Icon name="cancel" size={sizes.icon} color={colors.error} />}>
            Cancelar viagem
          </AppButton>
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
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.md,
    marginBottom: spacing.sm,
  },
  staleNoticeText: {
    flex: 1,
    marginLeft: spacing.sm,
    ...typography.caption,
    color: colors.textPrimary,
  },
  container: {
    paddingBottom: spacing.xxl,
    width: "100%",
    maxWidth: layout.sheetMaxWidth,
    alignSelf: "center",
  },
  routeContainer: {
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.lg,
  },
  actions: { paddingHorizontal: spacing.lg, paddingTop: spacing.sm, gap: spacing.md },
});

export default DriverStatus;
