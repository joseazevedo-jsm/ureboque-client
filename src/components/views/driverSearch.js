import { Text, TouchableOpacity } from "react-native";
import { StyleSheet, View } from "react-native";
import { scale } from "react-native-size-matters";
import ProgressBar from "react-native-progress-bar-horizontal";
import RouteItem from "../cards/routeItem";
import Icon from "react-native-vector-icons/MaterialIcons";

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
          fillColor="#0089FF"
          unfilledColor="rgba(0,0,0,0.05)"
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
          <Icon name="close" size={scale(16)} color="#DC2626" />
        </View>
        <Text style={styles.cancelText}>Cancelar Viagem</Text>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: scale(20),
    paddingBottom: scale(20),
  },
  header: {
    width: '100%',
    marginBottom: scale(16),
  },
  row: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: 'center',
    marginBottom: scale(12),
  },
  mainText: {
    fontSize: scale(18),
    fontWeight: "800",
    color: "#1E293B",
    letterSpacing: 0.5,
  },
  timerText: {
    fontSize: scale(18),
    fontWeight: "800",
    color: "#0089FF",
    fontVariant: ['tabular-nums'],
  },
  descriptionContainer: {
    marginTop: scale(16),
  },
  descriptionText: {
    fontSize: scale(14),
    color: "#64748B",
    lineHeight: scale(20),
    fontWeight: "500",
  },
  routeContainer: {
    paddingVertical: scale(16),
    borderTopWidth: 1,
    borderBottomWidth: 1,
    borderColor: 'rgba(0,0,0,0.05)',
    marginVertical: scale(8),
  },
  spacer: {
    height: scale(20),
  },
  cancelButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FEF2F2', // Light Red Background
    paddingVertical: scale(14),
    borderRadius: scale(12),
    borderWidth: 1,
    borderColor: '#FCA5A5',
  },
  cancelIconContainer: {
    marginRight: scale(8),
  },
  cancelText: {
    fontSize: scale(15),
    color: "#DC2626",
    fontWeight: "700",
  },
});

export default DriverSearch;
