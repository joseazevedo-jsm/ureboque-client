import React from "react";
import { View, TouchableOpacity, StyleSheet, Text, Image } from "react-native";
import MaterialIcons from "@expo/vector-icons/MaterialIcons";
const Icon = MaterialIcons;
import { scale } from "react-native-size-matters";
import { colors, shadows, spacing, borderRadius } from "../../theme";
import { TRIP_STATUS } from "../../constants/tripStatus";

const imgDef =
  "https://w7.pngwing.com/pngs/178/595/png-transparent-user-profile-computer-icons-login-user-avatars-thumbnail.png";

const DriverItem = ({
  driver,
  tripDuration,
  onCallDriver,
  onMessageDriver,
  status,
  unreadMessageCount = 0,
}) => {
  return (
    <View>
      <View style={styles.infoCenter}>
        <View style={styles.infoCenter}>
          {status === TRIP_STATUS.DRIVER_EN_ROUTE ? (
            <Text style={styles.mainText}>
              Chegando em ~{`${Math.floor(tripDuration)} minutos`}
            </Text>
          ) : status === TRIP_STATUS.DRIVER_ARRIVED ? (
            <Text style={styles.mainText}>
              Seu reboque está esperando por você
            </Text>
          ) : (
            <Text style={styles.mainText}>
              A ~{Math.floor(tripDuration)} minutos do destino
            </Text>
          )}
        </View>
        <View style={styles.carInfoRow}>
          <Text style={styles.carName}>{driver?.car?.name ?? ''}</Text>
          <View style={styles.plateBadge}>
            <Text style={styles.plateText}>{driver?.car?.licensePlate ?? ''}</Text>
          </View>
        </View>
      </View>
      <View>
        <View style={styles.actionsRow}>
          <TouchableOpacity onPress={onCallDriver}>
            <View style={styles.circle}>
              <Icon name="add-call" size={scale(15)} color={colors.surface} />
            </View>
          </TouchableOpacity>
          <View style={styles.driverAvatarContainer}>
            <Image
              source={{ uri: driver?.photo || imgDef }}
              style={styles.driverPhoto}
            />
            <Text style={styles.driverName}>{driver.name}</Text>
          </View>
          <TouchableOpacity onPress={onMessageDriver}>
            <View style={styles.circle}>
              <Icon name="message" size={scale(15)} color={colors.surface} />
              {unreadMessageCount > 0 && (
                <View style={styles.badge}>
                  <Text style={styles.badgeText}>{unreadMessageCount}</Text>
                </View>
              )}
            </View>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  infoCenter: {
    alignItems: "center",
  },
  carInfoRow: {
    flexDirection: "row",
  },
  carName: {
    color: colors.textPrimary,
    fontSize: scale(12),
    fontWeight: "bold",
  },
  plateBadge: {
    marginLeft: spacing.xs,
    backgroundColor: colors.primary,
    borderRadius: borderRadius.sm,
    paddingHorizontal: spacing.sm,
    paddingVertical: scale(3),
  },
  plateText: {
    fontSize: scale(10),
    color: colors.surface,
    fontWeight: "bold",
  },
  actionsRow: {
    flexDirection: "row",
    justifyContent: "center",
    paddingTop: spacing.xl,
  },
  driverAvatarContainer: {
    alignItems: "center",
  },
  driverPhoto: {
    width: scale(75),
    height: scale(75),
    borderRadius: scale(45),
    borderWidth: 3,
    borderColor: colors.primary,
  },
  driverName: {
    fontSize: scale(14),
    marginTop: spacing.xs,
    color: colors.textMuted,
  },
  mainText: {
    color: colors.textPrimary,
    fontSize: scale(18),
    fontWeight: "800",
    marginBottom: spacing.sm,
    marginTop: spacing.xs,
  },
  circle: {
    width: scale(40),
    height: scale(40),
    borderRadius: borderRadius.xxl,
    backgroundColor: colors.primary,
    justifyContent: "center",
    alignItems: "center",
    alignSelf: "center",
    marginHorizontal: spacing.xl,
    marginTop: spacing.md,
    ...shadows.primaryGlow,
  },
  badge: {
    position: "absolute",
    top: scale(-2),
    right: scale(-2),
    backgroundColor: colors.error,
    borderRadius: scale(10),
    minWidth: scale(18),
    height: scale(18),
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 2,
    borderColor: colors.surface,
  },
  badgeText: {
    color: colors.surface,
    fontSize: scale(10),
    fontWeight: "bold",
    textAlign: "center",
  },
});
export default DriverItem;
