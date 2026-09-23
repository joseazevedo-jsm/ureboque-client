import React, { useEffect, useState } from "react";
import { View, StyleSheet, Image, Pressable } from 'react-native';
import { AppText as Text } from '../common/AppText';

import Animated, { FadeIn, useSharedValue, useAnimatedStyle, withTiming, Easing } from "react-native-reanimated";
import Icon from "@expo/vector-icons/MaterialIcons";
import ScheduleWheel from "./ScheduleWheel";
import { SCHEDULE_DISPATCH_LEAD_MIN, earliestSlot } from "../../utils/scheduling";
import { scale } from "react-native-size-matters";
import CarTypes from "../cards/carTypes";
import { ScalePressable } from "../common/ScalePressable";
import { colors, spacing, borderRadius, shadows, typography, sizes } from "../../theme";

// Agora | Agendar. The thumb slides between the two halves.
const WhenToggle = ({ later, onChange }) => {
  const [width, setWidth] = useState(0);
  const x = useSharedValue(later ? 1 : 0);
  useEffect(() => {
    x.value = withTiming(later ? 1 : 0, { duration: 280, easing: Easing.out(Easing.cubic) });
  }, [later]);
  const thumbStyle = useAnimatedStyle(() => ({ transform: [{ translateX: x.value * (width / 2) }] }));

  return (
    <View style={styles.toggle} onLayout={(e) => setWidth(e.nativeEvent.layout.width - TOGGLE_PADDING * 2)}>
      {width > 0 && <Animated.View style={[styles.thumb, { width: width / 2 }, thumbStyle]} />}
      <Pressable style={styles.toggleOption} onPress={() => onChange(false)} accessibilityRole="button" accessibilityState={{ selected: !later }}>
        <Text style={[styles.toggleText, !later && styles.toggleTextOn]}>Agora</Text>
      </Pressable>
      <Pressable style={styles.toggleOption} onPress={() => onChange(true)} accessibilityRole="button" accessibilityState={{ selected: later }}>
        <Icon name="schedule" size={sizes.iconSmall} color={later ? colors.surface : colors.textSecondary} />
        <Text style={[styles.toggleText, later && styles.toggleTextOn]}>Agendar</Text>
      </Pressable>
    </View>
  );
};

const PaymentOptions = ({ handleConfirmPaymentPress, onScheduleChange, models }) => {
  const isSubmitting = !!models.isSubmittingBooking;
  const scheduledFor = models.scheduledFor ? new Date(models.scheduledFor) : null;

  const renderPaymentOption = (iconName, label, paymentType) => (
    <View key={paymentType} style={styles.paymentOptionContainer}>
      <ScalePressable
        onPress={handleConfirmPaymentPress(paymentType)}
        disabled={isSubmitting}
      >
        <View style={[styles.paymentOption, isSubmitting && styles.paymentOptionDisabled]}>
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
        </View>
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

      <View style={styles.whenCard}>
        <WhenToggle
          later={!!scheduledFor}
          onChange={(later) => onScheduleChange(later ? earliestSlot().toISOString() : null)}
        />
        {scheduledFor && (
          <Animated.View entering={FadeIn.duration(160)}>
            <View style={styles.scheduleHint}>
              <Icon name="auto-awesome" size={scale(16)} color={colors.primary} />
              <Text style={styles.scheduleHintText}>Um motorista reserva o seu reboque e sai {SCHEDULE_DISPATCH_LEAD_MIN} min antes para chegar a horas.</Text>
            </View>
            <ScheduleWheel value={scheduledFor} onChange={(date) => onScheduleChange(date.toISOString())} />
          </Animated.View>
        )}
      </View>

      <Text style={styles.paymentTitle}>{scheduledFor ? "COMO VAI PAGAR NO DIA?" : "COMO É QUE VAI PAGAR?"}</Text>
      <View>
        {renderPaymentOption("money", "Cash", "DINHEIRO")}
        {renderPaymentOption("credit-card", "Multicaixa", "MULTICAIXA")}
      </View>
    </View>
  );
};

const TOGGLE_PADDING = scale(4);

const styles = StyleSheet.create({
  whenCard: {
    marginHorizontal: spacing.xl,
    marginTop: spacing.md,
    borderRadius: borderRadius.xxl,
    backgroundColor: colors.surface,
    ...shadows.sm,
  },
  toggle: {
    flexDirection: "row",
    margin: spacing.sm,
    padding: TOGGLE_PADDING,
    borderRadius: borderRadius.lg,
    backgroundColor: colors.background,
  },
  thumb: {
    position: "absolute",
    top: TOGGLE_PADDING,
    bottom: TOGGLE_PADDING,
    left: TOGGLE_PADDING,
    borderRadius: borderRadius.md,
    backgroundColor: colors.primary,
  },
  toggleOption: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: spacing.xs,
    paddingVertical: spacing.sm,
  },
  toggleText: { fontSize: typography.bodySmall.fontSize, lineHeight: typography.bodySmall.lineHeight, fontWeight: "700", color: colors.textSecondary },
  toggleTextOn: { color: colors.surface },
  paymentTitle: {
    ...typography.sectionTitle,
    marginBottom: spacing.lg,
    marginLeft: spacing.xl,
    marginTop: spacing.lg,
  },
  scheduleHint: { flexDirection: "row", alignItems: "center", gap: spacing.sm, marginHorizontal: spacing.lg, marginBottom: spacing.xs, paddingHorizontal: spacing.sm, paddingVertical: spacing.sm, borderRadius: borderRadius.md, backgroundColor: colors.primaryLight },
  scheduleHintText: { flex: 1, fontSize: typography.caption.fontSize, lineHeight: 16, color: colors.primaryDark, fontWeight: "600" },
  paymentOptionContainer: {
    marginHorizontal: spacing.xl,
    marginBottom: spacing.sm,
  },
  paymentOptionDisabled: {
    opacity: 0.5,
  },
  paymentOption: {
    backgroundColor: colors.surface,
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.lg,
    borderRadius: borderRadius.xxl,
    borderWidth: 1,
    borderColor: colors.borderLight,
    ...shadows.sm
  },
  paymentImageConfig: {
    width: scale(40),
    height: scale(25),
  },
  paymentOptionText: {
    color: colors.textPrimary,
    fontSize: typography.body.fontSize, lineHeight: typography.body.lineHeight,
    fontWeight: "600",
    marginLeft: spacing.lg,
  },
});

export default PaymentOptions;
