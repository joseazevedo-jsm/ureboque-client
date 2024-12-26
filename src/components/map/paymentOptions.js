import React from "react";
import { View, TouchableOpacity, Text, StyleSheet } from "react-native";
import Icon from "react-native-vector-icons/MaterialIcons";
import { scale } from "react-native-size-matters";
import CarTypes from "../cards/carTypes";
import { Image } from "react-native";

const PaymentOptions = ({ operations, models }) => {
  const renderPaymentOption = (iconName, label, paymentType) => (
    <TouchableOpacity onPress={operations.handleConfirmPaymentPress(paymentType)}>
      <View style={styles.paymentOption}>
        {iconName === "money" ? (
          <Image
            source={require("../../../resources/icons/payment/CASH.png") }
            style={{ width: scale(50), height: scale(50) }}
            resizeMode="contain"
          />
        ) : (
          <Image
            source={require("../../../resources/icons/payment/MULTICARD.png")}
            style={{ width: scale(50), height: scale(50) }}
            resizeMode="contain"
          />
        )}
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
        {renderPaymentOption("money", "Cash", "DINHEIRO")}
        {renderPaymentOption("credit-card", "Multicaixa", "MULTICAIXA")}
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