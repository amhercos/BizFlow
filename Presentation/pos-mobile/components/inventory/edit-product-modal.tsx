import { getProductBatches, deleteProductBatch } from "@/src/api/batch";
import AddProductBatchModal from "@/components/inventory/AddProductBatchModal";
import { DateWheelSheet } from "@/components/inventory/DateWheelSheet";
import {
  ProductFormFields,
} from "@/components/inventory/product-form-fields";
import type { ProductFormState } from "@/src/types/inventory";
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
import { X, Trash2, Calendar, Package } from "lucide-react-native";
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
const BATCH_COLOR = "#059669";
const DANGER = "#E11D48";

interface ProductBatch {
  id: string;
  quantity: number;
  expiryDate?: string;
  isDeleted?: boolean;
  batchNumber?: string;
}

interface EditProductModalProps {
  isOpen: boolean;
  onClose: () => void;
  product: Product | null;
  categories: Category[];
  onUpdate: (id: string, data: UpdateProductRequest) => Promise<void>;
  onOpenCategoryManager: () => void;
  onRefresh?: () => void;
}

export function EditProductModal({
  isOpen,
  onClose,
  product,
  categories,
  onUpdate,
  onOpenCategoryManager,
  onRefresh,
}: EditProductModalProps) {
  const insets = useSafeAreaInsets();
  const font = useInter();
  const [loading, setLoading] = useState<boolean>(false);
  const [pickerOpen, setPickerOpen] = useState<boolean>(false);
  const [isBatchModalVisible, setIsBatchModalVisible] = useState<boolean>(false);

  const [batches, setBatches] = useState<ProductBatch[]>([]);
  const [deletedBatchIds, setDeletedBatchIds] = useState<string[]>([]);
  const [loadingBatches, setLoadingBatches] = useState<boolean>(false);

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

  const fetchBatches = async (targetProductId: string, stagedDeleted: string[] = []) => {
    try {
      setLoadingBatches(true);
      const activeBatchesData = await getProductBatches(targetProductId);
      const activeBatches = (activeBatchesData || []).filter(
        (b: ProductBatch) => !b.isDeleted && b.quantity > 0 && !stagedDeleted.includes(b.id)
      );
      setBatches(activeBatches);

      const totalStock = activeBatches.reduce(
        (acc: number, b: ProductBatch) => acc + b.quantity,
        0
      );

      let nearestExpiry = "";
      if (activeBatches.length > 0) {
        const validDates = activeBatches
          .filter((b: ProductBatch) => b.expiryDate)
          .map((b: ProductBatch) => new Date(b.expiryDate!))
          .filter((d: Date) => !isNaN(d.getTime()));

        if (validDates.length > 0) {
          const earliest = new Date(Math.min(...validDates.map((d: Date) => d.getTime())));
          const year = earliest.getFullYear();
          const month = String(earliest.getMonth() + 1).padStart(2, "0");
          const day = String(earliest.getDate()).padStart(2, "0");
          nearestExpiry = `${year}-${month}-${day}`;
        }
      }

      setFormData((prev: ProductFormState) => ({
        ...prev,
        stockQuantity: String(totalStock),
        expiryDate: nearestExpiry || (activeBatches.length === 0 ? prev.expiryDate : ""),
      }));
    } catch (err) {
      console.error("Failed to load batches:", err);
    } finally {
      setLoadingBatches(false);
    }
  };

  const handleStageDeleteBatch = (batchId: string) => {
    const updatedDeleted = [...deletedBatchIds, batchId];
    setDeletedBatchIds(updatedDeleted);

    const remainingActive = batches.filter((b: ProductBatch) => !updatedDeleted.includes(b.id));
    const totalStock = remainingActive.reduce((acc: number, b: ProductBatch) => acc + b.quantity, 0);

    let nearestExpiry = "";
    if (remainingActive.length > 0) {
      const validDates = remainingActive
        .filter((b: ProductBatch) => b.expiryDate)
        .map((b: ProductBatch) => new Date(b.expiryDate!))
        .filter((d: Date) => !isNaN(d.getTime()));

      if (validDates.length > 0) {
        const earliest = new Date(Math.min(...validDates.map((d: Date) => d.getTime())));
        const year = earliest.getFullYear();
        const month = String(earliest.getMonth() + 1).padStart(2, "0");
        const day = String(earliest.getDate()).padStart(2, "0");
        nearestExpiry = `${year}-${month}-${day}`;
      }
    }

    setFormData((prev: ProductFormState) => ({
      ...prev,
      stockQuantity: String(totalStock),
      expiryDate: nearestExpiry,
    }));
  };

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
      setDeletedBatchIds([]);
      fetchBatches(product.id, []);
    }
  }, [product, isOpen]);

  const isValid = useMemo(
    () =>
      formData.name.trim().length >= 2 &&
      formData.price !== "" &&
      isPackConfigValid(formData.packPrice, formData.piecesPerPack),
    [formData]
  );

  const handleSubmit = async () => {
    if (!isValid || !product) return;
    setLoading(true);
    try {
      for (const bId of deletedBatchIds) {
        await deleteProductBatch(bId);
      }

      let finalExpiry = formData.expiryDate;
      const remainingActive = batches.filter((b: ProductBatch) => !deletedBatchIds.includes(b.id));
      if (remainingActive.length > 0) {
        const validDates = remainingActive
          .filter((b: ProductBatch) => b.expiryDate)
          .map((b: ProductBatch) => new Date(b.expiryDate!))
          .filter((d: Date) => !isNaN(d.getTime()));
        if (validDates.length > 0) {
          const earliest = new Date(Math.min(...validDates.map((d: Date) => d.getTime())));
          const year = earliest.getFullYear();
          const month = String(earliest.getMonth() + 1).padStart(2, "0");
          const day = String(earliest.getDate()).padStart(2, "0");
          finalExpiry = `${year}-${month}-${day}`;
        }
      }

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
        expiryDate: finalExpiry || null,
      });
      if (onRefresh) onRefresh();
      onClose();
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const visibleBatches = batches.filter((b: ProductBatch) => !deletedBatchIds.includes(b.id));
  const hasActiveBatches = visibleBatches.length > 0;

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
              onClearExpiry={() => {
                if (!hasActiveBatches) {
                  setFormData((prev: ProductFormState) => ({ ...prev, expiryDate: "" }));
                }
              }}
              onOpenBatchModal={() => setIsBatchModalVisible(true)}
              isExpiryReadOnly={hasActiveBatches}
              isStockReadOnly={true}
            />

            {/* Clean Ghost Batch Section */}
            <View style={styles.batchSection}>
              <View style={styles.batchHeaderRow}>
                <View style={{ flexDirection: "row", alignItems: "center", gap: 6 }}>
                  <Package size={14} color={BATCH_COLOR} />
                  <Text style={[styles.batchSectionTitle, typeface(font.semibold, "600")]}>
                    Active Batches ({visibleBatches.length})
                  </Text>
                </View>
              </View>

              {loadingBatches ? (
                <ActivityIndicator size="small" color={BATCH_COLOR} style={{ marginVertical: 10 }} />
              ) : visibleBatches.length === 0 ? (
                <Text style={[styles.batchDisplayEmpty, typeface(font.regular, "400")]}>
                  No active batches recorded. Stock is tracked directly.
                </Text>
              ) : (
                <View style={styles.batchList}>
                  {visibleBatches.map((b: ProductBatch) => {
                    const isExpired = b.expiryDate && new Date(b.expiryDate) < new Date();
                    return (
                      <View key={b.id} style={styles.batchRow}>
                        <View style={{ flex: 1, flexDirection: "row", alignItems: "center", gap: 10 }}>
                          <Text style={[styles.batchQty, typeface(font.bold, "700")]}>
                            {b.quantity} pcs
                          </Text>
                          <View style={{ flexDirection: "row", alignItems: "center", gap: 4 }}>
                            <Calendar size={12} color={MUTED} />
                            <Text style={[styles.batchDate, typeface(font.regular, "400")]}>
                              {b.expiryDate ? b.expiryDate.split("T")[0] : "No date"}
                            </Text>
                          </View>
                          {isExpired && (
                            <Text style={[styles.expiredTag, typeface(font.bold, "700")]}>EXPIRED</Text>
                          )}
                        </View>
                        <TouchableOpacity
                          onPress={() => handleStageDeleteBatch(b.id)}
                          style={styles.deleteBatchBtn}
                          hitSlop={8}
                        >
                          <Trash2 size={15} color={DANGER} />
                        </TouchableOpacity>
                      </View>
                    );
                  })}
                </View>
              )}
            </View>

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

      {product && (
        <AddProductBatchModal
          visible={isBatchModalVisible}
          productId={product.id}
          productName={product.name}
          onClose={() => setIsBatchModalVisible(false)}
          onSuccess={() => {
            fetchBatches(product.id, deletedBatchIds);
            if (onRefresh) onRefresh();
          }}
        />
      )}

      <DateWheelSheet
        visible={pickerOpen}
        value={formData.expiryDate ? new Date(formData.expiryDate) : new Date()}
        onCancel={() => setPickerOpen(false)}
        onConfirm={(date: Date) => {
          const year = date.getFullYear();
          const month = String(date.getMonth() + 1).padStart(2, "0");
          const day = String(date.getDate()).padStart(2, "0");
          setFormData((prev: ProductFormState) => ({ ...prev, expiryDate: `${year}-${month}-${day}` }));
          setPickerOpen(false);
        }}
      />
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: { flex: 1, justifyContent: "flex-end", backgroundColor: "rgba(15, 23, 42, 0.4)" },
  sheet: { backgroundColor: "#FAFBFD", borderTopLeftRadius: 24, borderTopRightRadius: 24, maxHeight: "92%" },
  header: { flexDirection: "row", alignItems: "center", paddingHorizontal: 22, paddingTop: 20, paddingBottom: 12 },
  identity: { flex: 1, marginRight: 12 },
  title: { fontSize: 20, color: INK, letterSpacing: -0.4 },
  subtitle: { marginTop: 3, fontSize: 13, color: MUTED },
  close: { width: 36, height: 36, alignItems: "center", justifyContent: "center" },
  body: { paddingHorizontal: 22, paddingBottom: 24, paddingTop: 8 },
  batchSection: { marginTop: 16, paddingTop: 8, borderTopWidth: 1, borderTopColor: "#E2E8F0" },
  batchHeaderRow: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginBottom: 8 },
  batchSectionTitle: { fontSize: 13, color: BATCH_COLOR },
  batchDisplayEmpty: { fontSize: 12, color: MUTED, paddingVertical: 4 },
  batchList: { gap: 4 },
  batchRow: { flexDirection: "row", alignItems: "center", paddingVertical: 8, paddingHorizontal: 4, borderBottomWidth: 1, borderBottomColor: "#F1F5F9" },
  batchQty: { fontSize: 14, color: INK },
  batchDate: { fontSize: 12, color: MUTED },
  expiredTag: { fontSize: 10, color: DANGER, backgroundColor: "#FFE4E6", paddingHorizontal: 4, paddingVertical: 1, borderRadius: 4 },
  deleteBatchBtn: { padding: 6 },
  submit: { marginTop: 24, height: 48, borderRadius: 14, backgroundColor: TINT, alignItems: "center", justifyContent: "center" },
  submitOff: { backgroundColor: "#CBD5E1" },
  submitText: { color: "#FFFFFF", fontSize: 16 },
});