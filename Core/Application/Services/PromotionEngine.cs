using Application.Interfaces;
using Application.Interfaces.Repositories;
using Domain.Entities;
using Domain.Entities.Enums;
using System;
using System.Collections.Generic;
using System.Linq;

namespace Application.Services
{
    public class PromotionEngine : IPromotionEngine
    {
        private readonly Dictionary<PromotionType, IPricingStrategy> _strategyMap;

        public PromotionEngine(IEnumerable<IPricingStrategy> strategies)
        {
            _strategyMap = strategies.ToDictionary(s => s.Type);
        }

        // --- 1. Implement 3-parameter overload from interface ---
        public decimal CalculateLineTotal(Product product, int quantity, IEnumerable<TransactionItem> basket)
        {
            return CalculateLineTotal(
                product,
                quantity,
                basket,
                product.Promotions ?? Enumerable.Empty<Promotion>()
            );
        }

        // --- 2. 4-parameter overload ---
        public decimal CalculateLineTotal(
            Product product,
            int quantity,
            IEnumerable<TransactionItem> basket,
            IEnumerable<Promotion> activePromotions)
        {
            decimal originalTotal = product.Price * quantity;

            // Match promotion if product is either MainProduct OR TieUpProduct
            var promo = activePromotions
                .FirstOrDefault(p => p.IsActive
                                  && !p.IsDeleted
                                  && (p.MainProductId == product.Id || p.TieUpProductId == product.Id));

            if (promo == null || !_strategyMap.TryGetValue(promo.Type, out var strategy))
            {
                return Math.Round(originalTotal, 2, MidpointRounding.AwayFromZero);
            }

            try
            {
                var promoTotal = strategy.CalculateLineTotal(product, promo, quantity, basket);
                return Math.Round(Math.Min(promoTotal, originalTotal), 2, MidpointRounding.AwayFromZero);
            }
            catch
            {
                return Math.Round(originalTotal, 2, MidpointRounding.AwayFromZero);
            }
        }
    }
}