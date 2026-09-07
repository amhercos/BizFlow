import { typeface, useInter } from "@/src/theme/typography";
import { Plus, Trash2, X } from "lucide-react-native";
import React, { useState } from "react";
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { usePromotions } from "../../src/hooks/use-promotions";
import {
  Promotion,
  PromotionType,
  UpdatePromotionRequest,
} from "../../src/types/promotion";

const INK = "#0F172A";
const MUTED = "#64748B";
const TINT = "#2563EB";
const LINE = "rgba(15, 23, 42, 0.08)";

interface EditPromotionModalProps {
  isVisible: boolean;
  promotion: Promotion;
  onClose: () => void;
}

export default function EditPromotionModal({
  isVisible,
  promotion,
  onClose,
}: EditPromotionModalProps) {
  const insets = useSafeAreaInsets();
  const font = useInter();
  const { updatePromotion, isProcessing } = usePromotions();
  const [name, setName] = useState(promotion.name);
  const [tiers, setTiers] = useState(() =>
    promotion.tiers.map((tier) => ({
      id: tier.id,
      quantity: tier.quantity,
      price: tier.price,
    })),
  );

  const isBulk =
    promotion.type === PromotionType.Bulk || promotion.type === "Bulk";
  const isBundle =
    promotion.type === PromotionType.Bundle || promotion.type === "Bundle";
  const isDiscount =
    promotion.type === PromotionType.Discount ||
    promotion.type === "Discount";

  const hint = isDiscount
    ? "One promo price"
    : isBulk
      ? "Quantity breaks"
      : "Buy with another item";

  const updateTier = (
    index: number,
    field: "quantity" | "price",
    value: string,
  ) => {
    const cleaned = value.replace(/[^0-9.]/g, "");
    const numValue = cleaned === "" ? 0 : parseFloat(cleaned);
    setTiers((prev) => {
      const next = [...prev];
      if (field === "quantity") next[index].quantity = Math.floor(numValue);
      if (field === "price") next[index].price = numValue;
      return next;
    });
  };

  const handleUpdate = () => {
    const payload: UpdatePromotionRequest = {
      id: promotion.id,
      mainProductId: promotion.mainProductId,
      name: name.trim(),
      type: promotion.type as string,
      isActive: promotion.isActive,
      tiers: tiers.map((tier) => ({
        quantity: tier.quantity,
        price: tier.price,
      })),
      tieUpProductId: promotion.tieUpProductId,
      tieUpQuantity: promotion.tieUpQuantity,
    };

    updatePromotion(payload, {
      onSuccess: () => onClose(),
    });
  };

  return (
    <Modal
      visible={isVisible}
      animationType="slide"
      transparent
      onRequestClose={onClose}
    >
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={styles.backdrop}
      >
        <View
          style={[
            styles.sheet,
            { paddingBottom: Math.max(insets.bottom, 16) },
          ]}
        >
          <View style={styles.header}>
            <View style={styles.identity}>
              <Text style={[styles.title, typeface(font.bold, "700")]}>
                Edit promo
              </Text>
              <Text
                numberOfLines={1}
                style={[styles.subtitle, typeface(font.medium, "500")]}
              >
                {promotion.productName ?? "Unknown item"} · {hint}
              </Text>
            </View>
            <TouchableOpacity onPress={onClose} style={styles.close} hitSlop={8}>
              <X size={18} color={INK} />
            </TouchableOpacity>
          </View>

          <ScrollView
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
            contentContainerStyle={styles.body}
          >
            {isBundle && promotion.tieUpProductName ? (
              <Text style={[styles.note, typeface(font.medium, "500")]}>
                Pairs with {promotion.tieUpProductName}
              </Text>
            ) : null}

            <View style={styles.field}>
              <Text style={[styles.label, typeface(font.medium, "500")]}>
                Name
              </Text>
              <TextInput
                value={name}
                onChangeText={setName}
                placeholder="Deal name"
                placeholderTextColor="#94A3B8"
                style={[styles.input, typeface(font.medium, "500")]}
              />
            </View>

            <View style={styles.priceHead}>
              <Text style={[styles.label, typeface(font.medium, "500")]}>
                {isBulk ? "Price breaks" : "Promo price"}
              </Text>
              {isBulk ? (
                <Pressable
                  onPress={() =>
                    setTiers((prev) => [
                      ...prev,
                      { id: undefined, quantity: 1, price: 0 },
                    ])
                  }
                  hitSlop={6}
                >
                  <Text style={[styles.link, typeface(font.medium, "500")]}>
                    Add tier
                  </Text>
                </Pressable>
              ) : null}
            </View>

            {tiers.map((tier, index) => (
              <View key={index} style={styles.tierRow}>
                {isBulk ? (
                  <View style={styles.qtyField}>
                    <Text
                      style={[styles.fieldHint, typeface(font.medium, "500")]}
                    >
                      Qty
                    </Text>
                    <TextInput
                      keyboardType="number-pad"
                      value={String(tier.quantity)}
                      onChangeText={(value) =>
                        updateTier(index, "quantity", value)
                      }
                      style={[styles.input, typeface(font.medium, "500")]}
                    />
                  </View>
                ) : null}
                <View style={styles.priceField}>
                  <Text style={[styles.fieldHint, typeface(font.medium, "500")]}>
                    {isBulk ? "Pack price" : "Price"}
                  </Text>
                  <TextInput
                    keyboardType="decimal-pad"
                    value={tier.price === 0 ? "" : String(tier.price)}
                    placeholder="0.00"
                    placeholderTextColor="#94A3B8"
                    onChangeText={(value) => updateTier(index, "price", value)}
                    style={[styles.input, typeface(font.medium, "500")]}
                  />
                </View>
                {isBulk && tiers.length > 1 ? (
                  <Pressable
                    onPress={() =>
                      setTiers((prev) => prev.filter((_, i) => i !== index))
                    }
                    style={styles.remove}
                    hitSlop={6}
                  >
                    <Trash2 size={16} color="#E11D48" />
                  </Pressable>
                ) : null}
              </View>
            ))}
          </ScrollView>

          <View style={styles.footer}>
            <TouchableOpacity
              onPress={handleUpdate}
              disabled={isProcessing || !name.trim()}
              style={[
                styles.submit,
                (isProcessing || !name.trim()) && styles.submitOff,
              ]}
            >
              {isProcessing ? (
                <ActivityIndicator color="#FFFFFF" />
              ) : (
                <Text style={[styles.submitText, typeface(font.semibold, "600")]}>
                  Save changes
                </Text>
              )}
            </TouchableOpacity>
          </View>
        </View>
      </KeyboardAvoidingView>
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
    maxHeight: "92%",
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 22,
    paddingTop: 20,
    paddingBottom: 12,
  },
  identity: {
    flex: 1,
  },
  title: {
    fontSize: 20,
    color: INK,
    letterSpacing: -0.4,
  },
  subtitle: {
    marginTop: 3,
    fontSize: 13,
    color: MUTED,
  },
  close: {
    width: 36,
    height: 36,
    alignItems: "center",
    justifyContent: "center",
  },
  body: {
    paddingHorizontal: 22,
    paddingBottom: 16,
    gap: 16,
  },
  note: {
    fontSize: 13,
    color: MUTED,
  },
  field: {
    gap: 8,
  },
  label: {
    fontSize: 13,
    color: MUTED,
  },
  input: {
    backgroundColor: "#EEF1F6",
    borderRadius: 14,
    paddingHorizontal: 14,
    height: 46,
    fontSize: 15,
    color: INK,
  },
  priceHead: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  link: {
    fontSize: 13,
    color: TINT,
  },
  fieldHint: {
    fontSize: 12,
    color: MUTED,
    marginBottom: 6,
  },
  tierRow: {
    flexDirection: "row",
    alignItems: "flex-end",
    gap: 8,
  },
  qtyField: {
    width: 88,
  },
  priceField: {
    flex: 1,
  },
  remove: {
    width: 46,
    height: 46,
    alignItems: "center",
    justifyContent: "center",
  },
  footer: {
    paddingHorizontal: 22,
    paddingTop: 12,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: LINE,
  },
  submit: {
    height: 48,
    borderRadius: 14,
    backgroundColor: TINT,
    alignItems: "center",
    justifyContent: "center",
  },
  submitOff: {
    backgroundColor: "#CBD5E1",
  },
  submitText: {
    color: "#FFFFFF",
    fontSize: 16,
  },
});
