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

/** A basket line is identified by product + unit + whether it is a free item. */
function sameLine(
  item: BasketItem,
  productId: string,
  unitType: UnitType,
  isFree: boolean,
): boolean {
  return (
    item.productId === productId &&
    item.unitType === unitType &&
    !!item.isFree === isFree
  );
}

/** Pieces of a product already in the basket (paid + free, pieces + packs), optionally skipping one line. */
function piecesUsed(
  items: BasketItem[],
  productId: string,
  skip?: BasketItem,
): number {
  return items.reduce((sum, item) => {
    if (item.productId !== productId || item === skip) return sum;
    const multiplier =
      item.unitType === UnitType.Pack ? Math.max(item.piecesPerPack, 1) : 1;
    return sum + item.quantity * multiplier;
  }, 0);
}

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
    let creditTotalAmount = 0;
    let freebieCount = 0;
    let freebieValue = 0;
    const promoSavings = new Map<string, number>();

    pricedBasket.forEach((item) => {
      if (item.isFree) {
        freebieCount += item.quantity;
        freebieValue += item.unitPrice * item.quantity;
        return;
      }

      const lineCalculations = calculateLineTotal(item, pricedBasket);
      originalTotalAmount += lineCalculations.originalTotal;
      cashDiscountedAmount += lineCalculations.discountedTotal;
      creditTotalAmount += item.unitPrice * item.quantity;

      if (lineCalculations.appliedPromotionName && lineCalculations.savings > 0) {
        const key = lineCalculations.appliedPromotionName;
        promoSavings.set(
          key,
          (promoSavings.get(key) ?? 0) + lineCalculations.savings,
        );
      }
    });

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
      freebieCount,
      freebieValue: roundTo(freebieValue, 2),
    };
  }, [pricedBasket]);

  const addToBasket = useCallback(
    (
      product: Product,
      unitType: UnitType = UnitType.Piece,
      quantity: number = 1,
    ): void => {
      const addQty = Math.max(1, Math.floor(quantity));

      setBasket((prev) => {
        const existingIndex = prev.findIndex((item) =>
          sameLine(item, product.id, unitType, false),
        );
        const existing = existingIndex > -1 ? prev[existingIndex] : undefined;

        const isPack = unitType === UnitType.Pack;
        const selectedUnitPrice = isPack ? product.packPrice : product.price;
        const multiplier =
          isPack && product.piecesPerPack > 0 ? product.piecesPerPack : 1;

        const nextQty = (existing?.quantity ?? 0) + addQty;
        const requiredPieces =
          piecesUsed(prev, product.id, existing) + nextQty * multiplier;

        if (requiredPieces > product.stock) {
          Alert.alert(
            "Stock Limit",
            `Only ${product.stock} base units available.`,
          );
          return prev;
        }

        if (existing) {
          const updated = [...prev];
          updated[existingIndex] = {
            ...existing,
            quantity: nextQty,
            unitPrice: selectedUnitPrice,
          };
          return updated;
        }

        return [
          ...prev,
          {
            productId: product.id,
            name: `${product.name} (${unitType})`,
            quantity: addQty,
            unitPrice: selectedUnitPrice,
            stock: product.stock,
            unitType: unitType,
            piecesPerPack: product.piecesPerPack || 1,
            packPrice: product.packPrice || 0,
            retailPrice: product.price,
            isFree: false,
            promotions: (product.promotions ?? []).map(toAppliedPromotion),
          },
        ];
      });
    },
    [],
  );

  const removeItem = useCallback(
    (productId: string, unitType: UnitType, isFree: boolean = false): void => {
      setBasket((prev) =>
        prev.filter((item) => !sameLine(item, productId, unitType, isFree)),
      );
    },
    [],
  );

  const updateQuantity = useCallback(
    (
      productId: string,
      unitType: UnitType,
      nextQty: number,
      isFree: boolean = false,
    ): void => {
      setBasket((prev) => {
        const target = prev.find((item) =>
          sameLine(item, productId, unitType, isFree),
        );
        if (!target || nextQty <= 0) return prev;

        const multiplier =
          unitType === UnitType.Pack ? Math.max(target.piecesPerPack, 1) : 1;
        if (
          piecesUsed(prev, productId, target) + nextQty * multiplier >
          target.stock
        ) {
          Alert.alert("Stock Limit", `Cannot exceed available stock limit.`);
          return prev;
        }

        return prev.map((item) =>
          item === target ? { ...item, quantity: nextQty } : item,
        );
      });
    },
    [],
  );

  /** Mark a line as a freebie (or undo it). Merges with the matching line if one exists. */
  const toggleFree = useCallback(
    (productId: string, unitType: UnitType, currentlyFree: boolean): void => {
      setBasket((prev) => {
        const source = prev.find((item) =>
          sameLine(item, productId, unitType, currentlyFree),
        );
        if (!source) return prev;

        const target = prev.find((item) =>
          sameLine(item, productId, unitType, !currentlyFree),
        );

        if (target) {
          return prev
            .filter((item) => item !== source)
            .map((item) =>
              item === target
                ? { ...item, quantity: item.quantity + source.quantity }
                : item,
            );
        }

        return prev.map((item) =>
          item === source ? { ...item, isFree: !currentlyFree } : item,
        );
      });
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

          if (item.isFree) {
            return {
              productId: item.productId,
              quantity: item.quantity,
              isPack,
              unitPrice: 0,
              subTotal: 0,
              isFree: true,
            };
          }

          if (isCredit) {
            const subTotal = roundTo(item.unitPrice * item.quantity, 2);
            return {
              productId: item.productId,
              quantity: item.quantity,
              isPack,
              unitPrice: item.unitPrice,
              subTotal,
              isFree: false,
            };
          }

          const { discountedTotal } = calculateLineTotal(item, pricedBasket);
          return {
            productId: item.productId,
            quantity: item.quantity,
            isPack,
            unitPrice: roundTo(discountedTotal / item.quantity, 2),
            subTotal: roundTo(discountedTotal, 2),
            isFree: false,
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
    toggleFree,
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