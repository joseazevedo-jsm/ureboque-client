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
  onShareLocation,
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

        {/* Cancel — only when driver is en route */}
        {status === TRIP_STATUS.DRIVER_EN_ROUTE && (
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
