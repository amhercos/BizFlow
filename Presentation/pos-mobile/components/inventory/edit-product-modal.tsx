import { cn } from "@/src/lib/utils";
import type {
  Category,
  Product,
  UpdateProductRequest,
} from "@/src/types/inventory";
import {
  isPackConfigValid,
  parseOptionalNumber,
} from "@/src/types/inventory";
import {
  Calendar,
  Check,
  FileText,
  PencilLine,
  Search,
  Tag,
  X,
} from "lucide-react-native";
import React, { useEffect, useMemo, useState } from "react";
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Modal,
  Platform,
  ScrollView,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import ScrollPicker from "react-native-wheel-scrollview-picker";

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
  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [isFocused, setIsFocused] = useState(false);

  const [isDatePickerVisible, setDatePickerVisibility] = useState(false);
  const [tempDate, setTempDate] = useState<Date>(new Date());

  const [formData, setFormData] = useState({
    name: "",
    price: "",
    packPrice: "",
    piecesPerPack: "",
    stockQuantity: "",
    categoryId: null as string | null,
    description: "",
    expiryDate: "",
  });

  // Date Logic for ScrollPicker
  const currentYear = tempDate.getFullYear();
  const currentMonth = tempDate.getMonth();
  const years = useMemo(
    () => Array.from({ length: 15 }, (_, i) => (2024 + i).toString()),
    [],
  );
  const months = [
    "Jan",
    "Feb",
    "Mar",
    "Apr",
    "May",
    "Jun",
    "Jul",
    "Aug",
    "Sep",
    "Oct",
    "Nov",
    "Dec",
  ];
  const days = useMemo(() => {
    const lastDay = new Date(currentYear, currentMonth + 1, 0).getDate();
    return Array.from({ length: lastDay }, (_, i) => (i + 1).toString());
  }, [currentYear, currentMonth]);

  // Pre-fill form when product changes
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
      setSearchQuery(product.categoryName || "");
      if (product.expiryDate) {
        setTempDate(new Date(product.expiryDate));
      }
    }
  }, [product, isOpen]);

  const filteredCategories = useMemo(() => {
    const query = searchQuery.toLowerCase().trim();
    return query
      ? categories.filter((c) => c.name.toLowerCase().includes(query))
      : categories.slice(0, 5);
  }, [categories, searchQuery]);

  const isValid = useMemo(
    () =>
      formData.name.trim().length >= 2 &&
      formData.price !== "" &&
      formData.stockQuantity !== "" &&
      isPackConfigValid(formData.packPrice, formData.piecesPerPack),
    [formData],
  );

  const handleConfirmDate = () => {
    const formattedDate = tempDate.toISOString().split("T")[0];
    setFormData({ ...formData, expiryDate: formattedDate });
    setDatePickerVisibility(false);
  };

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

  const labelClass =
    "text-[10px] font-bold uppercase tracking-widest text-slate-400 ml-1 mb-1.5";
  const inputClass =
    "bg-slate-50 border border-slate-100 rounded-xl px-4 py-3 text-sm font-bold text-slate-900";

  return (
    <Modal
      visible={isOpen}
      animationType="slide"
      transparent={true}
      onRequestClose={onClose}
    >
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        className="flex-1 justify-end bg-black/60"
      >
        <View className="bg-white rounded-t-[40px] max-h-[92%] shadow-2xl">
          {/* Header */}
          <View className="px-8 pt-8 pb-4 flex-row items-center justify-between">
            <View className="flex-row items-center gap-4">
              <View className="h-12 w-12 items-center justify-center rounded-2xl bg-blue-600 shadow-xl">
                <PencilLine size={24} color="white" />
              </View>
              <View>
                <Text className="text-xl font-black text-slate-900 tracking-tight">
                  Edit Product
                </Text>
                <Text className="text-[12px] font-medium text-slate-400">
                  Update item details
                </Text>
              </View>
            </View>
            <TouchableOpacity
              onPress={onClose}
              className="h-10 w-10 bg-slate-100 rounded-full items-center justify-center"
            >
              <X size={20} color="#64748b" />
            </TouchableOpacity>
          </View>

          <ScrollView
            className="px-8 py-4"
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
          >
            <View className="gap-y-6 pb-12">
              {/* Name */}
              <View>
                <Text className={labelClass}>Product Identity</Text>
                <TextInput
                  placeholder="Item Name"
                  className={inputClass}
                  value={formData.name}
                  onChangeText={(val) =>
                    setFormData({ ...formData, name: val })
                  }
                />
              </View>

              {/* Category Search */}
              <View className="z-50">
                <View className="flex-row justify-between items-center mb-1.5">
                  <Text className={labelClass}>Category</Text>
                  <TouchableOpacity onPress={onOpenCategoryManager}>
                    <Text className="text-[10px] font-bold text-blue-600">
                      Manage
                    </Text>
                  </TouchableOpacity>
                </View>
                <View className="relative">
                  <View className="absolute left-4 top-4 z-10">
                    <Search size={16} color="#94a3b8" />
                  </View>
                  <TextInput
                    placeholder="Search category..."
                    className={cn(inputClass, "pl-11 h-12")}
                    value={searchQuery}
                    onFocus={() => setIsFocused(true)}
                    onBlur={() => setTimeout(() => setIsFocused(false), 200)}
                    onChangeText={setSearchQuery}
                  />
                </View>

                {isFocused && (
                  <View className="absolute top-[80px] left-0 right-0 bg-white border border-slate-100 shadow-2xl rounded-2xl p-2 z-[100] max-h-48">
                    <ScrollView
                      bounces={false}
                      keyboardShouldPersistTaps="handled"
                    >
                      {filteredCategories.map((c) => (
                        <TouchableOpacity
                          key={c.id}
                          onPress={() => {
                            setFormData({ ...formData, categoryId: c.id });
                            setSearchQuery(c.name);
                            setIsFocused(false);
                          }}
                          className={cn(
                            "flex-row items-center justify-between px-4 py-3 rounded-xl",
                            formData.categoryId === c.id
                              ? "bg-slate-50"
                              : "bg-transparent",
                          )}
                        >
                          <View className="flex-row items-center gap-3">
                            <Tag
                              size={14}
                              color={
                                formData.categoryId === c.id
                                  ? "#2563eb"
                                  : "#94a3b8"
                              }
                            />
                            <Text
                              className={cn(
                                "text-sm font-bold",
                                formData.categoryId === c.id
                                  ? "text-blue-600"
                                  : "text-slate-700",
                              )}
                            >
                              {c.name}
                            </Text>
                          </View>
                          {formData.categoryId === c.id && (
                            <Check size={16} color="#2563eb" strokeWidth={3} />
                          )}
                        </TouchableOpacity>
                      ))}
                    </ScrollView>
                  </View>
                )}
              </View>

              {/* Price, stock, and optional pack */}
              <View className="flex-row gap-4">
                <View className="flex-1">
                  <Text className={labelClass}>Piece Price (₱)</Text>
                  <TextInput
                    keyboardType="numeric"
                    placeholder="0.00"
                    className={inputClass}
                    value={formData.price}
                    onChangeText={(val) =>
                      setFormData({ ...formData, price: val })
                    }
                  />
                </View>
                <View className="flex-1">
                  <Text className={labelClass}>Stock (pcs)</Text>
                  <TextInput
                    keyboardType="numeric"
                    placeholder="Qty"
                    className={inputClass}
                    value={formData.stockQuantity}
                    onChangeText={(val) =>
                      setFormData({ ...formData, stockQuantity: val })
                    }
                  />
                </View>
              </View>

              <View>
                <Text className={labelClass}>Pack selling (optional)</Text>
                <View className="flex-row gap-4">
                  <View className="flex-1">
                    <TextInput
                      keyboardType="numeric"
                      placeholder="Pack price"
                      className={inputClass}
                      value={formData.packPrice}
                      onChangeText={(val) =>
                        setFormData({ ...formData, packPrice: val })
                      }
                    />
                  </View>
                  <View className="flex-1">
                    <TextInput
                      keyboardType="numeric"
                      placeholder="Pcs / pack"
                      className={inputClass}
                      value={formData.piecesPerPack}
                      onChangeText={(val) =>
                        setFormData({ ...formData, piecesPerPack: val })
                      }
                    />
                  </View>
                </View>
                <Text className="text-[10px] font-semibold text-slate-400 mt-2 ml-1">
                  Fill both to sell this item by pack. Leave blank for piece
                  only.
                </Text>
              </View>

              {/* Expiry Date */}
              <View>
                <View className="flex-row justify-between items-center pr-1 mb-1.5">
                  <Text className={labelClass}>Expiration Date</Text>
                  {formData.expiryDate ? (
                    <TouchableOpacity
                      onPress={() =>
                        setFormData({ ...formData, expiryDate: "" })
                      }
                    >
                      <Text className="text-[10px] font-bold text-rose-500 uppercase">
                        Clear
                      </Text>
                    </TouchableOpacity>
                  ) : null}
                </View>
                <TouchableOpacity
                  onPress={() => setDatePickerVisibility(true)}
                  className={cn(
                    inputClass,
                    "flex-row justify-between items-center h-12",
                  )}
                >
                  <Text
                    className={cn(
                      "font-bold",
                      formData.expiryDate ? "text-slate-900" : "text-slate-400",
                    )}
                  >
                    {formData.expiryDate || "Set Expiry Date"}
                  </Text>
                  <Calendar size={18} color="#94a3b8" />
                </TouchableOpacity>
              </View>

              {/* Description Field */}
              <View>
                <Text className={labelClass}>Description (Optional)</Text>
                <View className="relative">
                  <View className="absolute left-4 top-4 z-10">
                    <FileText size={16} color="#94a3b8" />
                  </View>
                  <TextInput
                    multiline
                    numberOfLines={3}
                    placeholder="Provide details about the product..."
                    className={cn(inputClass, "pl-11 pt-3 h-24 text-left")}
                    style={{ textAlignVertical: "top" }}
                    value={formData.description}
                    onChangeText={(val) =>
                      setFormData({ ...formData, description: val })
                    }
                  />
                </View>
              </View>

              {/* Save Button */}
              <TouchableOpacity
                onPress={handleSubmit}
                disabled={loading || !isValid}
                className={cn(
                  "h-16 rounded-2xl items-center justify-center shadow-lg",
                  isValid ? "bg-blue-600 shadow-blue-100" : "bg-slate-200",
                )}
              >
                {loading ? (
                  <ActivityIndicator color="white" />
                ) : (
                  <Text className="text-white font-black text-lg">
                    Save Changes
                  </Text>
                )}
              </TouchableOpacity>
            </View>
          </ScrollView>
        </View>
      </KeyboardAvoidingView>

      {/* Wheel Date Picker Modal */}
      <Modal
        visible={isDatePickerVisible}
        transparent={true}
        animationType="fade"
      >
        <View className="flex-1 justify-end bg-black/50">
          <View className="bg-white rounded-t-[40px] pb-10 shadow-2xl">
            <View className="flex-row items-center justify-between px-8 py-6 border-b border-slate-50">
              <TouchableOpacity onPress={() => setDatePickerVisibility(false)}>
                <Text className="text-slate-400 font-bold uppercase text-[10px] tracking-widest">
                  Cancel
                </Text>
              </TouchableOpacity>
              <Text className="text-base font-black text-slate-900">
                SELECT DATE
              </Text>
              <TouchableOpacity onPress={handleConfirmDate}>
                <Text className="text-blue-600 font-bold uppercase text-[10px] tracking-widest">
                  Confirm
                </Text>
              </TouchableOpacity>
            </View>

            <View className="relative h-[280px] flex-row px-4 items-center justify-center bg-white">
              {/* Highlight Bar */}
              <View
                pointerEvents="none"
                className="absolute h-14 left-6 right-6 border-y border-slate-100 bg-slate-50/50 rounded-2xl"
                style={{ top: "50%", marginTop: -28 }}
              />

              <View className="flex-1">
                <ScrollPicker
                  dataSource={months}
                  selectedIndex={currentMonth}
                  onValueChange={(_, i) => {
                    const d = new Date(tempDate);
                    d.setMonth(i);
                    setTempDate(d);
                  }}
                  wrapperHeight={250}
                  itemHeight={50}
                  highlightColor="transparent"
                  renderItem={(item, index) => (
                    <Text
                      className={cn(
                        "text-lg font-bold text-center",
                        index === currentMonth
                          ? "text-slate-900"
                          : "text-slate-300",
                      )}
                    >
                      {item}
                    </Text>
                  )}
                />
              </View>
              <View className="flex-1">
                <ScrollPicker
                  dataSource={days}
                  selectedIndex={tempDate.getDate() - 1}
                  onValueChange={(v) => {
                    const d = new Date(tempDate);
                    d.setDate(parseInt(v || "1", 10));
                    setTempDate(d);
                  }}
                  wrapperHeight={250}
                  itemHeight={50}
                  highlightColor="transparent"
                  renderItem={(item, index) => (
                    <Text
                      className={cn(
                        "text-lg font-bold text-center",
                        index === tempDate.getDate() - 1
                          ? "text-slate-900"
                          : "text-slate-300",
                      )}
                    >
                      {item}
                    </Text>
                  )}
                />
              </View>
              <View className="flex-1">
                <ScrollPicker
                  dataSource={years}
                  selectedIndex={Math.max(
                    0,
                    years.indexOf(currentYear.toString()),
                  )}
                  onValueChange={(v) => {
                    const d = new Date(tempDate);
                    d.setFullYear(parseInt(v || "2024", 10));
                    setTempDate(d);
                  }}
                  wrapperHeight={250}
                  itemHeight={50}
                  highlightColor="transparent"
                  renderItem={(item, index) => (
                    <Text
                      className={cn(
                        "text-lg font-bold text-center",
                        index === years.indexOf(currentYear.toString())
                          ? "text-slate-900"
                          : "text-slate-300",
                      )}
                    >
                      {item}
                    </Text>
                  )}
                />
              </View>
            </View>
          </View>
        </View>
      </Modal>
    </Modal>
  );
}
