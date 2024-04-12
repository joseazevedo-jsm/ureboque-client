import { Text, TouchableOpacity } from "react-native";
import { StyleSheet, View } from "react-native";
import { scale } from "react-native-size-matters";
import ProgressBar from "react-native-progress-bar-horizontal";
import RouteItem from "../cards/routeItem";
import Icon from "react-native-vector-icons/MaterialIcons";

const DriverSearch = ({ origin, destination, timer, formatTime, accepted }) => {
  return (
    <View>
      <View style={{ marginLeft: scale(10), width: scale(325) }}>
        <View
          style={{
            flexDirection: "row",
            justifyContent: "space-between",
            paddingVertical: scale(15),
          }}
        >
          {accepted ? (
            <Text style={styles.mainText}>Conectando ao motorista </Text>
          ) : (
            <>
              <Text style={styles.mainText}>Procurando um reboque</Text>
              <Text style={{ fontSize: scale(18) }}>{formatTime(timer)}</Text>
            </>
          )}
        </View>

        <ProgressBar
          progress={timer / 180}
          borderWidth={scale(0.1)}
          fillColor="#0089FF"
          unfilledColor="black"
          height={scale(2)}
          borderColor="black"
          duration={100}
        />
        <View style={{ marginTop: scale(15), width: scale(250) }}>
          {accepted ? (
            <Text style={{ fontSize: scale(14) }}>
              Motorista a verificar os detalhes da viagem... Por favor, 
              espere um pouco!
            </Text>
          ) : (
            <Text style={{ fontSize: scale(14) }}>
              Estamos procurando um reboque para você. Por favor, espere um
              pouco!
            </Text>
          )}
        </View>
      </View>

      <View
        style={{ paddingVertical: scale(15), paddingHorizontal: scale(10) }}
      >
        <RouteItem origin={origin} destination={destination} />
      </View>

      <View>
        <View style={{ height: scale(10), backgroundColor: "#ccc" }} />

        <TouchableOpacity>
          <View style={styles.optionsButton}>
            <View style={styles.cancel}>
              <Icon name="close" size={scale(13)} color="red" />
            </View>
            <Text style={styles.optionsButtonText}>Cancelar Viagem</Text>
          </View>
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  mainText: {
    fontSize: scale(18),
  },
  options: {
    paddingVertical: scale(14),
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
    // fontFamily: "Poppins-Medium",
    fontSize: scale(15),
    color: "red",
    paddingHorizontal: scale(10),
    textAlignVertical: "center",
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

export default DriverSearch;
