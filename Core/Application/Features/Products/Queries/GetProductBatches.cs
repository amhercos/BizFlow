using Application.Interfaces;
using Domain.Entities;
using MediatR;
using Microsoft.EntityFrameworkCore;

namespace Application.Features.Products.Queries;

public record GetProductBatchesQuery(Guid ProductId) : IRequest<IEnumerable<ProductBatch>>;

public class GetProductBatchesQueryHandler(IPosDbContext context)
    : IRequestHandler<GetProductBatchesQuery, IEnumerable<ProductBatch>>
{
    public async Task<IEnumerable<ProductBatch>> Handle(
        GetProductBatchesQuery request,
        CancellationToken cancellationToken)
    {
        return await context.ProductBatches
            .Where(b => b.ProductId == request.ProductId)
            .OrderBy(b => b.ExpiryDate)
            .ToListAsync(cancellationToken);
    }
}