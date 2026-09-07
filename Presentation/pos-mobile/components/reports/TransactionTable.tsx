import { typeface, type AppFonts } from "@/src/theme/typography";
import type { RecentTransaction } from "@/src/types/record";
import * as Clipboard from "expo-clipboard";
import { Skeleton } from "moti/skeleton";
import React, { memo, useCallback } from "react";
import { Alert, Pressable, StyleSheet, Text, View } from "react-native";

const INK = "#0F172A";
const MUTED = "#64748B";
const LINE = "rgba(15, 23, 42, 0.08)";

interface TransactionTableProps {
  data: RecentTransaction[];
  loading: boolean;
  onViewDetails: (id: string) => void;
  font?: AppFonts;
}

function formatPHP(val: number) {
  return `₱${val.toLocaleString("en-PH", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
}

export const TransactionTable = memo(function TransactionTable({
  data,
  loading,
  onViewDetails,
  font = {},
}: TransactionTableProps) {
  const copyToClipboard = useCallback(async (id: string) => {
    await Clipboard.setStringAsync(id);
    Alert.alert("Copied", "Reference ID copied to clipboard");
  }, []);

  if (loading) {
    return (
      <View>
        {[1, 2, 3, 4, 5].map((i) => (
          <View key={i} style={styles.row}>
            <Skeleton colorMode="light" width="70%" height={16} radius={6} />
          </View>
        ))}
      </View>
    );
  }

  if (data.length === 0) {
    return (
      <Text style={[styles.empty, typeface(font.regular, "400")]}>
        No transactions in this period
      </Text>
    );
  }

  return (
    <View>
      {data.map((tx, index) => {
        const date = new Date(tx.transactionDate);
        return (
          <View key={tx.id}>
            {index > 0 ? <View style={styles.hairline} /> : null}
            <Pressable
              onPress={() => onViewDetails(tx.id)}
              onLongPress={() => copyToClipboard(tx.id)}
              style={styles.row}
            >
              <View style={styles.body}>
                <Text
                  style={[styles.title, typeface(font.semibold, "600")]}
                  numberOfLines={1}
                >
                  {date.toLocaleDateString("en-PH", {
                    weekday: "short",
                    month: "short",
                    day: "numeric",
                  })}
                  {" · "}
                  {date.toLocaleTimeString([], {
                    hour: "numeric",
                    minute: "2-digit",
                  })}
                </Text>
                <Text style={[styles.meta, typeface(font.medium, "500")]}>
                  {tx.paymentType} · #{tx.id.slice(-6).toUpperCase()}
                </Text>
              </View>
              <Text style={[styles.amount, typeface(font.semibold, "600")]}>
                {formatPHP(tx.totalAmount)}
              </Text>
            </Pressable>
          </View>
        );
      })}
    </View>
  );
});

const styles = StyleSheet.create({
  row: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 14,
  },
  body: {
    flex: 1,
    marginRight: 12,
  },
  title: {
    fontSize: 15,
    color: INK,
  },
  meta: {
    marginTop: 2,
    fontSize: 13,
    color: MUTED,
  },
  amount: {
    fontSize: 15,
    color: INK,
    fontVariant: ["tabular-nums"],
  },
  hairline: {
    height: StyleSheet.hairlineWidth,
    backgroundColor: LINE,
  },
  empty: {
    paddingVertical: 20,
    fontSize: 14,
    color: MUTED,
  },
});
