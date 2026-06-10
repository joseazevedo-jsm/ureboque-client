import { StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { scale } from "react-native-size-matters";
import RouteItem from "../cards/routeItem";
import Icon from "react-native-vector-icons/MaterialIcons";
import DriverItem from "../cards/driverItem";
import { colors, spacing, borderRadius, shadows } from "../../theme";
import { TRIP_STATUS } from "../../constants/tripStatus";

const DriverStatus = ({
  status,
  driver,
  origin,
  destination,
  tripDuration,
  onDetailsTrip,
  onCancelTrip,
  onMessageDriver,
  onCallDriver,
  bttmSheetRef,
  unreadMessageCount = 0,
}) => {
  if (!driver) return null;

  return (
    <View style={styles.container}>
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
        <TouchableOpacity
          style={styles.actionButton}
          onPress={() => onDetailsTrip(bttmSheetRef)}
          activeOpacity={0.7}
          accessibilityLabel="Ver detalhes da viagem"
          accessibilityRole="button"
        >
          <View style={styles.actionIcon}>
            <Icon name="info-outline" size={scale(18)} color={colors.primary} />
          </View>
          <Text style={styles.actionText}>Detalhes</Text>
          <Icon name="chevron-right" size={scale(18)} color={colors.textMuted} />
        </TouchableOpacity>

        {status === TRIP_STATUS.DRIVER_EN_ROUTE && (
          <>
            <View style={styles.divider} />
            <TouchableOpacity
              style={styles.actionButton}
              onPress={onCancelTrip}
              activeOpacity={0.7}
              accessibilityLabel="Cancelar viagem atual"
              accessibilityRole="button"
            >
              <View style={[styles.actionIcon, styles.actionIconDanger]}>
                <Icon name="close" size={scale(18)} color={colors.error} />
              </View>
              <Text style={[styles.actionText, styles.actionTextDanger]}>
                Cancelar viagem
              </Text>
              <Icon name="chevron-right" size={scale(18)} color={colors.textMuted} />
            </TouchableOpacity>
          </>
        )}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
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
  },
  actions: {
    marginTop: spacing.xs,
  },
  actionButton: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.lg,
  },
  actionIcon: {
    width: scale(34),
    height: scale(34),
    borderRadius: borderRadius.md,
    backgroundColor: colors.primaryLight,
    justifyContent: "center",
    alignItems: "center",
    marginRight: spacing.md,
  },
  actionIconDanger: {
    backgroundColor: colors.errorLight,
  },
  actionText: {
    flex: 1,
    fontSize: scale(15),
    fontWeight: "600",
    color: colors.textPrimary,
  },
  actionTextDanger: {
    color: colors.error,
  },
});

export default DriverStatus;
