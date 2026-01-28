import React from "react";
import { View, TouchableOpacity, StyleSheet, Text, Image } from "react-native";
import Icon from "react-native-vector-icons/MaterialIcons";
import { scale } from "react-native-size-matters";
import { colors, shadows, spacing, borderRadius } from "../../theme";

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
      <View style={{ alignItems: "center" }}>
        <View style={{ alignItems: "center" }}>
          {status === 0 ? (
            <Text style={styles.mainText}>
              Chegando em ~{`${Math.floor(tripDuration)} minutos`}
            </Text>
          ) : status === 1 ? (
            <Text style={styles.mainText}>
              Seu reboque está esperando por você
            </Text>
          ) : (
            <Text style={styles.mainText}>
              A ~{Math.floor(tripDuration)} minutos do destino
            </Text>
          )}
        </View>
        <View style={{ flexDirection: "row" }}>
          <Text
            style={{
              color: colors.textPrimary,
              fontSize: scale(12),
              fontWeight: "bold",
            }}
          >
            {driver.car.name}
          </Text>
          <View
            style={{
              marginLeft: spacing.xs,
              backgroundColor: colors.borderLight,
              borderRadius: borderRadius.sm,
            }}
          >
            <Text
              style={{
                fontSize: scale(10),
                color: colors.textPrimary,
                fontWeight: "bold",
                padding: scale(3),
              }}
            >
              {driver.car.licensePlate}
            </Text>
          </View>
        </View>
      </View>
      <View>
        <View
          style={{
            flexDirection: "row",
            justifyContent: "center",
            paddingTop: spacing.xl,
          }}
        >
          <TouchableOpacity onPress={onCallDriver}>
            <View style={styles.circle}>
              <Icon name="add-call" size={scale(15)} color={colors.surface} />
            </View>
          </TouchableOpacity>
          <View style={{ alignItems: "center" }}>
            <Image
              source={{
                uri: driver?.photo || imgDef,
              }}
              style={{
                width: scale(75),
                height: scale(75),
                borderRadius: scale(45),
              }}
            />
            <Text
              style={{
                fontSize: scale(14),
                marginTop: spacing.xs,
                color: colors.textMuted,
              }}
            >
              {driver.name}
            </Text>
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
