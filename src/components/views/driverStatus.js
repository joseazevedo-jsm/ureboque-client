//       <View
//         style={{
//           marginLeft: scale(10),
//           flexDirection: "row",
//           marginTop: scale(35),
//           justifyContent: "space-evenly",
//           alignSelf: "center",
//         }}
//       >
//         <View style={styles.spacing} />
//         <TouchableOpacity onPress={operations.handleCancelButtonPress}>
//           <View style={styles.circle}>
//             <Text style={styles.cross}>X</Text>
//           </View>
//           <Text style={{ alignSelf: "center" }}>Cancelar</Text>
//         </TouchableOpacity>
//         <View style={styles.spacing} />

//         <View style={styles.spacing} />
//       </View>
//     </View>
//   ) : null}

import { StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { scale } from "react-native-size-matters";
import RouteItem from "../cards/routeItem";
import Icon from "react-native-vector-icons/MaterialIcons";
import DriverItem from "../cards/driverItem";

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
  if (!driver)
    return null;

  return (
    <View>
      <View>
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
      </View>

      <View
        style={{ paddingVertical: scale(12), paddingHorizontal: scale(10) }}
      >
        <RouteItem origin={origin} destination={destination} />
      </View>

      <View style={styles.spacer} />
      <TouchableOpacity
        onPress={() => onDetailsTrip(bttmSheetRef)}
        accessibilityLabel="Ver detalhes da viagem"
        accessibilityRole="button"
      >
        <View style={styles.options}>
          <View style={styles.circle}>
            <Icon name="priority-high" size={scale(13)} color="#000" />
          </View>
          <Text style={[styles.optionsButtonText, { color: "#000" }]}>
            Detalhes
          </Text>
        </View>
      </TouchableOpacity>

      <View style={styles.spacer} />
      {status === 0 && (
        <TouchableOpacity
          onPress={onCancelTrip}
          accessibilityLabel="Cancelar viagem atual"
          accessibilityRole="button"
        >
          <View style={styles.options}>
            <View style={[styles.circle, { borderColor: "red" }]}>
              <Icon name="close" size={scale(13)} color="red" />
            </View>
            <Text style={[styles.optionsButtonText, { color: "red" }]}>
              Cancelar viagem
            </Text>
          </View>
        </TouchableOpacity>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  circle: {
    width: scale(32),
    height: scale(32),
    borderRadius: scale(16),
    backgroundColor: "rgba(255,255,255,0.8)",
    justifyContent: "center",
    alignItems: "center",
    alignSelf: "center",
    borderWidth: 1,
    borderColor: "rgba(0,0,0,0.05)",
  },
  spacer: {
    height: 1,
    backgroundColor: "rgba(0,0,0,0.05)",
    marginVertical: scale(8),
  },
  optionsButtonText: {
    fontSize: scale(15),
    marginLeft: scale(16),
    fontWeight: "600",
  },
  options: {
    paddingVertical: scale(12),
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: scale(20),
  },
});

export default DriverStatus;
