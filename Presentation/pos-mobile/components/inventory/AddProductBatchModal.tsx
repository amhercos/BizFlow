import { DateWheelSheet } from "@/components/inventory/DateWheelSheet";
import { apiClient as api } from "@/src/api/client";
import { useInter } from "@/src/theme/typography";
import { Ionicons } from "@expo/vector-icons";
import React, { useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Modal,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";

interface AddProductBatchModalProps {
  visible: boolean;
  productId: string;
  productName: string;
  onClose: () => void;
  onSuccess: () => void;
}

export default function AddProductBatchModal({
  visible,
  productId,
  productName,
  onClose,
  onSuccess,
}: AddProductBatchModalProps) {
  const font = useInter();
  const [quantity, setQuantity] = useState("");
  const [expiryDate, setExpiryDate] = useState<Date>(new Date());
  const [isDatePickerOpen, setIsDatePickerOpen] = useState(false);
  const [loading, setLoading] = useState(false);

  const formatDateString = (date: Date) => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const day = String(date.getDate()).padStart(2, "0");
    return `${year}-${month}-${day}`;
  };

  const handleSave = async () => {
    if (!quantity) {
      Alert.alert("Error", "Please enter a batch quantity.");
      return;
    }

    const parsedQty = parseInt(quantity, 10);
    if (isNaN(parsedQty) || parsedQty <= 0) {
      Alert.alert("Error", "Please enter a valid positive quantity.");
      return;
    }

    const formattedExpiry = formatDateString(expiryDate);

    try {
      setLoading(true);
      await api.post("/product/batches", {
        productId,
        quantity: parsedQty,
        expiryDate: formattedExpiry,
      });

      Alert.alert(
        "Success",
        "Product batch created and stock updated successfully.",
      );
      setQuantity("");
      setExpiryDate(new Date());
      onSuccess();
      onClose();
    } catch (error: any) {
      console.error("Failed to create batch:", error);
      Alert.alert(
        "Error",
        error?.response?.data?.message || "Failed to create product batch.",
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal visible={visible} animationType="slide" transparent={true}>
      <View className="flex-1 justify-center items-center bg-black/50 px-4">
        <View className="bg-white w-full max-w-md rounded-2xl p-6 shadow-xl">
          <View className="flex-row justify-between items-center mb-4">
            <Text className="text-xl font-bold text-gray-900">
              Restock Batch
            </Text>
            <TouchableOpacity onPress={onClose}>
              <Ionicons name="close" size={24} color="#6b7280" />
            </TouchableOpacity>
          </View>

          <Text className="text-sm text-gray-600 mb-4">
            Adding batch stock for:{" "}
            <Text className="font-semibold text-gray-900">{productName}</Text>
          </Text>

          <View className="mb-4">
            <Text className="text-xs font-semibold text-gray-700 uppercase mb-1">
              Batch Quantity
            </Text>
            <TextInput
              className="bg-gray-50 border border-gray-300 rounded-xl px-4 py-3 text-base text-gray-900"
              placeholder="e.g. 50"
              keyboardType="numeric"
              value={quantity}
              onChangeText={setQuantity}
              placeholderTextColor="#9ca3af"
            />
          </View>

          <View className="mb-6">
            <Text className="text-xs font-semibold text-gray-700 uppercase mb-1">
              Expiry Date
            </Text>
            <TouchableOpacity
              className="bg-gray-50 border border-gray-300 rounded-xl px-4 py-3 flex-row justify-between items-center"
              onPress={() => setIsDatePickerOpen(true)}
            >
              <Text className="text-base text-gray-900">
                {formatDateString(expiryDate)}
              </Text>
              <Ionicons name="calendar-outline" size={20} color="#6b7280" />
            </TouchableOpacity>
          </View>

          <View className="flex-row space-x-3">
            <TouchableOpacity
              className="flex-1 bg-gray-100 py-3 rounded-xl items-center"
              onPress={onClose}
              disabled={loading}
            >
              <Text className="text-gray-700 font-semibold text-base">
                Cancel
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              className="flex-1 bg-indigo-600 py-3 rounded-xl items-center flex-row justify-center"
              onPress={handleSave}
              disabled={loading}
            >
              {loading ? (
                <ActivityIndicator color="#ffffff" />
              ) : (
                <Text className="text-white font-semibold text-base">
                  Save Batch
                </Text>
              )}
            </TouchableOpacity>
          </View>
        </View>
      </View>

      <DateWheelSheet
        visible={isDatePickerOpen}
        value={expiryDate}
        onCancel={() => setIsDatePickerOpen(false)}
        onConfirm={(date) => {
          setExpiryDate(date);
          setIsDatePickerOpen(false);
        }}
      />
    </Modal>
  );
}
