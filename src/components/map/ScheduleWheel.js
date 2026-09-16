import React, { useEffect, useMemo, useRef } from "react";
import { View, Text, ScrollView, StyleSheet } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { scale } from "react-native-size-matters";
import { colors, borderRadius } from "../../theme";
import { MINUTE_STEP, earliestSlot, isBookable, scheduleDays } from "../../utils/scheduling";

const ROW = scale(34);
const VISIBLE = 3;
const HOURS = Array.from({ length: 24 }, (_, h) => String(h).padStart(2, "0"));
const MINUTES = Array.from({ length: 60 / MINUTE_STEP }, (_, i) => String(i * MINUTE_STEP).padStart(2, "0"));

// One snapping column. Controlled: scrolls to `index` whenever it changes.
const Column = ({ items, index, onSelect, flex }) => {
  const ref = useRef(null);

  useEffect(() => {
    ref.current?.scrollTo({ y: index * ROW, animated: true });
  }, [index]);

  const settle = (event) => {
    const next = Math.max(0, Math.min(items.length - 1, Math.round(event.nativeEvent.contentOffset.y / ROW)));
    if (next !== index) onSelect(next);
  };

  return (
    <View style={{ flex, height: ROW * VISIBLE }}>
      <ScrollView
        ref={ref}
        showsVerticalScrollIndicator={false}
        snapToInterval={ROW}
        decelerationRate="fast"
        contentOffset={{ x: 0, y: index * ROW }}
        contentContainerStyle={{ paddingVertical: ROW }}
        onMomentumScrollEnd={settle}
        onScrollEndDrag={(e) => { if (!e.nativeEvent.velocity?.y) settle(e); }}
        nestedScrollEnabled
      >
        {items.map((label, i) => (
          <View key={label} style={styles.row}>
            <Text style={[styles.item, i === index && styles.itemSelected]}>{label}</Text>
          </View>
        ))}
      </ScrollView>
    </View>
  );
};

// Day · hour · minute wheel for booking a tow for later. `value` is a Date.
const ScheduleWheel = ({ value, onChange }) => {
  const days = useMemo(() => scheduleDays(), []);

  const dayIndex = Math.max(0, days.findIndex((d) =>
    d.date.getFullYear() === value.getFullYear() && d.date.getMonth() === value.getMonth() && d.date.getDate() === value.getDate()));
  const hourIndex = value.getHours();
  const minuteIndex = Math.floor(value.getMinutes() / MINUTE_STEP);

  // Any combination the wheel can form that is too soon snaps to the earliest slot.
  const select = (dayI, hourI, minuteI) => {
    const d = days[dayI].date;
    const next = new Date(d.getFullYear(), d.getMonth(), d.getDate(), hourI, minuteI * MINUTE_STEP);
    onChange(isBookable(next) ? next : earliestSlot());
  };

  return (
    <View style={styles.wheel}>
      <View style={styles.band} pointerEvents="none" />
      <Column flex={1.7} items={days.map((d) => d.label)} index={dayIndex} onSelect={(i) => select(i, hourIndex, minuteIndex)} />
      <Column flex={1} items={HOURS} index={hourIndex} onSelect={(i) => select(dayIndex, i, minuteIndex)} />
      <Text style={styles.colon}>:</Text>
      <Column flex={1} items={MINUTES} index={minuteIndex} onSelect={(i) => select(dayIndex, hourIndex, i)} />
      <LinearGradient pointerEvents="none" colors={["#FFFFFF", "rgba(255,255,255,0)"]} style={[styles.fade, { top: 0 }]} />
      <LinearGradient pointerEvents="none" colors={["rgba(255,255,255,0)", "#FFFFFF"]} style={[styles.fade, { bottom: 0 }]} />
    </View>
  );
};

const styles = StyleSheet.create({
  wheel: {
    flexDirection: "row",
    alignItems: "center",
    height: ROW * VISIBLE,
    marginHorizontal: scale(10),
    marginBottom: scale(10),
  },
  band: {
    position: "absolute",
    left: 0,
    right: 0,
    top: ROW,
    height: ROW,
    borderRadius: borderRadius.md,
    backgroundColor: colors.primaryLight,
  },
  row: { height: ROW, alignItems: "center", justifyContent: "center" },
  item: { fontSize: scale(14), color: colors.textSecondary, fontVariant: ["tabular-nums"] },
  itemSelected: { fontSize: scale(17), fontWeight: "700", color: colors.primary },
  colon: { width: scale(10), textAlign: "center", fontSize: scale(17), fontWeight: "700", color: colors.primary },
  fade: { position: "absolute", left: 0, right: 0, height: ROW * 0.8 },
});

export default ScheduleWheel;
