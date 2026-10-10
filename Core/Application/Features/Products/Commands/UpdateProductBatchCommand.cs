using Application.Interfaces;
using MediatR;
using Microsoft.EntityFrameworkCore;
using System;

namespace Application.Features.Products.Commands;

public record UpdateProductBatchCommand(
    Guid BatchId,
    int Quantity,
    DateOnly? ExpiryDate
) : IRequest<bool>;

public class UpdateProductBatchCommandHandler(IPosDbContext context)
    : IRequestHandler<UpdateProductBatchCommand, bool>
{
    public async Task<bool> Handle(
        UpdateProductBatchCommand request,
        CancellationToken cancellationToken)
    {
        if (request.Quantity < 0)
            return false;

        var batch = await context.ProductBatches
            .FirstOrDefaultAsync(
                b => b.Id == request.BatchId,
                cancellationToken);

        if (batch == null)
            return false;

        var product = await context.Products
            .FirstOrDefaultAsync(
                p => p.Id == batch.ProductId,
                cancellationToken);

        if (product == null)
            return false;

        // Sum the other active batches; the current batch is updated below.
        var otherStock = await context.ProductBatches
            .Where(b => b.ProductId == batch.ProductId && b.Id != batch.Id)
            .SumAsync(b => (int?)b.Quantity, cancellationToken) ?? 0;

        batch.Quantity = request.Quantity;

        if (request.ExpiryDate.HasValue)
            batch.ExpiryDate = request.ExpiryDate.Value;

        product.Stock = otherStock + request.Quantity;

        await context.SaveChangesAsync(cancellationToken);
        return true;
    }
}