import { DrawerMenuButton } from "@/components/navigation/DrawerMenuButton";
import { ProductCard } from "@/components/sales/ProductCard";
import { TransactionContent } from "@/components/sales/TransactionContent";
import { TransactionModal } from "@/components/sales/TransactionModal";
import { UnitSelector } from "@/components/sales/UnitSelector";
import { useCredits } from "@/src/hooks/use-credits";
import { useInventory } from "@/src/hooks/use-inventory";
import { useSale } from "@/src/hooks/use-sale";
import { formatPHP } from "@/src/lib/math";
import { typeface, useInter } from "@/src/theme/typography";
import { PaymentType, UnitType, type Product } from "@/src/types/sale";
import { toAppliedPromotion } from "@/src/utils/promotion-engine";
import * as Haptics from "expo-haptics";
import { useFocusEffect } from "expo-router";
import {
  Check,
  ChevronRight,
  Search,
  SlidersHorizontal,
  X,
} from "lucide-react-native";
import React, { useCallback, useMemo, useState } from "react";
import {
  FlatList,
  LayoutChangeEvent,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
  useWindowDimensions,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

const INK = "#0F172A";
const MUTED = "#64748B";
const TINT = "#2563EB";
const PAD = 22;
const GAP = 12;

export default function NewSalePage() {
  const insets = useSafeAreaInsets();
  const font = useInter();
  const { width, height } = useWindowDimensions();
  const isTablet = useMemo(
    () => width >= 768 || (width > height && width > 600),
    [width, height],
  );

  const { products = [], refresh } = useInventory();
  const { credits, fetchCredits } = useCredits();

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
  const [categoryQuery, setCategoryQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("All");
  const [filterOpen, setFilterOpen] = useState(false);
  const [catalogWidth, setCatalogWidth] = useState(0);
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

  useFocusEffect(
    useCallback(() => {
      void fetchCredits(undefined, false, true);
    }, [fetchCredits]),
  );

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
        Number.isFinite(piecesPerPack) && piecesPerPack > 1 ? piecesPerPack : 1,
      packPrice: Number.isFinite(packPrice) && packPrice > 0 ? packPrice : 0,
      promotions: (p.promotions ?? []).map(toAppliedPromotion),
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
      void fetchCredits(undefined, false, true);
    }
  };

  const pickCategory = (category: string) => {
    setSelectedCategory(category);
    setFilterOpen(false);
    setCategoryQuery("");
    void Haptics.selectionAsync();
  };

  const numColumns = useMemo(() => {
    if (!isTablet) return 2;
    return width > 1100 ? 4 : 3;
  }, [width, isTablet]);

  const sidebarWidth = useMemo(() => {
    if (!isTablet) return 0;
    return Math.min(Math.max(width * 0.34, 320), 420);
  }, [width, isTablet]);

  const cardWidth = useMemo(() => {
    if (catalogWidth <= 0) return 0;
    return (catalogWidth - PAD * 2 - GAP * (numColumns - 1)) / numColumns;
  }, [catalogWidth, numColumns]);

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
    return ["All", ...uniqueCats.sort()];
  }, [products]);

  const visibleCategories = useMemo(() => {
    const query = categoryQuery.trim().toLowerCase();
    if (!query) return categories;
    return categories.filter((cat) => cat.toLowerCase().includes(query));
  }, [categories, categoryQuery]);

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
    <View style={[styles.screen, { paddingTop: insets.top + 10 }]}>
      <View style={styles.shell}>
        <View
          style={styles.catalog}
          onLayout={(event: LayoutChangeEvent) =>
            setCatalogWidth(event.nativeEvent.layout.width)
          }
        >
          <View style={styles.top}>
            <DrawerMenuButton />
            <View style={styles.search}>
              <Search size={16} color="#94A3B8" strokeWidth={2} />
              <TextInput
                placeholder="Search items"
                placeholderTextColor="#94A3B8"
                value={search}
                onChangeText={setSearch}
                style={[styles.searchInput, typeface(font.medium, "500")]}
              />
              {search.length > 0 ? (
                <Pressable onPress={() => setSearch("")} hitSlop={8}>
                  <X size={14} color="#94A3B8" />
                </Pressable>
              ) : null}
            </View>
            <TouchableOpacity
              onPress={() => setFilterOpen((open) => !open)}
              style={[
                styles.filterBtn,
                (filterOpen || selectedCategory !== "All") &&
                  styles.filterBtnOn,
              ]}
              accessibilityLabel="Filter by category"
            >
              <SlidersHorizontal
                size={18}
                color={
                  filterOpen || selectedCategory !== "All" ? "#FFFFFF" : INK
                }
                strokeWidth={2}
              />
            </TouchableOpacity>
          </View>

          <View style={styles.chipBar}>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              style={styles.chipScroll}
              contentContainerStyle={styles.chipRow}
            >
              {categories.map((item) => {
                const active = selectedCategory === item;
                return (
                  <Pressable
                    key={item}
                    onPress={() => pickCategory(item)}
                    style={[styles.chip, active && styles.chipOn]}
                  >
                    <Text
                      style={[
                        styles.chipText,
                        active && styles.chipTextOn,
                        typeface(font.medium, "500"),
                      ]}
                    >
                      {item}
                    </Text>
                  </Pressable>
                );
              })}
            </ScrollView>
          </View>

          {filterOpen ? (
            <View style={styles.filterPanel}>
              <View style={styles.filterSearch}>
                <Search size={14} color="#94A3B8" />
                <TextInput
                  autoFocus
                  placeholder="Find a category"
                  placeholderTextColor="#94A3B8"
                  value={categoryQuery}
                  onChangeText={setCategoryQuery}
                  style={[styles.filterInput, typeface(font.medium, "500")]}
                />
              </View>
              <ScrollView
                keyboardShouldPersistTaps="handled"
                style={styles.filterList}
              >
                {visibleCategories.length === 0 ? (
                  <Text style={[styles.empty, typeface(font.regular, "400")]}>
                    No matching category
                  </Text>
                ) : (
                  visibleCategories.map((item, index) => {
                    const active = selectedCategory === item;
                    return (
                      <View key={item}>
                        {index > 0 ? <View style={styles.hairline} /> : null}
                        <Pressable
                          onPress={() => pickCategory(item)}
                          style={styles.filterRow}
                        >
                          <Text
                            style={[
                              styles.filterName,
                              active && styles.filterNameOn,
                              typeface(font.medium, "500"),
                            ]}
                          >
                            {item}
                          </Text>
                          {active ? <Check size={16} color={TINT} /> : null}
                        </Pressable>
                      </View>
                    );
                  })
                )}
              </ScrollView>
            </View>
          ) : null}

          <FlatList
            data={filteredProducts}
            key={`${numColumns}-grid`}
            numColumns={numColumns}
            style={styles.grid}
            columnWrapperStyle={numColumns > 1 ? styles.columns : undefined}
            contentContainerStyle={[
              styles.gridContent,
              basket.length > 0 && !isTablet
                ? styles.gridContentWithCart
                : styles.gridContentOpen,
            ]}
            keyboardShouldPersistTaps="handled"
            ListEmptyComponent={
              <Text style={[styles.empty, typeface(font.regular, "400")]}>
                No items match
              </Text>
            }
            renderItem={({ item }) => {
              const p = item as any;
              const stockQty = p.stockQuantity ?? p.stockPieces ?? p.stock ?? 0;
              const lowStock = p.lowStockThreshold ?? 5;
              const pricePiece = p.pricePerPiece ?? p.price ?? 0;
              const pricePack = p.pricePerPack ?? p.packPrice;
              const itemsPerPack = p.itemsPerPack ?? p.piecesPerPack;
              const out = stockQty <= 0;

              return (
                <ProductCard
                  name={p.name}
                  pricePiece={pricePiece}
                  stockQty={stockQty}
                  lowStock={lowStock}
                  pricePack={pricePack}
                  itemsPerPack={itemsPerPack}
                  width={cardWidth}
                  disabled={out}
                  onPress={() => handleProductPress(p)}
                />
              );
            }}
            refreshControl={
              <RefreshControl
                refreshing={false}
                onRefresh={refresh}
                tintColor={TINT}
              />
            }
          />

          {!isTablet && basket.length > 0 ? (
            <View style={styles.cartDock}>
              <TouchableOpacity
                onPress={() => {
                  void fetchCredits(undefined, false, true);
                  setIsModalOpen(true);
                }}
                style={styles.cart}
                activeOpacity={0.9}
              >
                <View>
                  <Text
                    style={[styles.cartLabel, typeface(font.medium, "500")]}
                  >
                    View checkout
                  </Text>
                  <Text
                    style={[styles.cartCount, typeface(font.semibold, "600")]}
                  >
                    {basket.length} {basket.length === 1 ? "item" : "items"}
                  </Text>
                </View>
                <View style={styles.cartEnd}>
                  <Text style={[styles.cartTotal, typeface(font.bold, "700")]}>
                    {formatPHP(currentTotal)}
                  </Text>
                  <ChevronRight size={18} color="#FFFFFF" strokeWidth={2.4} />
                </View>
              </TouchableOpacity>
            </View>
          ) : null}
        </View>

        {isTablet ? (
          <View style={[styles.sidebar, { width: sidebarWidth }]}>
            <TransactionContent {...sharedProps} isTablet={true} />
          </View>
        ) : null}
      </View>

      {!isTablet ? (
        <TransactionModal {...sharedProps} isOpen={isModalOpen} />
      ) : null}

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

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: "#FAFBFD",
  },
  shell: {
    flex: 1,
    flexDirection: "row",
  },
  catalog: {
    flex: 1,
  },
  top: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: PAD,
    gap: 10,
    marginBottom: 14,
  },
  search: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#EEF1F6",
    borderRadius: 14,
    paddingHorizontal: 14,
    height: 44,
  },
  searchInput: {
    flex: 1,
    marginLeft: 8,
    fontSize: 14,
    color: INK,
    paddingVertical: 0,
  },
  filterBtn: {
    width: 44,
    height: 44,
    borderRadius: 14,
    backgroundColor: "#EEF1F6",
    alignItems: "center",
    justifyContent: "center",
  },
  filterBtnOn: {
    backgroundColor: TINT,
  },
  chipBar: {
    height: 40,
    marginBottom: 14,
  },
  chipScroll: {
    flexGrow: 0,
  },
  chipRow: {
    paddingHorizontal: PAD,
    alignItems: "center",
    gap: 8,
  },
  chip: {
    paddingHorizontal: 14,
    height: 34,
    borderRadius: 999,
    backgroundColor: "#EEF1F6",
    justifyContent: "center",
  },
  chipOn: {
    backgroundColor: TINT,
  },
  chipText: {
    fontSize: 13,
    color: INK,
  },
  chipTextOn: {
    color: "#FFFFFF",
  },
  filterPanel: {
    marginHorizontal: PAD,
    marginBottom: 12,
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    paddingHorizontal: 14,
    paddingTop: 12,
    paddingBottom: 8,
    maxHeight: 240,
    zIndex: 4,
  },
  filterSearch: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#EEF1F6",
    borderRadius: 12,
    paddingHorizontal: 10,
    height: 36,
    marginBottom: 4,
    gap: 8,
  },
  filterInput: {
    flex: 1,
    fontSize: 14,
    color: INK,
    paddingVertical: 0,
  },
  filterList: {
    maxHeight: 180,
  },
  filterRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: 11,
  },
  filterName: {
    fontSize: 15,
    color: INK,
  },
  filterNameOn: {
    color: TINT,
  },
  hairline: {
    height: StyleSheet.hairlineWidth,
    backgroundColor: "rgba(15, 23, 42, 0.08)",
  },
  grid: {
    flex: 1,
  },
  gridContent: {
    paddingHorizontal: PAD,
  },
  gridContentOpen: {
    paddingBottom: 48,
  },
  gridContentWithCart: {
    paddingBottom: 16,
  },
  columns: {
    gap: GAP,
  },
  empty: {
    paddingVertical: 20,
    fontSize: 14,
    color: MUTED,
  },
  cartDock: {
    paddingHorizontal: PAD,
    paddingTop: 10,
    paddingBottom: 12,
  },
  cart: {
    minHeight: 56,
    borderRadius: 16,
    backgroundColor: TINT,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 18,
    paddingVertical: 10,
  },
  cartLabel: {
    color: "rgba(255, 255, 255, 0.78)",
    fontSize: 12,
  },
  cartCount: {
    color: "#FFFFFF",
    fontSize: 14,
    marginTop: 1,
  },
  cartEnd: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  cartTotal: {
    color: "#FFFFFF",
    fontSize: 17,
    fontVariant: ["tabular-nums"],
  },
  sidebar: {
    borderLeftWidth: StyleSheet.hairlineWidth,
    borderLeftColor: "rgba(15, 23, 42, 0.08)",
    backgroundColor: "#FAFBFD",
  },
});
