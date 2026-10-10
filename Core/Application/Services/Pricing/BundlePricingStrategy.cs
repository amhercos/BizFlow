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
            decimal originalTotal = Math.Round(itemQuantity * itemProduct.Price, 2, MidpointRounding.AwayFromZero);

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

            // 1. Required quantities per bundle set + the configured bundle price
            int mainRequiredQty = bundleTier.Quantity > 0 ? bundleTier.Quantity : 1;
            int tieUpRequiredQty = promo.TieUpQuantity is > 0 ? promo.TieUpQuantity.Value : 1;
            decimal fixedBundlePrice = bundleTier.Price;

            // 2. Find the partner line in the basket (paid, piece lines only: never a pack line or a free item)
            var paidPieceLines = basket.Where(i => !i.IsFree && i.UnitType == "Piece");

            var mainBasketItem = isMainProduct
                ? new { Quantity = itemQuantity, UnitPrice = itemProduct.Price }
                : paidPieceLines.Where(i => i.ProductId == promo.MainProductId)
                        .Select(i => new { i.Quantity, i.UnitPrice })
                        .FirstOrDefault();

            var tieUpBasketItem = isTieUpProduct
                ? new { Quantity = itemQuantity, UnitPrice = itemProduct.Price }
                : paidPieceLines.Where(i => i.ProductId == promo.TieUpProductId)
                        .Select(i => new { i.Quantity, i.UnitPrice })
                        .FirstOrDefault();

            if (mainBasketItem == null || tieUpBasketItem == null)
            {
                return originalTotal;
            }

            // 3. Complete bundles
            int completeBundles = Math.Min(
                mainBasketItem.Quantity / mainRequiredQty,
                tieUpBasketItem.Quantity / tieUpRequiredQty
            );

            if (completeBundles <= 0)
            {
                return originalTotal;
            }

            // 4. Standard cost of one bundle set
            decimal mainSetCost = mainRequiredQty * mainBasketItem.UnitPrice;
            decimal tieUpSetCost = tieUpRequiredQty * tieUpBasketItem.UnitPrice;
            decimal standardBundleCost = mainSetCost + tieUpSetCost;

            if (standardBundleCost <= 0 || standardBundleCost <= fixedBundlePrice)
            {
                return originalTotal;
            }

            // 5. EXACT allocation: the bundle sets cost exactly (bundles x configured price).
            //    The main line gets its proportional share rounded to the centavo; the tie-up line gets
            //    the remainder, so both lines always add up to the configured price with no stray decimals.
            decimal totalCharge = completeBundles * fixedBundlePrice;
            decimal mainCharge = Math.Round(totalCharge * mainSetCost / standardBundleCost, 2, MidpointRounding.AwayFromZero);
            decimal tieUpCharge = totalCharge - mainCharge;

            decimal setCostTotal = completeBundles * (isMainProduct ? mainSetCost : tieUpSetCost);
            decimal charge = isMainProduct ? mainCharge : tieUpCharge;

            return Math.Max(0m, originalTotal - setCostTotal + charge);
        }
    }
}