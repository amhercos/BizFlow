import { typeface, useInter } from "@/src/theme/typography";
import { type CustomerCredit } from "@/src/types/credit";
import { formatPHP } from "@/src/lib/math";
import { Search } from "lucide-react-native";
import React, { useMemo, useState } from "react";
import { Pressable, StyleSheet, Text, TextInput, View } from "react-native";

const INK = "#0F172A";
const MUTED = "#64748B";
const TINT = "#2563EB";
const LINE = "rgba(15, 23, 42, 0.08)";

interface CreditPaymentProps {
  credits: CustomerCredit[];
  selectedCreditId: string;
  setSelectedCreditId: (id: string) => void;
  isNewCustomer: boolean;
  setIsNewCustomer: (b: boolean) => void;
  newCustomerName: string;
  setNewCustomerName: (s: string) => void;
  newCustomerContact: string;
  setNewCustomerContact: (s: string) => void;
}

export const CreditPayment = ({
  credits,
  selectedCreditId,
  setSelectedCreditId,
  isNewCustomer,
  setIsNewCustomer,
  newCustomerName,
  setNewCustomerName,
  newCustomerContact,
  setNewCustomerContact,
}: CreditPaymentProps) => {
  const font = useInter();
  const [searchQuery, setSearchQuery] = useState("");

  const filteredCredits = useMemo(() => {
    if (!searchQuery.trim()) return credits;
    return credits.filter(
      (c) =>
        c.customerName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        c.contactInfo?.toLowerCase().includes(searchQuery.toLowerCase()),
    );
  }, [credits, searchQuery]);

  return (
    <View>
      <View style={styles.toggleRow}>
        <Pressable
          onPress={() => setIsNewCustomer(false)}
          style={[styles.toggle, !isNewCustomer && styles.toggleOn]}
        >
          <Text
            style={[
              styles.toggleText,
              !isNewCustomer && styles.toggleTextOn,
              typeface(font.medium, "500"),
            ]}
          >
            Existing
          </Text>
        </Pressable>
        <Pressable
          onPress={() => setIsNewCustomer(true)}
          style={[styles.toggle, isNewCustomer && styles.toggleOn]}
        >
          <Text
            style={[
              styles.toggleText,
              isNewCustomer && styles.toggleTextOn,
              typeface(font.medium, "500"),
            ]}
          >
            New customer
          </Text>
        </Pressable>
      </View>

      {isNewCustomer ? (
        <View style={styles.form}>
          <TextInput
            placeholder="Customer name"
            placeholderTextColor="#94A3B8"
            value={newCustomerName}
            onChangeText={setNewCustomerName}
            style={[styles.input, typeface(font.medium, "500")]}
          />
          <TextInput
            placeholder="Contact number"
            placeholderTextColor="#94A3B8"
            value={newCustomerContact}
            onChangeText={setNewCustomerContact}
            keyboardType="phone-pad"
            style={[styles.input, typeface(font.medium, "500")]}
          />
        </View>
      ) : (
        <View>
          <View style={styles.search}>
            <Search size={16} color="#94A3B8" />
            <TextInput
              placeholder="Search customers"
              placeholderTextColor="#94A3B8"
              value={searchQuery}
              onChangeText={setSearchQuery}
              style={[styles.searchInput, typeface(font.medium, "500")]}
            />
          </View>
          {credits.length === 0 ? (
            <Text style={[styles.empty, typeface(font.regular, "400")]}>
              No customer credits yet
            </Text>
          ) : filteredCredits.length === 0 ? (
            <Text style={[styles.empty, typeface(font.regular, "400")]}>
              No matching customers
            </Text>
          ) : (
            filteredCredits.map((c, index) => {
              const active = selectedCreditId === c.id;
              return (
                <View key={c.id}>
                  {index > 0 ? <View style={styles.hairline} /> : null}
                  <Pressable
                    onPress={() =>
                      setSelectedCreditId(active ? "" : c.id)
                    }
                    style={styles.row}
                  >
                    <View style={styles.rowBody}>
                      <Text
                        style={[
                          styles.name,
                          active && styles.nameOn,
                          typeface(font.semibold, "600"),
                        ]}
                      >
                        {c.customerName}
                      </Text>
                      <Text style={[styles.meta, typeface(font.medium, "500")]}>
                        {c.contactInfo ? `${c.contactInfo} · ` : ""}
                        {formatPHP(c.creditAmount)} due
                      </Text>
                    </View>
                    {active ? <View style={styles.pickedDot} /> : null}
                  </Pressable>
                </View>
              );
            })
          )}
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  toggleRow: {
    flexDirection: "row",
    backgroundColor: "#EEF1F6",
    borderRadius: 999,
    padding: 3,
    marginBottom: 14,
    alignSelf: "flex-start",
  },
  toggle: {
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 999,
  },
  toggleOn: {
    backgroundColor: "#FFFFFF",
  },
  toggleText: {
    fontSize: 13,
    color: MUTED,
  },
  toggleTextOn: {
    color: INK,
  },
  form: {
    gap: 10,
  },
  input: {
    backgroundColor: "#EEF1F6",
    borderRadius: 14,
    paddingHorizontal: 14,
    height: 46,
    fontSize: 15,
    color: INK,
  },
  search: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#EEF1F6",
    borderRadius: 14,
    paddingHorizontal: 14,
    height: 46,
    marginBottom: 8,
    gap: 8,
  },
  searchInput: {
    flex: 1,
    fontSize: 15,
    color: INK,
    paddingVertical: 0,
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 12,
  },
  rowBody: {
    flex: 1,
  },
  name: {
    fontSize: 15,
    color: INK,
  },
  nameOn: {
    color: TINT,
  },
  meta: {
    marginTop: 2,
    fontSize: 12,
    color: MUTED,
  },
  pickedDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: TINT,
  },
  hairline: {
    height: StyleSheet.hairlineWidth,
    backgroundColor: LINE,
  },
  empty: {
    paddingVertical: 16,
    fontSize: 14,
    color: MUTED,
  },
});
