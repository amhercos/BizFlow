import { Filter, Search } from "lucide-react-native";
import React, { useMemo, useState } from "react";
import {
  FlatList,
  RefreshControl,
  Text,
  TextInput,
  TouchableOpacity,
  View,
  useWindowDimensions,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { useCredits } from "@/src/hooks/use-credits";
import { useInventory } from "@/src/hooks/use-inventory";
import { useSale } from "@/src/hooks/use-sale";
import { formatPHP } from "@/src/lib/math";
import { cn } from "@/src/lib/utils";

import { PaymentType, UnitType, type Product } from "@/src/types/sale";

import { TransactionContent } from "@/components/sales/TransactionContent";
import { TransactionModal } from "@/components/sales/TransactionModal";
import { UnitSelector } from "@/components/sales/UnitSelector";

export default function NewSalePage() {
  const insets = useSafeAreaInsets();
  const { width, height } = useWindowDimensions();
  const isTablet = useMemo(
    () => width >= 768 || (width > height && width > 600),
    [width, height],
  );

  const { products = [], refresh } = useInventory();
  const { credits } = useCredits();

  const {
    basket,
    totals,
    addToBasket,
    removeItem,
    updateQuantity,
    clearBasket,
    checkout,
    isSubmitting,
  } = useSale();

  const [search, setSearch] = useState("");
  const [categorySearch, setCategorySearch] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("All");

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [activePayment, setActivePayment] = useState<PaymentType>(
    PaymentType.Cash,
  );
  const [cashReceived, setCashReceived] = useState<number>(0);
  const [selectedCreditId, setSelectedCreditId] = useState("");
  const [isNewCustomer, setIsNewCustomer] = useState(false);
  const [newCustomerName, setNewCustomerName] = useState("");
  const [newCustomerContact, setNewCustomerContact] = useState("");

  const [selectedProductForUnit, setSelectedProductForUnit] =
    useState<Product | null>(null);

  const currentTotal =
    activePayment === PaymentType.Credit
      ? totals.creditTotal
      : totals.cashTotal;

  const normalizeProduct = (p: any): Product => {
    const packPrice = Number(p.packPrice ?? p.pricePerPack);
    const piecesPerPack = Number(p.piecesPerPack ?? p.itemsPerPack);

    return {
      id: p.id,
      name: p.name,
      price: p.price ?? p.pricePerPiece ?? 0,
      stock: p.stockQuantity ?? p.stockPieces ?? p.stock ?? 0,
      categoryName: p.categoryName || "Uncategorized",
      piecesPerPack:
        Number.isFinite(piecesPerPack) && piecesPerPack > 0 ? piecesPerPack : 1,
      packPrice: Number.isFinite(packPrice) && packPrice > 0 ? packPrice : 0,
      promotions: p.promotions,
    };
  };

  const handleProductPress = (rawProduct: any) => {
    const product = normalizeProduct(rawProduct);

    if (product.piecesPerPack > 1 && product.packPrice > 0) {
      setSelectedProductForUnit(product);
    } else {
      addToBasket(product, UnitType.Piece);
    }
  };

  const handleConfirmAddToCart = (product: Product, unit: UnitType) => {
    addToBasket(product, unit);
    setSelectedProductForUnit(null);
  };

  const handleCheckout = async () => {
    const success = await checkout({
      paymentType: activePayment,
      cashReceived: activePayment === PaymentType.Cash ? cashReceived : 0,
      customerCreditId:
        activePayment === PaymentType.Credit && !isNewCustomer
          ? selectedCreditId
          : undefined,
      newCustomerName: isNewCustomer ? newCustomerName : undefined,
      newCustomerContact: isNewCustomer ? newCustomerContact : undefined,
    });

    if (success) {
      setIsModalOpen(false);
      setCashReceived(0);
      setSelectedCreditId("");
      setIsNewCustomer(false);
      setNewCustomerName("");
      setNewCustomerContact("");
    }
  };

  const numColumns = useMemo(() => {
    if (!isTablet) return 2;
    return width > 1100 ? 4 : 3;
  }, [width, isTablet]);

  const sidebarWidth = useMemo(() => {
    if (!isTablet) return 0;
    return Math.min(Math.max(width * 0.35, 340), 450);
  }, [width, isTablet]);

  const columnWidth = useMemo(() => {
    const availableWidth = width - sidebarWidth - (isTablet ? 60 : 48);
    return availableWidth / numColumns;
  }, [width, sidebarWidth, numColumns, isTablet]);

  const filteredProducts = useMemo(() => {
    return products.filter((p: any) => {
      const matchesSearch = p.name.toLowerCase().includes(search.toLowerCase());
      const matchesCat =
        selectedCategory === "All" ||
        (p.categoryName || "Uncategorized") === selectedCategory;
      return matchesSearch && matchesCat;
    });
  }, [products, search, selectedCategory]);

  const categories = useMemo(() => {
    const uniqueCats = Array.from(
      new Set(products.map((p: any) => p.categoryName || "Uncategorized")),
    );
    return ["All", ...uniqueCats.sort()].filter((cat) =>
      cat.toLowerCase().includes(categorySearch.toLowerCase()),
    );
  }, [products, categorySearch]);

  const sharedProps = {
    basket,
    totals,
    activePayment,
    setActivePayment,
    cashReceived,
    setCashReceived,
    isSubmitting,
    handleCheckout,
    updateQuantity: (productId: string, unit: UnitType, nextQty: number) =>
      updateQuantity(productId, unit, nextQty),
    removeItem: (productId: string, unit: UnitType) =>
      removeItem(productId, unit),
    clearBasket,
    credits: credits || [],
    selectedCreditId,
    setSelectedCreditId,
    isNewCustomer,
    setIsNewCustomer,
    newCustomerName,
    setNewCustomerName,
    newCustomerContact,
    setNewCustomerContact,
    onClose: () => setIsModalOpen(false),
  };

  return (
    <View style={{ paddingTop: insets.top }} className="flex-1 bg-white">
      <View className="flex-1 flex-row">
        <View className="flex-1">
          <View className="px-5 py-4 border-b border-slate-50">
            <View className="flex-row items-center gap-2 mb-4">
              <View className="flex-1 flex-row items-center bg-slate-100 rounded-2xl px-4 h-12">
                <Search size={18} color="#94a3b8" />
                <TextInput
                  placeholder="Search items..."
                  value={search}
                  onChangeText={setSearch}
                  className="flex-1 ml-2 text-slate-900 font-bold"
                />
              </View>
              <View className="w-28 flex-row items-center bg-slate-50 rounded-2xl px-3 h-12 border border-slate-100">
                <Filter size={14} color="#cbd5e1" />
                <TextInput
                  placeholder="Filter..."
                  value={categorySearch}
                  onChangeText={setCategorySearch}
                  className="flex-1 ml-1 text-[10px] font-bold"
                />
              </View>
            </View>

            <FlatList
              horizontal
              showsHorizontalScrollIndicator={false}
              data={categories}
              keyExtractor={(item) => `cat-${item}`}
              renderItem={({ item }) => (
                <TouchableOpacity
                  onPress={() => setSelectedCategory(item)}
                  className={cn(
                    "px-5 py-2 rounded-full mr-2 h-9 justify-center",
                    selectedCategory === item ? "bg-slate-900" : "bg-slate-50",
                  )}
                >
                  <Text
                    className={cn(
                      "text-[10px] font-black uppercase",
                      selectedCategory === item
                        ? "text-white"
                        : "text-slate-400",
                    )}
                  >
                    {item}
                  </Text>
                </TouchableOpacity>
              )}
            />
          </View>

          <FlatList
            data={filteredProducts}
            key={`${numColumns}-grid`}
            numColumns={numColumns}
            columnWrapperStyle={{ gap: 16, paddingHorizontal: 20 }}
            contentContainerStyle={{ paddingTop: 20, paddingBottom: 100 }}
            renderItem={({ item }) => {
              const p = item as any;
              const stockQty = p.stockQuantity ?? p.stockPieces ?? p.stock ?? 0;
              const lowStock = p.lowStockThreshold ?? 5;
              const pricePiece = p.pricePerPiece ?? p.price ?? 0;
              const pricePack = p.pricePerPack ?? p.packPrice;
              const itemsPerPack = p.itemsPerPack ?? p.piecesPerPack;

              return (
                <TouchableOpacity
                  disabled={stockQty <= 0}
                  onPress={() => handleProductPress(p)}
                  style={{ width: columnWidth }}
                  className={cn(
                    "p-4 bg-white border border-slate-100 rounded-3xl mb-4 shadow-sm",
                    stockQty <= 0 && "opacity-40",
                  )}
                >
                  <View className="flex-row items-center gap-1.5 mb-2">
                    <View
                      className={cn(
                        "w-2 h-2 rounded-full",
                        stockQty <= lowStock ? "bg-rose-500" : "bg-emerald-500",
                      )}
                    />
                    <Text className="text-[10px] font-black text-slate-400 uppercase">
                      {stockQty} Left
                    </Text>
                  </View>
                  <Text
                    numberOfLines={2}
                    className="font-bold text-slate-800 text-[11px] uppercase h-8 leading-tight"
                  >
                    {p.name}
                  </Text>
                  <View className="mt-3 bg-slate-50 rounded-xl py-2 px-3">
                    <Text className="font-black text-slate-900 text-center text-xs">
                      {formatPHP(pricePiece)}/pc
                    </Text>
                    {pricePack && itemsPerPack > 1 && (
                      <Text className="text-[9px] font-bold text-slate-500 text-center mt-0.5">
                        {formatPHP(pricePack)}/{itemsPerPack}pk
                      </Text>
                    )}
                  </View>
                </TouchableOpacity>
              );
            }}
            refreshControl={
              <RefreshControl refreshing={false} onRefresh={refresh} />
            }
          />

          {!isTablet && basket.length > 0 && (
            <View className="absolute bottom-8 left-5 right-5">
              <TouchableOpacity
                onPress={() => setIsModalOpen(true)}
                className="bg-slate-900 h-16 rounded-3xl flex-row items-center justify-between px-6 shadow-xl"
              >
                <Text className="text-white font-black text-xs uppercase">
                  {basket.length} {basket.length === 1 ? "Item" : "Items"}
                </Text>
                <View
                  className={cn(
                    "px-4 py-2 rounded-2xl",
                    activePayment === PaymentType.Credit
                      ? "bg-slate-700"
                      : "bg-emerald-500",
                  )}
                >
                  <Text className="text-white font-black text-sm">
                    {formatPHP(currentTotal)}
                  </Text>
                </View>
              </TouchableOpacity>
            </View>
          )}
        </View>

        {isTablet && (
          <View
            style={{ width: sidebarWidth }}
            className="border-l border-slate-100 bg-white flex-col h-full"
          >
            <TransactionContent {...sharedProps} isTablet={true} />
          </View>
        )}
      </View>

      {!isTablet && <TransactionModal {...sharedProps} isOpen={isModalOpen} />}

      {selectedProductForUnit ? (
        <UnitSelector
          product={selectedProductForUnit}
          onClose={() => setSelectedProductForUnit(null)}
          onConfirm={handleConfirmAddToCart}
        />
      ) : null}
    </View>
  );
}
