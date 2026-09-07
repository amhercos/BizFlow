import { typeface, useInter } from "@/src/theme/typography";
import type { Product } from "@/src/types/inventory";
import {
  Check,
  Search,
  Trash2,
  X,
} from "lucide-react-native";
import React, { useMemo, useState } from "react";
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
import { useInventory } from "../../src/hooks/use-inventory";
import { usePromotions } from "../../src/hooks/use-promotions";
import {
  CreatePromotionRequest,
  PromotionTier,
  PromotionType,
} from "../../src/types/promotion";

const INK = "#0F172A";
const MUTED = "#64748B";
const TINT = "#2563EB";
const LINE = "rgba(15, 23, 42, 0.08)";

interface CreatePromotionModalProps {
  isVisible: boolean;
  onClose: () => void;
}

type TierInput = Omit<PromotionTier, "id" | "promotionId">;

const STRATEGIES: { id: PromotionType; label: string; hint: string }[] = [
  { id: PromotionType.Discount, label: "Discount", hint: "One promo price" },
  { id: PromotionType.Bulk, label: "Bulk", hint: "Quantity breaks" },
  { id: PromotionType.Bundle, label: "Bundle", hint: "Buy with another item" },
];

export default function CreatePromotionModal({
  isVisible,
  onClose,
}: CreatePromotionModalProps) {
  const insets = useSafeAreaInsets();
  const font = useInter();
  const { addPromotion, isProcessing } = usePromotions();
  const { products } = useInventory();

  const [type, setType] = useState<PromotionType>(PromotionType.Discount);
  const [name, setName] = useState("");
  const [selectedProductId, setSelectedProductId] = useState("");
  const [productSearch, setProductSearch] = useState("");
  const [tieUpProductId, setTieUpProductId] = useState<string | null>(null);
  const [tieUpSearch, setTieUpSearch] = useState("");
  const [tieUpQuantity] = useState(1);
  const [tiers, setTiers] = useState<TierInput[]>([{ quantity: 1, price: 0 }]);

  const isBulk = type === PromotionType.Bulk;
  const isBundle = type === PromotionType.Bundle;
  const isDiscount = type === PromotionType.Discount;
  const hint = STRATEGIES.find((item) => item.id === type)?.hint ?? "";

  const reset = () => {
    setName("");
    setSelectedProductId("");
    setProductSearch("");
    setTieUpProductId(null);
    setTieUpSearch("");
    setTiers([{ quantity: 1, price: 0 }]);
  };

  const updateTier = (index: number, field: keyof TierInput, value: string) => {
    const cleaned = value.replace(/[^0-9.]/g, "");
    const numValue = cleaned === "" ? 0 : parseFloat(cleaned);
    setTiers((prev) => {
      const updated = [...prev];
      updated[index] = { ...updated[index], [field]: numValue };
      return updated;
    });
  };

  const canSave =
    name.trim().length > 0 &&
    selectedProductId.length > 0 &&
    tiers[0].price > 0 &&
    (!isBundle || !!tieUpProductId);

  const handleSubmit = () => {
    if (!canSave) return;

    const payload: CreatePromotionRequest = {
      name: name.trim(),
      type,
      mainProductId: selectedProductId,
      isActive: true,
      tiers: (isBulk ? tiers : [{ quantity: 1, price: tiers[0].price }]).map(
        (tier) => ({
          quantity: tier.quantity,
          price: tier.price,
        }),
      ),
      tieUpProductId: isBundle ? tieUpProductId : null,
      tieUpQuantity: isBundle ? tieUpQuantity : null,
    };

    addPromotion(payload, {
      onSuccess: () => {
        reset();
        onClose();
      },
    });
  };

  const filteredMainProducts = useMemo(
    () =>
      products
        ?.filter((item) =>
          item.name.toLowerCase().includes(productSearch.toLowerCase()),
        )
        .slice(0, 6) ?? [],
    [products, productSearch],
  );

  const filteredTieUpProducts = useMemo(
    () =>
      products
        ?.filter((item) =>
          item.name.toLowerCase().includes(tieUpSearch.toLowerCase()),
        )
        .slice(0, 6) ?? [],
    [products, tieUpSearch],
  );

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
                New promo
              </Text>
              <Text style={[styles.subtitle, typeface(font.medium, "500")]}>
                {hint}
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
            <View style={styles.segment}>
              {STRATEGIES.map((item) => {
                const active = type === item.id;
                return (
                  <Pressable
                    key={item.id}
                    onPress={() => {
                      setType(item.id);
                      setTiers([{ quantity: 1, price: 0 }]);
                    }}
                    style={[styles.segmentItem, active && styles.segmentItemOn]}
                  >
                    <Text
                      style={[
                        styles.segmentText,
                        active && styles.segmentTextOn,
                        typeface(active ? font.semibold : font.medium, "600"),
                      ]}
                    >
                      {item.label}
                    </Text>
                  </Pressable>
                );
              })}
            </View>

            <Field label="Name" font={font}>
              <TextInput
                placeholder="Weekend deal"
                placeholderTextColor="#94A3B8"
                value={name}
                onChangeText={setName}
                style={[styles.input, typeface(font.medium, "500")]}
              />
            </Field>

            {isBundle ? (
              <>
                <ProductPicker
                  label="Pair with"
                  placeholder="Search required item"
                  query={tieUpSearch}
                  selectedId={tieUpProductId}
                  results={filteredTieUpProducts}
                  onChangeQuery={(value) => {
                    setTieUpSearch(value);
                    if (tieUpProductId) setTieUpProductId(null);
                  }}
                  onSelect={(item) => {
                    setTieUpProductId(item.id);
                    setTieUpSearch(item.name);
                  }}
                  onClear={() => {
                    setTieUpProductId(null);
                    setTieUpSearch("");
                  }}
                  font={font}
                />
                <ProductPicker
                  label="Discounted item"
                  placeholder="Search item on promo"
                  query={productSearch}
                  selectedId={selectedProductId}
                  results={filteredMainProducts}
                  onChangeQuery={(value) => {
                    setProductSearch(value);
                    if (selectedProductId) setSelectedProductId("");
                  }}
                  onSelect={(item) => {
                    setSelectedProductId(item.id);
                    setProductSearch(item.name);
                  }}
                  onClear={() => {
                    setSelectedProductId("");
                    setProductSearch("");
                  }}
                  font={font}
                />
              </>
            ) : (
              <ProductPicker
                label="Product"
                placeholder="Search items"
                query={productSearch}
                selectedId={selectedProductId}
                results={filteredMainProducts}
                onChangeQuery={(value) => {
                  setProductSearch(value);
                  if (selectedProductId) setSelectedProductId("");
                }}
                onSelect={(item) => {
                  setSelectedProductId(item.id);
                  setProductSearch(item.name);
                }}
                onClear={() => {
                  setSelectedProductId("");
                  setProductSearch("");
                }}
                font={font}
              />
            )}

            <View style={styles.priceHead}>
              <Text style={[styles.label, typeface(font.medium, "500")]}>
                {isBulk ? "Price breaks" : "Promo price"}
              </Text>
              {isBulk ? (
                <Pressable
                  onPress={() =>
                    setTiers((prev) => [...prev, { quantity: 1, price: 0 }])
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
                    <Text style={[styles.fieldHint, typeface(font.medium, "500")]}>
                      Qty
                    </Text>
                    <TextInput
                      keyboardType="number-pad"
                      value={tier.quantity === 0 ? "" : String(tier.quantity)}
                      onChangeText={(value) =>
                        updateTier(index, "quantity", value)
                      }
                      placeholder="1"
                      placeholderTextColor="#94A3B8"
                      style={[styles.input, typeface(font.medium, "500")]}
                    />
                  </View>
                ) : null}
                <View style={styles.priceField}>
                  {isBulk ? (
                    <Text
                      style={[styles.fieldHint, typeface(font.medium, "500")]}
                    >
                      Pack price
                    </Text>
                  ) : null}
                  <TextInput
                    keyboardType="decimal-pad"
                    value={tier.price === 0 ? "" : String(tier.price)}
                    onChangeText={(value) => updateTier(index, "price", value)}
                    placeholder="0.00"
                    placeholderTextColor="#94A3B8"
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
              onPress={handleSubmit}
              disabled={isProcessing || !canSave}
              style={[
                styles.submit,
                (isProcessing || !canSave) && styles.submitOff,
              ]}
            >
              {isProcessing ? (
                <ActivityIndicator color="#FFFFFF" />
              ) : (
                <Text style={[styles.submitText, typeface(font.semibold, "600")]}>
                  Save promo
                </Text>
              )}
            </TouchableOpacity>
          </View>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

function Field({
  label,
  font,
  children,
}: {
  label: string;
  font: ReturnType<typeof useInter>;
  children: React.ReactNode;
}) {
  return (
    <View style={styles.field}>
      <Text style={[styles.label, typeface(font.medium, "500")]}>{label}</Text>
      {children}
    </View>
  );
}

function ProductPicker({
  label,
  placeholder,
  query,
  selectedId,
  results,
  onChangeQuery,
  onSelect,
  onClear,
  font,
}: {
  label: string;
  placeholder: string;
  query: string;
  selectedId: string | null;
  results: Product[];
  onChangeQuery: (value: string) => void;
  onSelect: (item: Product) => void;
  onClear: () => void;
  font: ReturnType<typeof useInter>;
}) {
  const selected = Boolean(selectedId);

  return (
    <View style={styles.field}>
      <Text style={[styles.label, typeface(font.medium, "500")]}>{label}</Text>
      <View style={styles.search}>
        <Search size={16} color="#94A3B8" />
        <TextInput
          placeholder={placeholder}
          placeholderTextColor="#94A3B8"
          value={query}
          onChangeText={onChangeQuery}
          style={[styles.searchInput, typeface(font.medium, "500")]}
        />
        {query.length > 0 ? (
          <Pressable onPress={onClear} hitSlop={8}>
            <X size={14} color="#94A3B8" />
          </Pressable>
        ) : null}
      </View>
      {selected ? (
        <View style={styles.picked}>
          <Check size={14} color={TINT} />
          <Text
            numberOfLines={1}
            style={[styles.pickedText, typeface(font.medium, "500")]}
          >
            {query}
          </Text>
        </View>
      ) : query.length > 0 ? (
        <View style={styles.dropdown}>
          {results.length === 0 ? (
            <Text style={[styles.empty, typeface(font.regular, "400")]}>
              No matching items
            </Text>
          ) : (
            results.map((item, index) => (
              <View key={item.id}>
                {index > 0 ? <View style={styles.hairline} /> : null}
                <Pressable
                  onPress={() => onSelect(item)}
                  style={styles.option}
                >
                  <Text
                    numberOfLines={1}
                    style={[styles.optionText, typeface(font.medium, "500")]}
                  >
                    {item.name}
                  </Text>
                </Pressable>
              </View>
            ))
          )}
        </View>
      ) : null}
    </View>
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
  segment: {
    flexDirection: "row",
    backgroundColor: "#EEF1F6",
    borderRadius: 14,
    padding: 4,
  },
  segmentItem: {
    flex: 1,
    height: 40,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
  },
  segmentItemOn: {
    backgroundColor: TINT,
  },
  segmentText: {
    fontSize: 13,
    color: INK,
  },
  segmentTextOn: {
    color: "#FFFFFF",
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
  search: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#EEF1F6",
    borderRadius: 14,
    paddingHorizontal: 14,
    height: 46,
    gap: 8,
  },
  searchInput: {
    flex: 1,
    fontSize: 15,
    color: INK,
    paddingVertical: 0,
  },
  picked: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    paddingHorizontal: 2,
  },
  pickedText: {
    flex: 1,
    fontSize: 13,
    color: TINT,
  },
  dropdown: {
    backgroundColor: "#FFFFFF",
    borderRadius: 14,
    overflow: "hidden",
  },
  option: {
    paddingHorizontal: 14,
    paddingVertical: 12,
  },
  optionText: {
    fontSize: 15,
    color: INK,
  },
  empty: {
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 14,
    color: MUTED,
  },
  hairline: {
    height: StyleSheet.hairlineWidth,
    backgroundColor: LINE,
    marginHorizontal: 14,
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
    marginBottom: 0,
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
