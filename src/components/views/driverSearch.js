import { Text, TouchableOpacity } from "react-native";
import { StyleSheet, View } from "react-native";
import { scale } from "react-native-size-matters";
import ProgressBar from "react-native-progress-bar-horizontal";
import RouteItem from "../cards/routeItem";
import MaterialIcons from "@expo/vector-icons/MaterialIcons";
const Icon = MaterialIcons;
import { colors, spacing, borderRadius } from "../../theme";

const DriverSearch = ({ origin, destination, timer, formatTime, accepted, onCancelSearch, calculateProgress }) => {
  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <View style={styles.row}>
          {accepted ? (
            <Text style={styles.mainText}>Conectando ao motorista</Text>
          ) : (
            <>
              <Text style={styles.mainText}>Procurando um reboque</Text>
              <Text style={styles.timerText}>{formatTime(timer)}</Text>
            </>
          )}
        </View>

        <ProgressBar
          progress={calculateProgress ? calculateProgress() : (1 - timer / 180)}
          borderWidth={0}
          fillColor={colors.primary}
          unfilledColor={colors.border}
          height={scale(4)}
          borderColor="transparent"
          duration={100}
          width={null} // Let layout handle width if possible, or force full width via parent
          style={{ width: '100%', borderRadius: scale(2) }}
        />

        <View style={styles.descriptionContainer}>
          {accepted ? (
            <Text style={styles.descriptionText}>
              Motorista a verificar os detalhes da viagem... Por favor,
              espere um pouco!
            </Text>
          ) : (
            <Text style={styles.descriptionText}>
              Estamos procurando um reboque para você. Por favor, espere um
              pouco!
            </Text>
          )}
        </View>
      </View>

      <View style={styles.routeContainer}>
        <RouteItem origin={origin} destination={destination} />
      </View>

      <View style={styles.spacer} />

      <TouchableOpacity onPress={() => onCancelSearch()} style={styles.cancelButton}>
        <View style={styles.cancelIconContainer}>
          <Icon name="close" size={scale(16)} color={colors.error} />
        </View>
        <Text style={styles.cancelText}>Cancelar Viagem</Text>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: spacing.xl,
    paddingBottom: spacing.xl,
  },
  header: {
    width: '100%',
    marginBottom: spacing.lg,
  },
  row: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  mainText: {
    fontSize: scale(18),
    fontWeight: "800",
    color: colors.textPrimary,
    letterSpacing: 0.5,
  },
  timerText: {
    fontSize: scale(18),
    fontWeight: "800",
    color: colors.primary,
    fontVariant: ['tabular-nums'],
  },
  descriptionContainer: {
    marginTop: spacing.lg,
  },
  descriptionText: {
    fontSize: scale(14),
    color: colors.textSecondary,
    lineHeight: scale(20),
    fontWeight: "500",
  },
  routeContainer: {
    paddingVertical: spacing.lg,
    borderTopWidth: 1,
    borderBottomWidth: 1,
    borderColor: colors.border,
    marginVertical: spacing.sm,
  },
  spacer: {
    height: spacing.xl,
  },
  cancelButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.errorSurface,
    paddingVertical: scale(14),
    borderRadius: borderRadius.md,
    borderWidth: 1,
    borderColor: colors.errorBorder,
  },
  cancelIconContainer: {
    marginRight: spacing.sm,
  },
  cancelText: {
    fontSize: scale(15),
    color: colors.error,
    fontWeight: "700",
  },
});

export default DriverSearch;
