import { typeface, useInter } from "@/src/theme/typography";
import type { Category } from "@/src/types/inventory";
import { Calendar, Check, Search, X } from "lucide-react-native";
import React, { useEffect, useMemo, useState } from "react";
import {
  Pressable,
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

export type ProductFormState = {
  name: string;
  price: string;
  packPrice: string;
  piecesPerPack: string;
  stockQuantity: string;
  categoryId: string | null;
  description: string;
  expiryDate: string;
};

interface ProductFormFieldsProps {
  formData: ProductFormState;
  setFormData: (next: ProductFormState) => void;
  categories: Category[];
  onOpenCategoryManager: () => void;
  onPickDate: () => void;
  onClearExpiry?: () => void;
}

export function ProductFormFields({
  formData,
  setFormData,
  categories,
  onOpenCategoryManager,
  onPickDate,
  onClearExpiry,
}: ProductFormFieldsProps) {
  const font = useInter();
  const [searchQuery, setSearchQuery] = useState("");
  const [isFocused, setIsFocused] = useState(false);

  useEffect(() => {
    if (isFocused) return;
    const name =
      categories.find((category) => category.id === formData.categoryId)?.name ??
      "";
    setSearchQuery(name);
  }, [formData.categoryId, categories, isFocused]);

  const filteredCategories = useMemo(() => {
    const query = searchQuery.toLowerCase().trim();
    return query
      ? categories.filter((c) => c.name.toLowerCase().includes(query))
      : categories.slice(0, 5);
  }, [categories, searchQuery]);

  const patch = (partial: Partial<ProductFormState>) =>
    setFormData({ ...formData, ...partial });

  return (
    <View style={styles.stack}>
      <Field label="Name" font={font}>
        <TextInput
          placeholder="Item name"
          placeholderTextColor="#94A3B8"
          value={formData.name}
          onChangeText={(name) => patch({ name })}
          style={[styles.input, typeface(font.medium, "500")]}
        />
      </Field>

      <View>
        <View style={styles.labelRow}>
          <Text style={[styles.label, typeface(font.medium, "500")]}>Category</Text>
          <TouchableOpacity onPress={onOpenCategoryManager}>
            <Text style={[styles.link, typeface(font.medium, "500")]}>Manage</Text>
          </TouchableOpacity>
        </View>
        <View>
          <View style={styles.search}>
            <Search size={16} color="#94A3B8" />
            <TextInput
              placeholder="Search category"
              placeholderTextColor="#94A3B8"
              value={searchQuery}
              onFocus={() => setIsFocused(true)}
              onBlur={() => setTimeout(() => setIsFocused(false), 200)}
              onChangeText={setSearchQuery}
              style={[styles.searchInput, typeface(font.medium, "500")]}
            />
            {searchQuery.length > 0 ? (
              <Pressable
                onPress={() => {
                  setSearchQuery("");
                  patch({ categoryId: null });
                }}
                hitSlop={8}
              >
                <X size={14} color="#94A3B8" />
              </Pressable>
            ) : null}
          </View>
          {isFocused ? (
            <View style={styles.dropdown}>
              <ScrollView keyboardShouldPersistTaps="handled" bounces={false}>
                {filteredCategories.length === 0 ? (
                  <Text style={[styles.empty, typeface(font.regular, "400")]}>
                    No categories
                  </Text>
                ) : (
                  filteredCategories.map((category) => {
                    const active = formData.categoryId === category.id;
                    return (
                      <Pressable
                        key={category.id}
                        onPress={() => {
                          patch({ categoryId: category.id });
                          setSearchQuery(category.name);
                          setIsFocused(false);
                        }}
                        style={styles.option}
                      >
                        <Text
                          style={[
                            styles.optionText,
                            active && styles.optionOn,
                            typeface(font.medium, "500"),
                          ]}
                        >
                          {category.name}
                        </Text>
                        {active ? <Check size={16} color={TINT} /> : null}
                      </Pressable>
                    );
                  })
                )}
              </ScrollView>
            </View>
          ) : null}
        </View>
      </View>

      <View style={styles.row}>
        <Field label="Piece price" font={font} flex>
          <TextInput
            keyboardType="numeric"
            placeholder="0.00"
            placeholderTextColor="#94A3B8"
            value={formData.price}
            onChangeText={(price) => patch({ price })}
            style={[styles.input, typeface(font.medium, "500")]}
          />
        </Field>
        <Field label="Stock (pcs)" font={font} flex>
          <TextInput
            keyboardType="numeric"
            placeholder="Qty"
            placeholderTextColor="#94A3B8"
            value={formData.stockQuantity}
            onChangeText={(stockQuantity) => patch({ stockQuantity })}
            style={[styles.input, typeface(font.medium, "500")]}
          />
        </Field>
      </View>

      <View>
        <Text style={[styles.label, { marginBottom: 8 }, typeface(font.medium, "500")]}>
          Pack selling (optional)
        </Text>
        <View style={styles.row}>
          <TextInput
            keyboardType="numeric"
            placeholder="Pack price"
            placeholderTextColor="#94A3B8"
            value={formData.packPrice}
            onChangeText={(packPrice) => patch({ packPrice })}
            style={[styles.input, styles.flex, typeface(font.medium, "500")]}
          />
          <TextInput
            keyboardType="numeric"
            placeholder="Pcs / pack"
            placeholderTextColor="#94A3B8"
            value={formData.piecesPerPack}
            onChangeText={(piecesPerPack) => patch({ piecesPerPack })}
            style={[styles.input, styles.flex, typeface(font.medium, "500")]}
          />
        </View>
        <Text style={[styles.hint, typeface(font.regular, "400")]}>
          Fill both to sell by pack. Leave blank for piece only.
        </Text>
      </View>

      <View>
        <View style={styles.labelRow}>
          <Text style={[styles.label, typeface(font.medium, "500")]}>Expiry</Text>
          {formData.expiryDate && onClearExpiry ? (
            <TouchableOpacity onPress={onClearExpiry}>
              <Text style={[styles.clear, typeface(font.medium, "500")]}>Clear</Text>
            </TouchableOpacity>
          ) : null}
        </View>
        <Pressable onPress={onPickDate} style={styles.dateBtn}>
          <Text
            style={[
              styles.dateText,
              !formData.expiryDate && { color: "#94A3B8" },
              typeface(font.medium, "500"),
            ]}
          >
            {formData.expiryDate || "Set expiry date"}
          </Text>
          <Calendar size={16} color="#94A3B8" />
        </Pressable>
      </View>

      <Field label="Description (optional)" font={font}>
        <TextInput
          multiline
          numberOfLines={3}
          placeholder="Notes about this product"
          placeholderTextColor="#94A3B8"
          value={formData.description}
          onChangeText={(description) => patch({ description })}
          style={[styles.input, styles.area, typeface(font.medium, "500")]}
        />
      </Field>
    </View>
  );
}

function Field({
  label,
  font,
  flex,
  children,
}: {
  label: string;
  font: ReturnType<typeof useInter>;
  flex?: boolean;
  children: React.ReactNode;
}) {
  return (
    <View style={flex ? styles.flex : undefined}>
      <Text style={[styles.label, { marginBottom: 8 }, typeface(font.medium, "500")]}>{label}</Text>
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  stack: {
    gap: 18,
  },
  row: {
    flexDirection: "row",
    gap: 10,
  },
  flex: {
    flex: 1,
  },
  labelRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 8,
  },
  label: {
    fontSize: 13,
    color: MUTED,
  },
  link: {
    fontSize: 13,
    color: TINT,
    marginBottom: 8,
  },
  clear: {
    fontSize: 13,
    color: "#E11D48",
    marginBottom: 8,
  },
  input: {
    backgroundColor: "#EEF1F6",
    borderRadius: 14,
    paddingHorizontal: 14,
    height: 46,
    fontSize: 15,
    color: INK,
  },
  area: {
    height: 88,
    paddingTop: 12,
    textAlignVertical: "top",
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
  dropdown: {
    marginTop: 6,
    backgroundColor: "#FFFFFF",
    borderRadius: 14,
    maxHeight: 168,
    overflow: "hidden",
  },
  option: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 14,
    paddingVertical: 12,
  },
  optionText: {
    fontSize: 15,
    color: INK,
  },
  optionOn: {
    color: TINT,
  },
  empty: {
    padding: 14,
    fontSize: 14,
    color: MUTED,
  },
  hint: {
    marginTop: 8,
    fontSize: 12,
    color: MUTED,
  },
  dateBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: "#EEF1F6",
    borderRadius: 14,
    paddingHorizontal: 14,
    height: 46,
  },
  dateText: {
    fontSize: 15,
    color: INK,
  },
});
