import React, { memo, useState } from "react";
import { LayoutChangeEvent, Pressable, StyleSheet, Text, View } from "react-native";
import Svg, { Line } from "react-native-svg";

interface WeekBarChartProps {
  values: number[];
  labels: string[];
  selected: number;
  onSelect: (index: number) => void;
  formatValue?: (value: number) => string;
  fontFamily?: string;
}

export const WeekBarChart = memo(function WeekBarChart({
  values,
  labels,
  selected,
  onSelect,
  formatValue,
  fontFamily,
}: WeekBarChartProps) {
  const max = Math.max(...values, 1);
  const [width, setWidth] = useState(0);
  const plotH = 152;
  const gridTop = 28;

  return (
    <View style={styles.wrap}>
      <View
        style={styles.plot}
        onLayout={(event: LayoutChangeEvent) =>
          setWidth(event.nativeEvent.layout.width)
        }
      >
        {width > 0 ? (
          <Svg
            width={width}
            height={plotH}
            style={StyleSheet.absoluteFill}
            pointerEvents="none"
          >
            {[0, 0.5, 1].map((t) => {
              const y = gridTop + (plotH - gridTop - 4) * t;
              return (
                <Line
                  key={t}
                  x1={0}
                  x2={width}
                  y1={y}
                  y2={y}
                  stroke="#E6EAF0"
                  strokeWidth={1}
                  strokeDasharray="4 6"
                />
              );
            })}
          </Svg>
        ) : null}

        <View style={styles.bars}>
          {values.map((value, index) => {
            const height = value <= 0 ? 6 : Math.max(12, (value / max) * 108);
            const active = selected === index;
            return (
              <Pressable
                key={`${labels[index]}-${index}`}
                onPress={() => onSelect(index)}
                hitSlop={8}
                style={styles.col}
              >
                <View style={styles.tooltipSlot}>
                  {active ? (
                    <Text
                      style={[
                        styles.tooltip,
                        fontFamily ? { fontFamily } : null,
                      ]}
                      numberOfLines={1}
                    >
                      {formatValue ? formatValue(value) : String(value)}
                    </Text>
                  ) : (
                    <View style={{ height: 16 }} />
                  )}
                </View>
                <View
                  style={[
                    styles.bar,
                    {
                      height,
                      backgroundColor: active ? "#2563EB" : "#E8EDF4",
                    },
                  ]}
                />
              </Pressable>
            );
          })}
        </View>
      </View>

      <View style={styles.labels}>
        {labels.map((label, index) => (
          <Text
            key={`${label}-${index}`}
            style={[
              styles.label,
              selected === index && styles.labelOn,
              fontFamily ? { fontFamily } : null,
            ]}
          >
            {label}
          </Text>
        ))}
      </View>
    </View>
  );
});

const styles = StyleSheet.create({
  wrap: {
    marginTop: 4,
  },
  plot: {
    height: 152,
  },
  bars: {
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
  tooltipSlot: {
    height: 20,
    marginBottom: 8,
    justifyContent: "flex-end",
  },
  tooltip: {
    fontSize: 11,
    fontWeight: "600",
    color: "#0F172A",
    fontVariant: ["tabular-nums"],
  },
  bar: {
    width: 18,
    borderRadius: 10,
  },
  labels: {
    flexDirection: "row",
    marginTop: 10,
  },
  label: {
    flex: 1,
    textAlign: "center",
    fontSize: 12,
    fontWeight: "500",
    color: "#94A3B8",
  },
  labelOn: {
    color: "#0F172A",
    fontWeight: "600",
  },
});
