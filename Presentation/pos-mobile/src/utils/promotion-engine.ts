import type { Promotion, PromotionTier } from "../types/promotion";
import type { AppliedPromotion, BasketItem } from "../types/sale";
import { UnitType } from "../types/sale";

interface LineCalculation {
  discountedTotal: number;
  originalTotal: number;
  savings: number;
  appliedPromotionName: string | null;
}

/**
 * Rounds numbers to 2 decimal places to prevent floating point inaccuracies.
 */
function round2(value: number): number {
  return Math.round((value + Number.EPSILON) * 100) / 100;
}

/** Whole centavos: promo math is done in integers so totals never drift. */
function toCents(value: number): number {
  return Math.round((Number(value) || 0) * 100);
}

export function resolvePromoType(promo: {
  promotionType?: string | number;
  type?: string | number;
}): string {
  const raw = promo.promotionType ?? promo.type ?? "";
  if (raw === 1 || raw === "1") return "bulk";
  if (raw === 2 || raw === "2") return "bundle";
  if (raw === 3 || raw === "3") return "discount";
  return String(raw).toLowerCase();
}

function isPromoActive(promo: { isActive?: boolean }): boolean {
  return promo.isActive === true;
}

export function toAppliedPromotion(
  promo: Promotion | AppliedPromotion | any,
): AppliedPromotion {
  return {
    id: String(promo.id ?? ""),
    name: promo.name ?? "",
    isActive: isPromoActive(promo),
    promotionType: resolvePromoType(promo),
    mainProductId: promo.mainProductId ?? null,
    tiers: (promo.tiers ?? []).map((tier: PromotionTier) => ({
      quantity: Number(tier.quantity) || 0,
      price: Number(tier.price) || 0,
    })),
    tieUpProductId: promo.tieUpProductId ?? null,
    tieUpProductName: promo.tieUpProductName ?? null,
    tieUpQuantity: promo.tieUpQuantity ?? 1,
  };
}

export function promotionsForProduct(
  productId: string,
  catalog: Promotion[],
): AppliedPromotion[] {
  return catalog
    .filter(
      (promo) =>
        (promo.mainProductId === productId ||
          promo.tieUpProductId === productId) &&
        promo.isDeleted !== true &&
        isPromoActive(promo),
    )
    .map(toAppliedPromotion);
}

export function withLivePromotions(
  item: BasketItem,
  catalog: Promotion[],
): BasketItem {
  if (item.unitType === UnitType.Pack) {
    return { ...item, promotions: [] };
  }

  if (catalog.length === 0) {
    return {
      ...item,
      promotions: (item.promotions ?? []).map(toAppliedPromotion),
    };
  }

  return {
    ...item,
    promotions: promotionsForProduct(item.productId, catalog),
  };
}

export function calculateLineTotal(
  item: BasketItem,
  fullBasket: BasketItem[],
): LineCalculation {
  // Free items are given away: they cost nothing and are not part of the sale.
  if (item.isFree) {
    return {
      discountedTotal: 0,
      originalTotal: 0,
      savings: 0,
      appliedPromotionName: null,
    };
  }

  const originalTotal = round2(item.unitPrice * item.quantity);
  const unchanged: LineCalculation = {
    discountedTotal: originalTotal,
    originalTotal,
    savings: 0,
    appliedPromotionName: null,
  };

  if (
    item.unitType === UnitType.Pack ||
    !item.promotions ||
    item.promotions.length === 0
  ) {
    return unchanged;
  }

  const promo = item.promotions.find((entry) => isPromoActive(entry));
  if (!promo || !promo.tiers || promo.tiers.length === 0) {
    return unchanged;
  }

  const strategyType = resolvePromoType(promo);

  // --- DISCOUNT STRATEGY ---
  if (strategyType === "discount") {
    const sortedTiers = [...promo.tiers].sort(
      (a, b) => a.quantity - b.quantity,
    );
    const discountTier = sortedTiers[0];
    const minQty = discountTier?.quantity || 1;

    if (item.quantity < minQty) {
      return unchanged;
    }

    const targetUnitPrice = discountTier ? discountTier.price : item.unitPrice;
    const discountedTotal = round2(item.quantity * targetUnitPrice);
    const savings = round2(Math.max(0, originalTotal - discountedTotal));

    return {
      discountedTotal,
      originalTotal,
      savings,
      appliedPromotionName: promo.name,
    };
  }

  // --- BUNDLE STRATEGY (exact to the centavo, mirrors the backend) ---
  if (
    strategyType === "bundle" &&
    (promo.tieUpProductId || promo.mainProductId)
  ) {
    const bundleTier = [...promo.tiers].sort(
      (a, b) => a.quantity - b.quantity,
    )[0];
    if (!bundleTier) return unchanged;

    const mainProductId = promo.mainProductId;
    const tieUpProductId = promo.tieUpProductId;

    const isMainProduct = item.productId === mainProductId;
    const isTieUpProduct = item.productId === tieUpProductId;
    if (!isMainProduct && !isTieUpProduct) return unchanged;

    const mainRequiredQty = bundleTier.quantity > 0 ? bundleTier.quantity : 1;
    const tieUpRequiredQty = promo.tieUpQuantity || 1;

    // Partner line: paid piece lines only (never a pack line or a free item)
    const findPartnerLine = (productId?: string | null) =>
      fullBasket.find(
        (entry) =>
          entry.productId === productId &&
          entry.unitType !== UnitType.Pack &&
          !entry.isFree,
      );

    const mainItem = isMainProduct ? item : findPartnerLine(mainProductId);
    const tieUpItem = isTieUpProduct ? item : findPartnerLine(tieUpProductId);
    if (!mainItem || !tieUpItem) return unchanged;

    const bundles = Math.min(
      Math.floor(mainItem.quantity / mainRequiredQty),
      Math.floor(tieUpItem.quantity / tieUpRequiredQty),
    );
    if (bundles <= 0) return unchanged;

    const mainSetC = mainRequiredQty * toCents(mainItem.unitPrice);
    const tieUpSetC = tieUpRequiredQty * toCents(tieUpItem.unitPrice);
    const standardC = mainSetC + tieUpSetC;
    const bundlePriceC = toCents(bundleTier.price);
    if (standardC <= 0 || standardC <= bundlePriceC) return unchanged;

    // The bundle sets cost exactly (bundles x configured price). The main line takes its
    // proportional share rounded to the centavo; the tie-up line takes the remainder.
    const totalChargeC = bundles * bundlePriceC;
    const mainChargeC = Math.floor(
      (2 * totalChargeC * mainSetC + standardC) / (2 * standardC),
    );
    const tieUpChargeC = totalChargeC - mainChargeC;

    const lineOriginalC = toCents(item.unitPrice) * item.quantity;
    const setCostC = bundles * (isMainProduct ? mainSetC : tieUpSetC);
    const chargeC = isMainProduct ? mainChargeC : tieUpChargeC;

    const discountedC = Math.min(
      lineOriginalC,
      Math.max(0, lineOriginalC - setCostC + chargeC),
    );
    const savingsC = lineOriginalC - discountedC;

    return {
      discountedTotal: discountedC / 100,
      originalTotal: lineOriginalC / 100,
      savings: savingsC / 100,
      appliedPromotionName: savingsC > 0 ? promo.name : null,
    };
  }

  // --- BULK STRATEGY ---
  if (strategyType === "bulk") {
    let total = 0;
    let remainingQuantity = item.quantity;

    const sortedTiers = [...promo.tiers].sort(
      (a, b) => b.quantity - a.quantity,
    );

    for (const tier of sortedTiers) {
      if (tier.quantity > 0 && remainingQuantity >= tier.quantity) {
        const numberOfPacks = Math.floor(remainingQuantity / tier.quantity);
        total += numberOfPacks * tier.price;
        remainingQuantity %= tier.quantity;
      }
    }

    total += remainingQuantity * item.unitPrice;
    const discountedTotal = round2(total);
    const savings = round2(Math.max(0, originalTotal - discountedTotal));

    return {
      discountedTotal,
      originalTotal,
      savings,
      appliedPromotionName: discountedTotal < originalTotal ? promo.name : null,
    };
  }

  return unchanged;
}