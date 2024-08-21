import React from "react";
import { View, TouchableOpacity, Text, StyleSheet } from "react-native";
import Icon from "react-native-vector-icons/MaterialIcons";
import { scale } from "react-native-size-matters";
import CarTypes from "../cards/carTypes";

const PaymentOptions = ({ operations, models }) => {
  const renderPaymentOption = (iconName, label, paymentType) => (
    <TouchableOpacity onPress={operations.handleConfirmPaymentPress(paymentType)}>
      <View style={styles.paymentOption}>
        <Icon name={iconName} size={scale(50)} color="#000" />
        <Text style={styles.paymentOptionText}>{label}</Text>
      </View>
    </TouchableOpacity>
  );

  return (
    <View>
      <View>
        <CarTypes
          typeCar={models.typeCar}
          descr={`${models.brand} ${models.model}`}
          descr2={`${models.color}, ${models.license}`}
          route={models.mapDirections}
          price={models.ridePrice}
        />
      </View>

      <Text style={styles.paymentTitle}>COMO É QUE VAI PAGAR?</Text>
      <View>
        {renderPaymentOption("money", "CASH", "DINHEIRO")}
        {renderPaymentOption("credit-card", "MULTICAIXA", "MULTICAIXA")}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  paymentTitle: {
    fontSize: scale(18),
    color: "#0089FF",
    fontWeight: "900",
    marginBottom: scale(5),
    marginLeft: scale(20),
  },
  paymentOption: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: scale(20),
  },
  paymentOptionText: {
    color: "#000",
    fontSize: scale(18),
    fontWeight: "700",
    marginLeft: scale(20),
  },
});

export default PaymentOptions;