import React from "react";
import { View, TouchableOpacity, StyleSheet, Text, Image } from "react-native";
import Icon from "react-native-vector-icons/MaterialIcons";
import { scale } from "react-native-size-matters";

const DriverItem = ({
  driver,
  tripDuration,
  onCallDriver,
  onMessageDriver,
  status,
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
              color: "#000",
              fontSize: scale(12),
              fontWeight: "bold",
            }}
          >
            {driver.car.name}
          </Text>
          <View
            style={{
              marginLeft: scale(5),
              backgroundColor: "#ccc",
              borderRadius: scale(5),
            }}
          >
            <Text
              style={{
                fontSize: scale(10),
                color: "#000",
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
            paddingTop: scale(35),
          }}
        >
          <TouchableOpacity onPress={onCallDriver}>
            <View style={styles.circle}>
              <Icon name="add-call" size={scale(15)} color="#fff" />
            </View>
          </TouchableOpacity>
          <View style={{ alignItems: "center" }}>
            <Image
              source={{
                uri: driver?.photo || null,
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
                marginTop: scale(5),
                color: "#ccc",
              }}
            >
              {driver.name}
            </Text>
          </View>
          <TouchableOpacity onPress={onMessageDriver}>
            <View style={styles.circle}>
              <Icon name="message" size={scale(15)} color="#fff" />
            </View>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  mainText: {
    color: "#000",
    fontSize: scale(18),
    fontWeight: "bold",
    marginBottom: scale(3),
  },
  circle: {
    width: scale(35),
    height: scale(35),
    borderRadius: scale(75),
    borderColor: "#0089ff",
    borderWidth: scale(2),
    backgroundColor: "#0089ff",
    justifyContent: "center",
    alignItems: "center",
    alignSelf: "center",
    marginHorizontal: scale(18),
    marginTop: scale(20),
  },
});
export default DriverItem;
