import { typeface, type AppFonts } from "@/src/theme/typography";
import type { TenderMix } from "@/src/lib/report-analytics";
import React, { memo } from "react";
import { StyleSheet, Text, View } from "react-native";

const INK = "#0F172A";
const MUTED = "#64748B";
const TINT = "#2563EB";

function formatPHP(amount: number) {
  return `₱${amount.toLocaleString("en-PH", {
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  })}`;
}

function mixLine(mix: TenderMix, empty: boolean) {
  if (empty) return "Waiting on the first sale of the week";
  if (mix.cashPct >= 70) return "Cash is carrying the week";
  if (mix.creditPct >= 70) return "Credit is doing most of the work";
  if (Math.abs(mix.cashPct - 50) <= 8) return "Cash and credit are neck and neck";
  return mix.cashPct > mix.creditPct
    ? "Cash still has the edge"
    : "Credit has the edge";
}

export const TenderMixBar = memo(function TenderMixBar({
  mix,
  font = {},
  insight = false,
}: {
  mix: TenderMix;
  font?: AppFonts;
  insight?: boolean;
}) {
  const empty = mix.cash + mix.credit <= 0;
  const rows = [
    {
      label: "Cash",
      amount: mix.cash,
      pct: mix.cashPct,
      fill: "#D8F3E7",
      accent: "#0F9F8A",
    },
    {
      label: "Credit",
      amount: mix.credit,
      pct: mix.creditPct,
      fill: "#DCEBFF",
      accent: TINT,
    },
  ] as const;

  return (
    <View style={styles.wrap}>
      {insight ? (
        <Text style={[styles.insight, typeface(font.medium, "500")]}>
          {mixLine(mix, empty)}
        </Text>
      ) : null}

      {rows.map((row) => (
        <View key={row.label} style={styles.gauge}>
          <View
            style={[
              styles.gaugeFill,
              {
                width: empty ? "0%" : `${Math.max(row.pct, 8)}%`,
                backgroundColor: row.fill,
              },
            ]}
          />
          <View style={styles.gaugeText}>
            <Text style={[styles.label, typeface(font.medium, "500")]}>
              {row.label}
            </Text>
            <Text
              style={[
                styles.amount,
                { color: empty ? MUTED : row.accent },
                typeface(font.semibold, "600"),
              ]}
            >
              {empty ? "—" : `${formatPHP(row.amount)} · ${row.pct}%`}
            </Text>
          </View>
        </View>
      ))}
    </View>
  );
});

const styles = StyleSheet.create({
  wrap: {
    marginTop: 18,
    gap: 8,
  },
  insight: {
    fontSize: 13,
    color: MUTED,
    marginBottom: 2,
  },
  gauge: {
    height: 42,
    borderRadius: 12,
    backgroundColor: "#F4F6FA",
    overflow: "hidden",
    justifyContent: "center",
  },
  gaugeFill: {
    position: "absolute",
    left: 0,
    top: 0,
    bottom: 0,
    borderRadius: 12,
  },
  gaugeText: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 14,
  },
  label: {
    fontSize: 13,
    color: INK,
  },
  amount: {
    fontSize: 13,
    fontVariant: ["tabular-nums"],
  },
});
