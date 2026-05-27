    using Application.Dto;
    using Application.Features.Promotions.Commands;
    using Application.Interfaces.Repositories;
    using Domain.Entities;
    using MediatR;

    namespace Application.Features.Promotions.Queries;

    public class GetPromotionsHandler(IPromotionRepository promotionRepo)
        : IRequestHandler<GetPromotionsQuery, IEnumerable<PromotionResponse>>
    {
        public async Task<IEnumerable<PromotionResponse>> Handle(GetPromotionsQuery request, CancellationToken ct)
        {
            var promotions = await promotionRepo.GetAllAsync(ct);

            return promotions.Select(p => new PromotionResponse
            {
                Id = p.Id,
                MainProductId = p.MainProductId,
                Name = p.Name,
                ProductName = p.MainProduct?.Name ?? "Unknown",
                OriginalPrice = p.MainProduct?.Price ?? 0,
                IsActive = p.IsActive,
                Type = p.Type,

                Tiers = p.Tiers
                    .Select(t => new PromoTierResponse(t.Quantity, t.Price))
                    .OrderBy(t => t.Quantity)
                    .ToList(),

                TieUpProductId = p.TieUpProductId,
                TieUpProductName = p.TieUpProduct?.Name,
                TieUpQuantity = p.TieUpQuantity
            });
        }
    }