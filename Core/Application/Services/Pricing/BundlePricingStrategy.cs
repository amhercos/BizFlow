using Application.Interfaces.Repositories;
using Domain.Entities;
using Domain.Entities.Enums;
using System;
using System.Collections.Generic;
using System.Linq;

namespace Application.Services.Pricing
{
    public class BundlePricingStrategy : IPricingStrategy
    {
        public PromotionType Type => PromotionType.Bundle;

        public decimal CalculateLineTotal(Product itemProduct, Promotion promo, int itemQuantity, IEnumerable<TransactionItem> basket)
        {
            decimal originalTotal = itemQuantity * itemProduct.Price;

            if (!promo.IsActive || promo.TieUpProductId == null || promo.Tiers == null || !promo.Tiers.Any())
            {
                return originalTotal;
            }

            var bundleTier = promo.Tiers.OrderBy(t => t.Quantity).FirstOrDefault();
            if (bundleTier == null) return originalTotal;

            bool isMainProduct = itemProduct.Id == promo.MainProductId;
            bool isTieUpProduct = itemProduct.Id == promo.TieUpProductId;

            if (!isMainProduct && !isTieUpProduct)
            {
                return originalTotal;
            }

            // 1. Define required quantities per bundle set
            int mainRequiredQty = bundleTier.Quantity > 0 ? bundleTier.Quantity : 1;
            int tieUpRequiredQty = promo.TieUpQuantity is > 0 ? promo.TieUpQuantity.Value : 1;
            decimal fixedBundlePrice = bundleTier.Price;

            // 2. Fetch both main and tie-up items from the basket
            var mainBasketItem = isMainProduct
                ? new { Quantity = itemQuantity, UnitPrice = itemProduct.Price }
                : basket.Where(i => i.ProductId == promo.MainProductId)
                        .Select(i => new { i.Quantity, i.UnitPrice })
                        .FirstOrDefault();

            var tieUpBasketItem = isTieUpProduct
                ? new { Quantity = itemQuantity, UnitPrice = itemProduct.Price }
                : basket.Where(i => i.ProductId == promo.TieUpProductId)
                        .Select(i => new { i.Quantity, i.UnitPrice })
                        .FirstOrDefault();

            if (mainBasketItem == null || tieUpBasketItem == null)
            {
                return originalTotal;
            }

            // 3. Determine maximum complete bundles
            int completeBundles = Math.Min(
                mainBasketItem.Quantity / mainRequiredQty,
                tieUpBasketItem.Quantity / tieUpRequiredQty
            );

            if (completeBundles <= 0)
            {
                return originalTotal;
            }

            // 4. Calculate standard un-discounted cost of 1 bundle set
            decimal mainSetCost = mainRequiredQty * mainBasketItem.UnitPrice;
            decimal tieUpSetCost = tieUpRequiredQty * tieUpBasketItem.UnitPrice;
            decimal standardBundleCost = mainSetCost + tieUpSetCost;

            if (standardBundleCost <= fixedBundlePrice)
            {
                return originalTotal;
            }

            // 5. Total discount saved per bundle set
            decimal totalDiscountPerBundle = standardBundleCost - fixedBundlePrice;

            // 6. Calculate THIS line item's proportional share of the discount
            decimal currentItemSetCost = isMainProduct ? mainSetCost : tieUpSetCost;
            decimal currentDiscountShareRatio = currentItemSetCost / standardBundleCost;
            decimal currentDiscountPerBundle = totalDiscountPerBundle * currentDiscountShareRatio;

            // 7. Apply discount for all completed bundle sets
            decimal totalLineDiscount = currentDiscountPerBundle * completeBundles;

            return Math.Max(0, originalTotal - totalLineDiscount);
        }
    }
}