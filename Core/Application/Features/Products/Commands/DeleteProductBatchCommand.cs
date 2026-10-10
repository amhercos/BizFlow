using Application.Interfaces;
using MediatR;
using Microsoft.EntityFrameworkCore;
using System;

namespace Application.Features.Products.Commands;

public record DeleteProductBatchCommand(Guid BatchId) : IRequest<bool>;

public class DeleteProductBatchCommandHandler(IPosDbContext context)
    : IRequestHandler<DeleteProductBatchCommand, bool>
{
    public async Task<bool> Handle(
        DeleteProductBatchCommand request,
        CancellationToken cancellationToken)
    {
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

        // Exclude the batch being deleted from the remaining stock.
        var remainingStock = await context.ProductBatches
            .Where(b => b.ProductId == batch.ProductId && b.Id != batch.Id)
            .SumAsync(b => (int?)b.Quantity, cancellationToken) ?? 0;

        batch.IsDeleted = true;
        product.Stock = remainingStock;

        await context.SaveChangesAsync(cancellationToken);
        return true;
    }
}