import { apiClient } from "@/src/api/client";
import { roundTo } from "@/src/lib/math";
import {
  PaymentType,
  UnitType,
  type ApiError,
  type BasketItem,
  type CheckoutParams,
  type CreateTransactionCommand,
  type Product,
  type TransactionResponse,
} from "@/src/types/sale";
import { isAxiosError, type AxiosError } from "axios";
import { useCallback, useMemo, useState } from "react";
import { Alert } from "react-native";
import { usePromotions } from "./use-promotions";
import {
  calculateLineTotal,
  toAppliedPromotion,
  withLivePromotions,
} from "../utils/promotion-engine";

export function useSale() {
  const [basket, setBasket] = useState<BasketItem[]>([]);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const { promotions } = usePromotions();

  const pricedBasket = useMemo(
    () => basket.map((item) => withLivePromotions(item, promotions)),
    [basket, promotions],
  );

  const totals = useMemo(() => {
    let originalTotalAmount = 0;
    let cashDiscountedAmount = 0;
    const promoSavings = new Map<string, number>();

    pricedBasket.forEach((item) => {
      const lineCalculations = calculateLineTotal(item, pricedBasket);
      originalTotalAmount += lineCalculations.originalTotal;
      cashDiscountedAmount += lineCalculations.discountedTotal;

      if (lineCalculations.appliedPromotionName && lineCalculations.savings > 0) {
        const key = lineCalculations.appliedPromotionName;
        promoSavings.set(
          key,
          (promoSavings.get(key) ?? 0) + lineCalculations.savings,
        );
      }
    });

    const creditTotalAmount = pricedBasket.reduce(
      (acc, item) => acc + item.unitPrice * item.quantity,
      0,
    );

    return {
      originalTotal: roundTo(originalTotalAmount, 2),
      cashTotal: roundTo(cashDiscountedAmount, 2),
      creditTotal: roundTo(creditTotalAmount, 2),
      savings: roundTo(
        Math.max(0, originalTotalAmount - cashDiscountedAmount),
        2,
      ),
      promotionsApplied: Array.from(promoSavings, ([name, savings]) => ({
        name,
        savings: roundTo(savings, 2),
      })),
    };
  }, [pricedBasket]);

  const addToBasket = useCallback(
    (product: Product, unitType: UnitType = UnitType.Piece): void => {
      setBasket((prev) => {
        const existingIndex = prev.findIndex(
          (item) => item.productId === product.id && item.unitType === unitType,
        );

        const isPack = unitType === UnitType.Pack;
        const selectedUnitPrice = isPack ? product.packPrice : product.price;
        const multiplier =
          isPack && product.piecesPerPack > 0 ? product.piecesPerPack : 1;
        const requiredStock = 1 * multiplier;

        if (existingIndex > -1) {
          const existingItem = prev[existingIndex];
          const nextQty = existingItem.quantity + 1;
          const totalRequiredStock = nextQty * multiplier;

          if (totalRequiredStock > product.stock) {
            Alert.alert(
              "Stock Limit",
              `Only ${product.stock} base units available.`,
            );
            return prev;
          }

          const updated = [...prev];
          updated[existingIndex] = {
            ...existingItem,
            quantity: nextQty,
            unitPrice: selectedUnitPrice,
          };
          return updated;
        }

        if (requiredStock > product.stock) {
          Alert.alert("Stock Limit", `Not enough stock for a full pack.`);
          return prev;
        }

        return [
          ...prev,
          {
            productId: product.id,
            name: `${product.name} (${unitType})`,
            quantity: 1,
            unitPrice: selectedUnitPrice,
            stock: product.stock,
            unitType: unitType,
            piecesPerPack: product.piecesPerPack || 1,
            packPrice: product.packPrice || 0,
            retailPrice: product.price,
            promotions: (product.promotions ?? []).map(toAppliedPromotion),
          },
        ];
      });
    },
    [],
  );

  const removeItem = useCallback(
    (productId: string, unitType: UnitType): void => {
      setBasket((prev) =>
        prev.filter(
          (item) =>
            !(item.productId === productId && item.unitType === unitType),
        ),
      );
    },
    [],
  );

  const updateQuantity = useCallback(
    (productId: string, unitType: UnitType, nextQty: number): void => {
      setBasket((prev) =>
        prev.map((item) => {
          if (item.productId !== productId || item.unitType !== unitType)
            return item;

          const multiplier =
            item.unitType === UnitType.Pack ? item.piecesPerPack : 1;
          if (nextQty * multiplier > item.stock) {
            Alert.alert("Stock Limit", `Cannot exceed available stock limit.`);
            return item;
          }
          if (nextQty <= 0) return item;
          return { ...item, quantity: nextQty };
        }),
      );
    },
    [],
  );

  const clearBasket = useCallback((): void => setBasket([]), []);

  const checkout = async (params: CheckoutParams): Promise<boolean> => {
    if (basket.length === 0) return false;

    const isCredit = params.paymentType === PaymentType.Credit;
    const capturedTotal = isCredit ? totals.creditTotal : totals.cashTotal;
    const capturedCash = params.cashReceived ?? 0;

    if (!isCredit && capturedCash < capturedTotal) {
      Alert.alert(
        "Invalid Payment",
        `Cash received (${formatPHP(capturedCash)}) is less than the total (${formatPHP(capturedTotal)}).`,
      );
      return false;
    }

    setIsSubmitting(true);

    try {
      const command: CreateTransactionCommand = {
        items: pricedBasket.map((item) => {
          const isPack = item.unitType === UnitType.Pack;

          if (isCredit) {
            const subTotal = roundTo(item.unitPrice * item.quantity, 2);
            return {
              productId: item.productId,
              quantity: item.quantity,
              isPack,
              unitPrice: item.unitPrice,
              subTotal,
            };
          }

          const { discountedTotal } = calculateLineTotal(item, pricedBasket);
          return {
            productId: item.productId,
            quantity: item.quantity,
            isPack,
            unitPrice: roundTo(discountedTotal / item.quantity, 2),
            subTotal: roundTo(discountedTotal, 2),
          };
        }),
        paymentType: params.paymentType,
        totalAmount: capturedTotal,
        cashReceived: roundTo(capturedCash, 2),
        changeAmount: !isCredit
          ? roundTo(Math.max(0, capturedCash - capturedTotal), 2)
          : 0,
        customerCreditId: params.customerCreditId,
        newCustomerName: params.newCustomerName,
        newCustomerContact: params.newCustomerContact,
      };

      await apiClient.post<TransactionResponse>(
        "/Transactions/checkout",
        command,
      );
      Alert.alert("Success", "Transaction finalized successfully.");
      clearBasket();
      return true;
    } catch (err) {
      handleApiError(err);
      return false;
    } finally {
      setIsSubmitting(false);
    }
  };

  return {
    basket: pricedBasket,
    totals,
    addToBasket,
    removeItem,
    updateQuantity,
    clearBasket,
    checkout,
    isSubmitting,
  };
}

function formatPHP(amount: number): string {
  return `₱${amount.toLocaleString(undefined, { minimumFractionDigits: 2 })}`;
}

function handleApiError(err: unknown): void {
  let message = "An error occurred while processing the sale.";
  if (isAxiosError(err)) {
    const axiosError = err as AxiosError<ApiError>;
    message = axiosError.response?.data?.message || axiosError.message;
  }
  Alert.alert("Checkout Error", message);
}
