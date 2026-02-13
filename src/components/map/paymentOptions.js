import React from "react";
import { View, Text, StyleSheet, Image } from "react-native";
import { scale } from "react-native-size-matters";
import { LinearGradient } from "expo-linear-gradient";
import CarTypes from "../cards/carTypes";
import { ScalePressable } from "../common/ScalePressable";
import { colors, spacing, borderRadius, shadows, typography } from "../../theme";

const PaymentOptions = ({ handleConfirmPaymentPress, models }) => {
  const renderPaymentOption = (iconName, label, paymentType) => (
    <View key={paymentType} style={styles.paymentOptionContainer}>
      <ScalePressable onPress={handleConfirmPaymentPress(paymentType)}>
        <LinearGradient
          colors={['rgba(255,255,255,0.9)', 'rgba(255,255,255,0.6)']}
          style={styles.paymentOption}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
        >
          {iconName === "money" ? (
            <Image
              source={require("../../../resources/icons/payment/CASH.png")}
              style={styles.paymentImageConfig}
              resizeMode="contain"
            />
          ) : (
            <Image
              source={require("../../../resources/icons/payment/MULTICARD.png")}
              style={styles.paymentImageConfig}
              resizeMode="contain"
            />
          )}
          <Text style={styles.paymentOptionText}>{label}</Text>
        </LinearGradient>
      </ScalePressable>
    </View>
  );

  return (
    <View>
      <CarTypes
        typeCar={models.typeCar}
        descr={`${models.brand} ${models.model}`}
        descr2={`${models.color}, ${models.license}`}
        route={models.mapDirections}
        price={models.ridePrice}
      />

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
    ...typography.sectionTitle,
    marginBottom: spacing.lg,
    marginLeft: spacing.xl,
    marginTop: spacing.lg,
  },
  paymentOptionContainer: {
    marginHorizontal: spacing.xl,
    marginBottom: spacing.sm,
    ...shadows.lg,
  },
  paymentOption: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.lg,
    borderRadius: borderRadius.xxl,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.6)',
  },
  paymentImageConfig: {
    width: scale(40),
    height: scale(25),
  },
  paymentOptionText: {
    color: colors.textPrimary,
    fontSize: scale(16),
    fontWeight: "600",
    marginLeft: spacing.lg,
  },
});

export default PaymentOptions;