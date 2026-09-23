import { AppText as Text } from '../common/AppText';
import { AppPressable as TouchableOpacity } from '../common/AppPressable';

import { StyleSheet, View } from "react-native";
import { scale } from "react-native-size-matters";
import ProgressBar from "react-native-progress-bar-horizontal";
import RouteItem from "../cards/routeItem";
import MaterialIcons from "@expo/vector-icons/MaterialIcons";
const Icon = MaterialIcons;
import ConnectionBanner from "./ConnectionBanner";
import { colors, spacing, borderRadius, typography } from "../../theme";
import { formatScheduledFor } from '../../utils/scheduling';
import { SheetFold } from '../map/useMeasuredSheet';

// What a dispatched scheduled tow is waiting on: its own driver answering, or
// a search because nobody took it or that driver was not available.
const scheduledCopy = (service, scheduledFor) => {
  const when = `Recolha ${formatScheduledFor(scheduledFor)}.`;
  const claimedId = service?.claimedBy?._id || service?.claimedBy;
  const name = service?.claimedBy?.details?.name || 'O motorista';
  const driverId = service?.driver?._id || service?.driver;
  if (claimedId && driverId && String(claimedId) === String(driverId)) {
    return { title: 'A confirmar motorista', text: `${when} ${name} reservou o seu reboque e está a confirmar a saída.` };
  }
  if (claimedId) {
    return { title: 'A procurar motorista', text: `${when} ${name} ainda não confirmou. Estamos também a procurar outro motorista.` };
  }
  return { title: 'A procurar motorista', text: `${when} Nenhum motorista reservou este reboque. Estamos a procurar um motorista disponível.` };
};

const DriverSearch = ({ origin, destination, timer, formatTime, accepted, onCancelSearch, calculateProgress, scheduledFor, scheduledService, onFoldLayout }) => {
  const scheduled = scheduledFor ? scheduledCopy(scheduledService, scheduledFor) : null;
  return (
    <View style={styles.container}>
      <ConnectionBanner />
      <View style={styles.header}>
        <View style={styles.row}>
          {accepted ? (
            <Text style={styles.mainText}>Conectando ao motorista</Text>
          ) : (
            <>
              <Text style={styles.mainText}>{scheduled ? scheduled.title : 'Procurando um reboque'}</Text>
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
          style={{ width: '100%', borderRadius: borderRadius.sm }}
        />

        <View style={styles.descriptionContainer}>
          {scheduledFor ? (
            <Text style={styles.descriptionText}>
              {accepted ? `Recolha ${formatScheduledFor(scheduledFor)}. O motorista está a confirmar o pedido.` : scheduled.text}
            </Text>
          ) : accepted ? (
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

      {/* The fold. The sheet rests on this line, so "Cancelar Viagem" below
          it is exactly what a drag up reveals. */}
      <SheetFold onLayout={onFoldLayout} />
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
    marginBottom: spacing.md,
  },
  row: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  mainText: {
    fontSize: typography.body.fontSize, lineHeight: typography.body.lineHeight,
    fontWeight: "700",
    color: colors.textPrimary,
    letterSpacing: 0.5,
  },
  timerText: {
    fontSize: typography.body.fontSize, lineHeight: typography.body.lineHeight,
    fontWeight: "700",
    color: colors.primary,
    fontVariant: ['tabular-nums'],
  },
  descriptionContainer: {
    marginTop: spacing.md,
  },
  descriptionText: {
    fontSize: typography.bodySmall.fontSize, lineHeight: typography.bodySmall.lineHeight,
    color: colors.textSecondary,
    lineHeight: 20,
    fontWeight: "500",
  },
  routeContainer: {
    paddingVertical: spacing.md,
    borderTopWidth: 1,
    borderBottomWidth: 1,
    borderColor: colors.border,
    marginVertical: spacing.xs,
  },
  cancelButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.errorSurface,
    paddingVertical: spacing.md,
    borderRadius: borderRadius.md,
    borderWidth: 1,
    borderColor: colors.errorBorder,
  },
  cancelIconContainer: {
    marginRight: spacing.sm,
  },
  cancelText: {
    fontSize: typography.bodySmall.fontSize, lineHeight: typography.bodySmall.lineHeight,
    color: colors.error,
    fontWeight: "700",
  },
});

export default DriverSearch;
