import { StyleSheet, Text, View } from "react-native";
import { scale } from "react-native-size-matters";
import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import { useSocket } from "../../context/SocketContext";
import { colors, spacing, borderRadius } from "../../theme";

/**
 * Shown while the realtime connection is down.
 *
 * Without it a dropped connection is invisible: the search keeps counting
 * down and the ride screen keeps showing its last known state, so the user
 * has no way to tell a quiet network from a quiet server. The trip is
 * re-synced on reconnect, so the message promises a recovery that actually
 * happens rather than asking the user to do anything.
 */
const ConnectionBanner = ({ style }) => {
  const { isConnected } = useSocket();
  if (isConnected) return null;

  return (
    <View style={[styles.banner, style]}>
      <MaterialIcons name="wifi-off" size={scale(16)} color={colors.warning} />
      <Text style={styles.text}>
        Sem ligação. A tentar reconectar…
      </Text>
    </View>
  );
};

const styles = StyleSheet.create({
  banner: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: colors.warningLight,
    borderRadius: borderRadius.md,
    paddingVertical: scale(10),
    paddingHorizontal: spacing.md,
    marginBottom: spacing.md,
  },
  text: {
    flex: 1,
    marginLeft: spacing.sm,
    fontSize: scale(13),
    fontWeight: "600",
    color: colors.textPrimary,
  },
});

export default ConnectionBanner;
