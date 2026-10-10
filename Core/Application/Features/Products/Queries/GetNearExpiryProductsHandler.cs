using Application.Dto;
using Application.Interfaces.Repositories;
using MediatR;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading;
using System.Threading.Tasks;

namespace Application.Features.Products.Queries
{
    public class GetNearExpiryProductsHandler(IProductRepository productRepository)
        : IRequestHandler<GetNearExpiryProductsQuery, List<NearExpiryProductDto>>
    {
        public async Task<List<NearExpiryProductDto>> Handle(GetNearExpiryProductsQuery request, CancellationToken ct)
        {
            // Default to 30 days alert threshold if store settings aren't queried directly here
            int alertDays = 30;
            var batches = await productRepository.GetNearExpiryBatchesAsync(request.StoreId, alertDays, ct);

            return batches.Select(b => new NearExpiryProductDto(
                b.Id,
                b.Product?.Name ?? "Unknown Product",
                b.Quantity,
                b.ExpiryDate,
                (b.ExpiryDate.ToDateTime(TimeOnly.MinValue) - DateTime.Today).Days
            )).ToList();
        }
    }
}