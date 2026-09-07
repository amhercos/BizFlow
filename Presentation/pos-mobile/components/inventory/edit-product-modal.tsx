import { DateWheelSheet } from "@/components/inventory/DateWheelSheet";
import {
  ProductFormFields,
  type ProductFormState,
} from "@/components/inventory/product-form-fields";
import { typeface, useInter } from "@/src/theme/typography";
import type {
  Category,
  Product,
  UpdateProductRequest,
} from "@/src/types/inventory";
import {
  isPackConfigValid,
  parseOptionalNumber,
} from "@/src/types/inventory";
import { X } from "lucide-react-native";
import React, { useEffect, useMemo, useState } from "react";
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Modal,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

const INK = "#0F172A";
const MUTED = "#64748B";
const TINT = "#2563EB";

interface EditProductModalProps {
  isOpen: boolean;
  onClose: () => void;
  product: Product | null;
  categories: Category[];
  onUpdate: (id: string, data: UpdateProductRequest) => Promise<void>;
  onOpenCategoryManager: () => void;
}

export function EditProductModal({
  isOpen,
  onClose,
  product,
  categories,
  onUpdate,
  onOpenCategoryManager,
}: EditProductModalProps) {
  const insets = useSafeAreaInsets();
  const font = useInter();
  const [loading, setLoading] = useState(false);
  const [pickerOpen, setPickerOpen] = useState(false);
  const [tempDate, setTempDate] = useState(new Date());
  const [formData, setFormData] = useState<ProductFormState>({
    name: "",
    price: "",
    packPrice: "",
    piecesPerPack: "",
    stockQuantity: "",
    categoryId: null,
    description: "",
    expiryDate: "",
  });

  useEffect(() => {
    if (product && isOpen) {
      setFormData({
        name: product.name,
        price: product.price.toString(),
        packPrice:
          product.packPrice != null && product.packPrice > 0
            ? String(product.packPrice)
            : "",
        piecesPerPack:
          product.piecesPerPack != null && product.piecesPerPack > 1
            ? String(product.piecesPerPack)
            : "",
        stockQuantity: product.stockQuantity.toString(),
        categoryId: product.categoryId || null,
        description: product.description || "",
        expiryDate: product.expiryDate ? product.expiryDate.split("T")[0] : "",
      });
      if (product.expiryDate) setTempDate(new Date(product.expiryDate));
    }
  }, [product, isOpen]);

  const isValid = useMemo(
    () =>
      formData.name.trim().length >= 2 &&
      formData.price !== "" &&
      formData.stockQuantity !== "" &&
      isPackConfigValid(formData.packPrice, formData.piecesPerPack),
    [formData],
  );

  const handleSubmit = async () => {
    if (!isValid || !product) return;
    setLoading(true);
    try {
      await onUpdate(product.id, {
        id: product.id,
        name: formData.name,
        price: Number(formData.price),
        packPrice: parseOptionalNumber(formData.packPrice),
        piecesPerPack: parseOptionalNumber(formData.piecesPerPack),
        stock: Number(formData.stockQuantity),
        lowStockThreshold: product.lowStockThreshold || 5,
        categoryId: formData.categoryId,
        description: formData.description,
        expiryDate: formData.expiryDate || null,
      });
      onClose();
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal
      visible={isOpen}
      animationType="slide"
      transparent
      onRequestClose={onClose}
    >
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={styles.backdrop}
      >
        <View style={[styles.sheet, { paddingBottom: Math.max(insets.bottom, 16) }]}>
          <View style={styles.header}>
            <View style={styles.identity}>
              <Text style={[styles.title, typeface(font.bold, "700")]}>
                Edit product
              </Text>
              <Text
                style={[styles.subtitle, typeface(font.medium, "500")]}
                numberOfLines={1}
              >
                {product?.name ?? "Update item details"}
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
            <ProductFormFields
              formData={formData}
              setFormData={setFormData}
              categories={categories}
              onOpenCategoryManager={onOpenCategoryManager}
              onPickDate={() => setPickerOpen(true)}
              onClearExpiry={() => setFormData({ ...formData, expiryDate: "" })}
            />

            <TouchableOpacity
              onPress={handleSubmit}
              disabled={loading || !isValid}
              style={[styles.submit, !isValid && styles.submitOff]}
            >
              {loading ? (
                <ActivityIndicator color="#FFFFFF" />
              ) : (
                <Text style={[styles.submitText, typeface(font.semibold, "600")]}>
                  Save changes
                </Text>
              )}
            </TouchableOpacity>
          </ScrollView>
        </View>
      </KeyboardAvoidingView>

      <DateWheelSheet
        visible={pickerOpen}
        value={tempDate}
        onCancel={() => setPickerOpen(false)}
        onConfirm={(date) => {
          setTempDate(date);
          setFormData({
            ...formData,
            expiryDate: date.toISOString().split("T")[0],
          });
          setPickerOpen(false);
        }}
      />
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
    marginRight: 12,
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
    paddingBottom: 24,
    paddingTop: 8,
  },
  submit: {
    marginTop: 24,
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
