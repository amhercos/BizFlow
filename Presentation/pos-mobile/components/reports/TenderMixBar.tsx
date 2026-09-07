import { typeface, type AppFonts } from "@/src/theme/typography";
import type { TenderMix } from "@/src/lib/report-analytics";
import React, { memo } from "react";
import { StyleSheet, Text, View } from "react-native";

const INK = "#0F172A";
const MUTED = "#64748B";
const TEAL = "#0F9F8A";
const TINT = "#2563EB";

function formatPHP(amount: number) {
  return `₱${amount.toLocaleString("en-PH", {
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  })}`;
}

export const TenderMixBar = memo(function TenderMixBar({
  mix,
  font = {},
}: {
  mix: TenderMix;
  font?: AppFonts;
}) {
  const empty = mix.cash + mix.credit <= 0;

  return (
    <View style={styles.wrap}>
      <View style={styles.legend}>
        <Text style={[styles.side, typeface(font.medium, "500")]}>
          Cash {empty ? "—" : `${mix.cashPct}%`}
        </Text>
        <Text style={[styles.side, typeface(font.medium, "500")]}>
          Credit {empty ? "—" : `${mix.creditPct}%`}
        </Text>
      </View>
      <View style={styles.track}>
        {empty ? (
          <View style={[styles.fill, { flex: 1, backgroundColor: "#E8EDF4" }]} />
        ) : (
          <>
            <View
              style={[
                styles.fill,
                { flex: Math.max(mix.cashPct, 1), backgroundColor: TEAL },
              ]}
            />
            <View
              style={[
                styles.fill,
                { flex: Math.max(mix.creditPct, 1), backgroundColor: TINT },
              ]}
            />
          </>
        )}
      </View>
      <View style={styles.legend}>
        <Text style={[styles.amount, typeface(font.semibold, "600")]}>
          {empty ? "₱0" : formatPHP(mix.cash)}
        </Text>
        <Text style={[styles.amount, typeface(font.semibold, "600")]}>
          {empty ? "₱0" : formatPHP(mix.credit)}
        </Text>
      </View>
    </View>
  );
});

const styles = StyleSheet.create({
  wrap: {
    marginTop: 22,
  },
  legend: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
  side: {
    fontSize: 13,
    color: MUTED,
  },
  track: {
    flexDirection: "row",
    height: 6,
    borderRadius: 99,
    overflow: "hidden",
    backgroundColor: "#E8EDF4",
    marginTop: 8,
    marginBottom: 8,
  },
  fill: {
    height: "100%",
  },
  amount: {
    fontSize: 13,
    color: INK,
    fontVariant: ["tabular-nums"],
  },
});
