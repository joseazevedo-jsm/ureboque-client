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

import { Text, TouchableOpacity } from "react-native";
import { StyleSheet, View } from "react-native";
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
  bttmSheetRef,
}) => {
  if (!driver)
    return  

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
        />
      </View>

      <View
        style={{ paddingVertical: scale(20), paddingHorizontal: scale(10) }}
      >
        <RouteItem origin={origin} destination={destination} />
      </View>

      <View style={styles.spacer} />
      <TouchableOpacity onPress={() => onDetailsTrip(bttmSheetRef)}>
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
        <TouchableOpacity onPress={onCancelTrip}>
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
  mainText: {
    fontSize: scale(18),
  },

  options: {
    paddingVertical: scale(14),
    flexDirection: "row",
    marginLeft: scale(10),
  },

  circle: {
    width: scale(20),
    height: scale(20),
    borderRadius: scale(75),
    borderWidth: scale(2),
    backgroundColor: "#fff",
    justifyContent: "center",
    alignItems: "center",
    alignSelf: "center",
  },

  spacer: {
    height: scale(10),
    backgroundColor: "#ccc",
  },

  options2: {
    borderColor: "#B7B7B7",
    borderTopWidth: scale(7),
    paddingVertical: scale(14),
  },
  optionsButton: {
    flexDirection: "row",
    paddingHorizontal: scale(10),
    paddingVertical: scale(15),
  },
  optionsButtonText: {
    fontSize: scale(14),
    marginLeft: scale(10),
  },
  cancel: {
    width: scale(20),
    height: scale(20),
    borderRadius: scale(75),
    borderWidth: scale(2),
    borderColor: "red",
    backgroundColor: "#fff",
    justifyContent: "center",
    alignItems: "center",
    alignSelf: "center",
  },
});

export default DriverStatus;
