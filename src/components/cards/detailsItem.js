import React, { memo, useMemo } from "react";
import { View, StyleSheet, Text, TouchableOpacity } from "react-native";
import Icon from "react-native-vector-icons/MaterialIcons";
import { scale } from "react-native-size-matters";

const DetailsItem = memo(({ destination, driver, clientCar, paymentMethod }) => {
  const towCarInfo = useMemo(() => {
    return `${driver?.car?.name} | ${driver?.car?.licensePlate}`;
  }, [driver?.car?.name, driver?.car?.licensePlate]);

  return (
    <View style={styles.containerStyle}>
      <Text style={styles.titleStyle}>
        DETALHES DA VIAGEM
      </Text>
      <View style={styles.contentStyle}>
        <View>
          <View style={styles.containerText}>
            <Text style={styles.labelStyle}>
              Indo para 
            </Text>
          </View>
          <Text> {destination}</Text>
          <View style={styles.divider} />
        </View>
        <View>
          <View style={styles.containerText}>
            <Text style={styles.labelStyle}>
              Seu Motorista
            </Text>
          </View>
          <Text> {driver.name}</Text>
          <View style={styles.divider} />
        </View>
        <View>
          <View style={styles.containerText}>
            <Text style={styles.labelStyle}>
              Detalhes do carro
            </Text>
          </View>
          <Text> {clientCar}</Text>
          <View style={styles.divider} />
        </View>
        <View>
          <View style={styles.containerText}>
            <Text style={styles.labelStyle}>
              Carro Reboque
            </Text>
          </View>
          <Text> {towCarInfo}</Text>
          <View style={styles.divider} />
        </View>
        <View>
          <View style={styles.containerText}>
            <Text style={styles.labelStyle}>
              Pagamento
            </Text>
          </View>
          <Text> {paymentMethod}</Text>
        </View>
      </View>
    </View>
  );
});

const styles = StyleSheet.create({
  containerStyle: {
    marginLeft: scale(15)
  },
  titleStyle: {
    fontSize: scale(18),
    alignSelf: "center",
    color: "#0089FF",
    fontWeight: "900",
    marginBottom: scale(10),
  },
  contentStyle: {
    marginLeft: scale(10),
    marginTop: scale(15)
  },
  labelStyle: {
    color: "#fff",
    fontSize: scale(12),
    alignSelf: "center",
  },
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
