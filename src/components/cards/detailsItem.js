import React from "react";
import { View, StyleSheet, Text, TouchableOpacity } from "react-native";
import Icon from "react-native-vector-icons/MaterialIcons";
import { scale } from "react-native-size-matters";

const DetailsItem = ({destination, driver, clientCar, paymentMethod }) => {

  return (
    <View style={{ marginLeft: scale(15) }}>
      <Text
        style={{
          fontSize: scale(18),
          alignSelf: "center",
          color: "#0089FF",
          fontWeight: "900",
          marginBottom: scale(10),
        }}
      >
        DETALHES DA VIAGEM
      </Text>
      <View style={{marginLeft:scale(10), marginTop:scale(15)}}>
        <View>
          <View style={styles.containerText}>
            <Text
              style={{
                color: "#fff",
                fontSize: scale(12),
                alignSelf: "center",
              }}
            >
              Indo para 
            </Text>
          </View>
          <Text> {destination}</Text>
          <View style={styles.divider} />
        </View>
        <View>
          <View style={styles.containerText}>
            <Text
              style={{
                color: "#fff",
                fontSize: scale(12),
                alignSelf: "center",
              
              }}
            >
              Seu Motorista
            </Text>
          </View>
          <Text> {driver.name}</Text>
          <View style={styles.divider} />
        </View>
        <View>
          <View style={styles.containerText}>
            <Text
              style={{
                color: "#fff",
                fontSize: scale(12),
                alignSelf: "center",
              }}
            >
              Detalhes do carro
            </Text>
          </View>
          <Text> {clientCar}</Text>
          <View style={styles.divider} />
        </View>
        <View>
          <View style={styles.containerText}>
            <Text
              style={{
                color: "#fff",
                fontSize: scale(12),
                alignSelf: "center",
              }}
            >
              Carro Reboque
            </Text>
          </View>
          <Text> {driver?.car?.name} | {driver?.car?.licensePlate}</Text>
          <View style={styles.divider} />
        </View>
        <View>
          <View style={styles.containerText}>
            <Text
              style={{
                color: "#fff",
                fontSize: scale(12),
                alignSelf: "center",
              }}
            >
              Pagamento
            </Text>
          </View>
          <Text> {paymentMethod}</Text>
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  containerText: {
    width: scale(120),
    height: scale(25),
    backgroundColor: "#0089FF",
    borderRadius: scale(5),
    justifyContent:"center",
    marginBottom:scale(10)
  },
  divider: {
    borderBottomColor: "#000",
    borderWidth: scale(0.2),
    width: scale(300),
    marginRight:scale(50),
    marginVertical:scale(15)
  },
});

export default DetailsItem;
