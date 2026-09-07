import { LinearGradient } from "expo-linear-gradient";
import React, { memo } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";

interface WeekBarChartProps {
  values: number[];
  labels: string[];
  selected: number;
  onSelect: (index: number) => void;
  formatValue?: (value: number) => string;
  fontFamily?: string;
  variant?: "plain" | "hero";
  todayIndex?: number;
}

export const WeekBarChart = memo(function WeekBarChart({
  values,
  labels,
  selected,
  onSelect,
  formatValue,
  fontFamily,
  variant = "plain",
  todayIndex,
}: WeekBarChartProps) {
  const max = Math.max(...values, 1);
  const hero = variant === "hero";
  const maxH = hero ? 128 : 108;

  return (
    <View style={styles.wrap}>
      <View style={[styles.plot, { height: maxH + 8 }]}>
        <View style={styles.shelf} />
        <View style={styles.row}>
          {values.map((value, index) => {
            const active = selected === index;
            const height = value <= 0 ? 6 : Math.max(10, (value / max) * maxH);
            return (
              <Pressable
                key={`${labels[index]}-${index}`}
                onPress={() => onSelect(index)}
                hitSlop={8}
                style={styles.col}
              >
                {active ? (
                  <LinearGradient
                    colors={["#7BA6F7", "#2563EB"]}
                    start={{ x: 0.5, y: 0 }}
                    end={{ x: 0.5, y: 1 }}
                    style={[styles.bar, { height }]}
                  />
                ) : (
                  <View style={[styles.bar, styles.barOff, { height }]} />
                )}
              </Pressable>
            );
          })}
        </View>
      </View>

      <View style={styles.labels}>
        {labels.map((label, index) => {
          const active = selected === index;
          const isToday = todayIndex === index;
          return (
            <Pressable
              key={`${label}-${index}`}
              onPress={() => onSelect(index)}
              style={styles.labelCol}
            >
              {active && formatValue ? (
                <Text
                  style={[
                    styles.value,
                    fontFamily ? { fontFamily } : null,
                  ]}
                  numberOfLines={1}
                >
                  {formatValue(values[index])}
                </Text>
              ) : (
                <View style={styles.valueSlot} />
              )}
              <Text
                style={[
                  styles.label,
                  active && styles.labelOn,
                  fontFamily ? { fontFamily } : null,
                ]}
              >
                {label}
              </Text>
              <View
                style={[
                  styles.mark,
                  isToday && styles.markToday,
                  active && styles.markOn,
                ]}
              />
            </Pressable>
          );
        })}
      </View>
    </View>
  );
});

const styles = StyleSheet.create({
  wrap: {
    marginTop: 8,
  },
  plot: {
    justifyContent: "flex-end",
  },
  shelf: {
    position: "absolute",
    left: 8,
    right: 8,
    bottom: 0,
    height: 4,
    borderRadius: 99,
    backgroundColor: "#E1ECFF",
  },
  row: {
    ...StyleSheet.absoluteFillObject,
    flexDirection: "row",
    alignItems: "flex-end",
    paddingBottom: 2,
  },
  col: {
    flex: 1,
    alignItems: "center",
    justifyContent: "flex-end",
  },
  bar: {
    width: 14,
    borderRadius: 99,
  },
  barOff: {
    backgroundColor: "#D5E4FF",
  },
  labels: {
    flexDirection: "row",
    marginTop: 10,
  },
  labelCol: {
    flex: 1,
    alignItems: "center",
  },
  value: {
    fontSize: 10,
    fontWeight: "600",
    color: "#2563EB",
    fontVariant: ["tabular-nums"],
    marginBottom: 2,
  },
  valueSlot: {
    height: 14,
    marginBottom: 2,
  },
  label: {
    fontSize: 11,
    fontWeight: "500",
    color: "#94A3B8",
  },
  labelOn: {
    color: "#2563EB",
    fontWeight: "700",
  },
  mark: {
    marginTop: 5,
    width: 4,
    height: 4,
    borderRadius: 2,
    backgroundColor: "transparent",
  },
  markOn: {
    backgroundColor: "#2563EB",
  },
  markToday: {
    backgroundColor: "#93C5FD",
  },
});
