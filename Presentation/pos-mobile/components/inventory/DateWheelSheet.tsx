import { typeface, useInter } from "@/src/theme/typography";
import React, { useEffect, useMemo, useState } from "react";
import { Modal, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import ScrollPicker from "react-native-wheel-scrollview-picker";

const INK = "#0F172A";
const MUTED = "#64748B";
const TINT = "#2563EB";
const MONTHS = [
  "Jan",
  "Feb",
  "Mar",
  "Apr",
  "May",
  "Jun",
  "Jul",
  "Aug",
  "Sep",
  "Oct",
  "Nov",
  "Dec",
];

interface DateWheelSheetProps {
  visible: boolean;
  value: Date;
  onCancel: () => void;
  onConfirm: (date: Date) => void;
}

export function DateWheelSheet({
  visible,
  value,
  onCancel,
  onConfirm,
}: DateWheelSheetProps) {
  const font = useInter();
  const [tempDate, setTempDate] = useState(value);

  useEffect(() => {
    if (visible) setTempDate(value);
  }, [visible, value]);

  const year = tempDate.getFullYear();
  const month = tempDate.getMonth();
  const years = useMemo(
    () => Array.from({ length: 15 }, (_, i) => (2024 + i).toString()),
    [],
  );
  const days = useMemo(() => {
    const lastDay = new Date(year, month + 1, 0).getDate();
    return Array.from({ length: lastDay }, (_, i) => (i + 1).toString());
  }, [year, month]);

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onCancel}>
      <View style={styles.backdrop}>
        <View style={styles.sheet}>
          <View style={styles.header}>
            <TouchableOpacity onPress={onCancel}>
              <Text style={[styles.ghost, typeface(font.medium, "500")]}>Cancel</Text>
            </TouchableOpacity>
            <Text style={[styles.title, typeface(font.semibold, "600")]}>Expiry date</Text>
            <TouchableOpacity onPress={() => onConfirm(tempDate)}>
              <Text style={[styles.confirm, typeface(font.semibold, "600")]}>Done</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.wheels}>
            <View pointerEvents="none" style={styles.highlight} />
            <View style={styles.col}>
              <ScrollPicker
                dataSource={MONTHS}
                selectedIndex={month}
                onValueChange={(_, i) => {
                  const next = new Date(tempDate);
                  next.setMonth(i);
                  setTempDate(next);
                }}
                wrapperHeight={220}
                itemHeight={44}
                highlightColor="transparent"
                renderItem={(item, index) => (
                  <Text
                    style={[
                      styles.wheelItem,
                      typeface(font.semibold, "600"),
                      index === month ? styles.wheelOn : styles.wheelOff,
                    ]}
                  >
                    {item}
                  </Text>
                )}
              />
            </View>
            <View style={styles.col}>
              <ScrollPicker
                dataSource={days}
                selectedIndex={Math.min(tempDate.getDate() - 1, days.length - 1)}
                onValueChange={(v) => {
                  const next = new Date(tempDate);
                  next.setDate(parseInt(v || "1", 10));
                  setTempDate(next);
                }}
                wrapperHeight={220}
                itemHeight={44}
                highlightColor="transparent"
                renderItem={(item, index) => (
                  <Text
                    style={[
                      styles.wheelItem,
                      typeface(font.semibold, "600"),
                      index === tempDate.getDate() - 1
                        ? styles.wheelOn
                        : styles.wheelOff,
                    ]}
                  >
                    {item}
                  </Text>
                )}
              />
            </View>
            <View style={styles.col}>
              <ScrollPicker
                dataSource={years}
                selectedIndex={Math.max(0, years.indexOf(year.toString()))}
                onValueChange={(v) => {
                  const next = new Date(tempDate);
                  next.setFullYear(parseInt(v || "2024", 10));
                  setTempDate(next);
                }}
                wrapperHeight={220}
                itemHeight={44}
                highlightColor="transparent"
                renderItem={(item, index) => (
                  <Text
                    style={[
                      styles.wheelItem,
                      typeface(font.semibold, "600"),
                      index === years.indexOf(year.toString())
                        ? styles.wheelOn
                        : styles.wheelOff,
                    ]}
                  >
                    {item}
                  </Text>
                )}
              />
            </View>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    justifyContent: "flex-end",
    backgroundColor: "rgba(15, 23, 42, 0.4)",
  },
  sheet: {
    backgroundColor: "#FAFBFD",
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingBottom: 28,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 22,
    paddingVertical: 16,
  },
  title: {
    fontSize: 15,
    color: INK,
  },
  ghost: {
    fontSize: 14,
    color: MUTED,
  },
  confirm: {
    fontSize: 14,
    color: TINT,
  },
  wheels: {
    height: 220,
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 12,
  },
  highlight: {
    position: "absolute",
    left: 16,
    right: 16,
    height: 44,
    borderRadius: 12,
    backgroundColor: "#EEF1F6",
    top: 88,
  },
  col: {
    flex: 1,
  },
  wheelItem: {
    fontSize: 16,
    textAlign: "center",
  },
  wheelOn: {
    color: INK,
  },
  wheelOff: {
    color: "#CBD5E1",
  },
});
