import { typeface, useInter } from "@/src/theme/typography";
import type { Category, ProductFormState } from "@/src/types/inventory";
import { Calendar, Plus, Search, X } from "lucide-react-native";
import React, { useState } from "react";
import {
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";

const INK = "#0F172A";
const MUTED = "#64748B";
const TINT = "#2563EB";

interface ProductFormFieldsProps {
  formData: ProductFormState;
  setFormData: React.Dispatch<React.SetStateAction<ProductFormState>>;
  categories: Category[];
  onOpenCategoryManager: () => void;
  onPickDate: () => void;
  onClearExpiry?: () => void;
  onOpenBatchModal?: () => void;
  isExpiryReadOnly?: boolean;
  isStockReadOnly?: boolean;
}

export function ProductFormFields({
  formData,
  setFormData,
  categories,
  onOpenCategoryManager,
  onPickDate,
  onClearExpiry,
  onOpenBatchModal,
  isExpiryReadOnly = false,
  isStockReadOnly = false,
}: ProductFormFieldsProps) {
  const font = useInter();
  const [categorySearch, setCategorySearch] = useState<string>("");

  const filteredCategories = categories.filter((cat: Category) =>
    cat.name.toLowerCase().includes(categorySearch.toLowerCase()),
  );

  return (
    <View style={styles.container}>
      {/* Product Name */}
      <View style={styles.fieldGroup}>
        <Text style={[styles.label, typeface(font.medium, "500")]}>
          Product Name *
        </Text>
        <TextInput
          style={[styles.input, typeface(font.regular, "400")]}
          placeholder="e.g. Premium Chocolate"
          placeholderTextColor="#94A3B8"
          value={formData.name}
          onChangeText={(text: string) =>
            setFormData((prev: ProductFormState) => ({ ...prev, name: text }))
          }
        />
      </View>

      {/* Category Selection with Uniform Search Input */}
      <View style={styles.fieldGroup}>
        <View style={styles.rowBetween}>
          <Text style={[styles.label, typeface(font.medium, "500")]}>
            Category
          </Text>
          <TouchableOpacity onPress={onOpenCategoryManager}>
            <Text style={[styles.manageLink, typeface(font.semibold, "600")]}>
              Manage
            </Text>
          </TouchableOpacity>
        </View>

        <View style={styles.searchInputContainer}>
          <Search size={16} color={MUTED} style={styles.searchIcon} />
          <TextInput
            style={[styles.searchUniformInput, typeface(font.regular, "400")]}
            placeholder="Search category..."
            placeholderTextColor="#94A3B8"
            value={categorySearch}
            onChangeText={(text: string) => setCategorySearch(text)}
          />
          {categorySearch.length > 0 && (
            <TouchableOpacity
              onPress={() => setCategorySearch("")}
              hitSlop={8}
              style={styles.clearSearchBtn}
            >
              <X size={16} color={MUTED} />
            </TouchableOpacity>
          )}
        </View>

        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          style={styles.categoryScroll}
        >
          <TouchableOpacity
            style={[
              styles.categoryChip,
              formData.categoryId === null && styles.categoryChipActive,
            ]}
            onPress={() =>
              setFormData((prev: ProductFormState) => ({
                ...prev,
                categoryId: null,
              }))
            }
          >
            <Text
              style={[
                styles.categoryChipText,
                formData.categoryId === null && styles.categoryChipTextActive,
              ]}
            >
              Uncategorized
            </Text>
          </TouchableOpacity>
          {filteredCategories.map((cat: Category) => (
            <TouchableOpacity
              key={cat.id}
              style={[
                styles.categoryChip,
                formData.categoryId === cat.id && styles.categoryChipActive,
              ]}
              onPress={() =>
                setFormData((prev: ProductFormState) => ({
                  ...prev,
                  categoryId: cat.id,
                }))
              }
            >
              <Text
                style={[
                  styles.categoryChipText,
                  formData.categoryId === cat.id &&
                    styles.categoryChipTextActive,
                ]}
              >
                {cat.name}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      {/* Price & Stock */}
      <View style={styles.row}>
        <View style={[styles.fieldGroup, { flex: 1 }]}>
          <Text style={[styles.label, typeface(font.medium, "500")]}>
            Piece Price *
          </Text>
          <TextInput
            style={[styles.input, typeface(font.regular, "400")]}
            placeholder="0.00"
            placeholderTextColor="#94A3B8"
            keyboardType="numeric"
            value={formData.price}
            onChangeText={(text: string) =>
              setFormData((prev: ProductFormState) => ({
                ...prev,
                price: text,
              }))
            }
          />
        </View>
        <View style={[styles.fieldGroup, { flex: 1 }]}>
          <View style={styles.rowBetween}>
            <Text style={[styles.label, typeface(font.medium, "500")]}>
              {isStockReadOnly ? "Total Stock" : "Initial Stock *"}
            </Text>
            {onOpenBatchModal && (
              <TouchableOpacity
                onPress={onOpenBatchModal}
                style={styles.plusBatchBadge}
              >
                <Plus size={12} color="#166534" />
                <Text
                  style={[styles.plusBatchText, typeface(font.semibold, "600")]}
                >
                  Restock
                </Text>
              </TouchableOpacity>
            )}
          </View>
          <TextInput
            style={[
              styles.input,
              isStockReadOnly && styles.disabledInput,
              typeface(font.regular, "400"),
            ]}
            placeholder="0"
            placeholderTextColor="#94A3B8"
            keyboardType="numeric"
            value={formData.stockQuantity}
            editable={!isStockReadOnly}
            onChangeText={(text: string) =>
              setFormData((prev: ProductFormState) => ({
                ...prev,
                stockQuantity: text,
              }))
            }
          />
        </View>
      </View>

      {/* Pack Configuration */}
      <View style={styles.row}>
        <View style={[styles.fieldGroup, { flex: 1 }]}>
          <Text style={[styles.label, typeface(font.medium, "500")]}>
            Pack Price (Optional)
          </Text>
          <TextInput
            style={[styles.input, typeface(font.regular, "400")]}
            placeholder="0.00"
            placeholderTextColor="#94A3B8"
            keyboardType="numeric"
            value={formData.packPrice}
            onChangeText={(text: string) =>
              setFormData((prev: ProductFormState) => ({
                ...prev,
                packPrice: text,
              }))
            }
          />
        </View>
        <View style={[styles.fieldGroup, { flex: 1 }]}>
          <Text style={[styles.label, typeface(font.medium, "500")]}>
            Pieces / Pack
          </Text>
          <TextInput
            style={[styles.input, typeface(font.regular, "400")]}
            placeholder="e.g. 12"
            placeholderTextColor="#94A3B8"
            keyboardType="numeric"
            value={formData.piecesPerPack}
            onChangeText={(text: string) =>
              setFormData((prev: ProductFormState) => ({
                ...prev,
                piecesPerPack: text,
              }))
            }
          />
        </View>
      </View>

      {/* Expiry Date Field */}
      <View style={styles.fieldGroup}>
        <View style={styles.rowBetween}>
          <Text style={[styles.label, typeface(font.medium, "500")]}>
            Initial Batch Expiry Date
          </Text>
          {isExpiryReadOnly && (
            <Text style={[styles.readOnlyBadge, typeface(font.medium, "500")]}>
              Auto (Nearest Batch)
            </Text>
          )}
        </View>
        <TouchableOpacity
          style={[styles.input, isExpiryReadOnly && styles.disabledInput]}
          onPress={isExpiryReadOnly ? undefined : onPickDate}
          activeOpacity={isExpiryReadOnly ? 1 : 0.7}
        >
          <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
            <Calendar size={18} color={MUTED} />
            <Text
              style={[
                styles.dateText,
                !formData.expiryDate && styles.placeholderText,
                typeface(font.regular, "400"),
              ]}
            >
              {formData.expiryDate
                ? formData.expiryDate
                : "Select expiry date (optional)"}
            </Text>
          </View>
          {!isExpiryReadOnly && formData.expiryDate && onClearExpiry && (
            <TouchableOpacity onPress={onClearExpiry} hitSlop={8}>
              <X size={16} color={MUTED} />
            </TouchableOpacity>
          )}
        </TouchableOpacity>
      </View>

      {/* Description */}
      <View style={styles.fieldGroup}>
        <Text style={[styles.label, typeface(font.medium, "500")]}>
          Description
        </Text>
        <TextInput
          style={[styles.textArea, typeface(font.regular, "400")]}
          placeholder="Optional product notes..."
          placeholderTextColor="#94A3B8"
          multiline
          numberOfLines={3}
          value={formData.description}
          onChangeText={(text: string) =>
            setFormData((prev: ProductFormState) => ({
              ...prev,
              description: text,
            }))
          }
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { gap: 14 },
  fieldGroup: { gap: 6 },
  label: { fontSize: 13, color: INK },
  input: {
    backgroundColor: "#EEF1F6",
    borderRadius: 14,
    paddingHorizontal: 14,
    height: 46,
    fontSize: 15,
    color: INK,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  textArea: {
    backgroundColor: "#EEF1F6",
    borderRadius: 14,
    paddingHorizontal: 14,
    paddingTop: 12,
    height: 88,
    fontSize: 15,
    color: INK,
    textAlignVertical: "top",
  },
  row: { flexDirection: "row", gap: 12 },
  rowBetween: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  manageLink: { fontSize: 12, color: TINT },
  plusBatchBadge: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#DCFCE7",
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
    gap: 2,
  },
  plusBatchText: { fontSize: 11, color: "#166534" },
  searchInputContainer: {
    backgroundColor: "#EEF1F6",
    borderRadius: 14,
    height: 46,
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 14,
    marginBottom: 6,
  },
  searchIcon: { marginRight: 8 },
  searchUniformInput: { flex: 1, fontSize: 15, color: INK, paddingVertical: 0 },
  clearSearchBtn: { padding: 4 },
  categoryScroll: { flexDirection: "row" },
  categoryChip: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: "#EEF1F6",
    marginRight: 8,
  },
  categoryChipActive: { backgroundColor: TINT },
  categoryChipText: { fontSize: 13, color: MUTED },
  categoryChipTextActive: { color: "#FFFFFF" },
  disabledInput: { opacity: 0.8, backgroundColor: "#E2E8F0" },
  readOnlyBadge: { fontSize: 11, color: "#059669" },
  dateText: { fontSize: 15, color: INK },
  placeholderText: { color: "#94A3B8" },
});
