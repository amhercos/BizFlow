import { cn } from "@/src/lib/utils";
import { type CustomerCredit } from "@/src/types/credit";
import { Check, Plus, Search } from "lucide-react-native";
import React, { useMemo, useState } from "react";
import { Text, TextInput, TouchableOpacity, View } from "react-native";

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
  // 1. Add local state for the search bar
  const [searchQuery, setSearchQuery] = useState("");

  // 2. Compute filtered credits based on the search query
  const filteredCredits = useMemo(() => {
    if (!searchQuery.trim()) return credits;
    return credits.filter(
      (c) =>
        c.customerName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        c.contactInfo?.toLowerCase().includes(searchQuery.toLowerCase()),
    );
  }, [credits, searchQuery]);

  return (
    <View className="gap-2">
      {/* Emphasized New Customer Button/Checkbox */}
      <TouchableOpacity
        onPress={() => setIsNewCustomer(!isNewCustomer)}
        className={cn(
          "flex-row items-center p-4 mb-2 rounded-2xl border-2 transition-all",
          isNewCustomer
            ? "bg-slate-900 border-slate-900"
            : "bg-emerald-50 border-emerald-200 border-dashed",
        )}
      >
        <View
          className={cn(
            "w-6 h-6 rounded-lg items-center justify-center mr-3",
            isNewCustomer ? "bg-white/20" : "bg-emerald-200",
          )}
        >
          {isNewCustomer ? (
            <Check size={14} color="white" />
          ) : (
            <Plus size={14} color="#059669" />
          )}
        </View>
        <Text
          className={cn(
            "text-sm font-black uppercase tracking-wider",
            isNewCustomer ? "text-white" : "text-emerald-700",
          )}
        >
          {isNewCustomer ? "New Customer Details" : "Add New Customer Credit"}
        </Text>
      </TouchableOpacity>

      {isNewCustomer ? (
        // New Customer Form
        <View className="gap-3 mt-2">
          <TextInput
            placeholder="Enter Customer Name"
            value={newCustomerName}
            onChangeText={setNewCustomerName}
            className="h-14 bg-slate-50 rounded-2xl px-4 font-bold border border-slate-100"
            placeholderTextColor="#94a3b8"
          />
          <TextInput
            placeholder="Enter Contact Number"
            value={newCustomerContact}
            onChangeText={setNewCustomerContact}
            keyboardType="phone-pad"
            className="h-14 bg-slate-50 rounded-2xl px-4 font-bold border border-slate-100"
            placeholderTextColor="#94a3b8"
          />
        </View>
      ) : (
        // Existing Customers List with Search
        <View className="gap-2 mt-2">
          {/* Search Bar */}
          <View className="flex-row items-center bg-slate-50 border border-slate-200 rounded-xl px-4 h-12 mb-2">
            <Search size={18} color="#94a3b8" />
            <TextInput
              placeholder="Search customers..."
              value={searchQuery}
              onChangeText={setSearchQuery}
              className="flex-1 ml-3 font-semibold text-slate-700 h-full"
              placeholderTextColor="#94a3b8"
            />
          </View>

          {/* Filtered List */}
          {filteredCredits.map((c) => (
            <TouchableOpacity
              key={c.id}
              // FIX: If the clicked ID is already selected, pass an empty string to unselect it
              onPress={() =>
                setSelectedCreditId(selectedCreditId === c.id ? "" : c.id)
              }
              className={cn(
                "h-14 rounded-2xl px-4 flex-row items-center border",
                selectedCreditId === c.id
                  ? "bg-slate-900 border-slate-900"
                  : "bg-white border-slate-100",
              )}
            >
              <View className="flex-1">
                <Text
                  className={cn(
                    "font-bold",
                    selectedCreditId === c.id ? "text-white" : "text-slate-700",
                  )}
                >
                  {c.customerName}
                </Text>
                {c.contactInfo && (
                  <Text
                    className={cn(
                      "text-[10px]",
                      selectedCreditId === c.id
                        ? "text-slate-300"
                        : "text-slate-400",
                    )}
                  >
                    {c.contactInfo}
                  </Text>
                )}
              </View>
              {selectedCreditId === c.id && <Check size={16} color="white" />}
            </TouchableOpacity>
          ))}

          {/* Empty States */}
          {credits.length === 0 ? (
            <Text className="text-center text-slate-400 text-xs italic py-4">
              No existing credits found.
            </Text>
          ) : filteredCredits.length === 0 ? (
            <Text className="text-center text-slate-400 text-xs italic py-4">
              No matching customers found for "{searchQuery}".
            </Text>
          ) : null}
        </View>
      )}
    </View>
  );
};
