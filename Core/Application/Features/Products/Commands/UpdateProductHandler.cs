using Application.Dto;
using Application.Features.Products.Commands;
using Application.Interfaces;
using Application.Interfaces.Repositories;
using Domain.Entities;
using MediatR;
using Microsoft.EntityFrameworkCore;

namespace Application.Features.Products.Handlers;

public class UpdateProductHandler(
    IProductRepository productRepository,
    IPosDbContext context) : IRequestHandler<UpdateProductCommand, ProductDto>
{
    public async Task<ProductDto> Handle(UpdateProductCommand request, CancellationToken ct)
    {
        var product = await productRepository.GetByIdAsync(request.Id, ct);

        if (product == null)
            throw new Exception($"Product with ID {request.Id} not found.");

        product.Name = request.Name;
        product.Description = request.Description;
        product.Price = request.Price;
        product.PackPrice = request.PackPrice;
        product.PiecesPerPack = request.PiecesPerPack;
        product.LowStockThreshold = request.LowStockThreshold;
        product.CategoryId = request.CategoryId;
        product.ExpiryDate = request.ExpiryDate;

        // --- FEFO ARCHITECTURE FIX: Reconcile stock & batches ---
        var stockDifference = request.Stock - product.Stock;
        product.Stock = request.Stock;

        if (stockDifference != 0)
        {
            var activeBatches = await context.ProductBatches
                .Where(b => b.ProductId == product.Id && !b.IsDeleted)
                .OrderBy(b => b.ExpiryDate)
                .ToListAsync(ct);

            if (stockDifference > 0)
            {
                // Add positive stock adjustment to the earliest or create a new general batch
                var targetBatch = activeBatches.FirstOrDefault();
                if (targetBatch != null)
                {
                    targetBatch.Quantity += stockDifference;
                    context.ProductBatches.Update(targetBatch);
                }
                else
                {
                    var newBatch = new ProductBatch
                    {
                        Id = Guid.NewGuid(),
                        StoreId = product.StoreId,
                        ProductId = product.Id,
                        Quantity = stockDifference,
                        ExpiryDate = request.ExpiryDate ?? DateTime.UtcNow.AddYears(1),
                        IsDeleted = false
                    };
                    await productRepository.AddBatchAsync(newBatch, ct);
                }
            }
            else if (stockDifference < 0)
            {
                // Deduct negative stock adjustment across active batches (FEFO style)
                int remainingReduction = Math.Abs(stockDifference);
                foreach (var batch in activeBatches)
                {
                    if (remainingReduction <= 0) break;
                    int deduct = Math.Min(batch.Quantity, remainingReduction);
                    batch.Quantity -= deduct;
                    remainingReduction -= deduct;
                    context.ProductBatches.Update(batch);
                }
            }
        }
        // --------------------------------------------------------

        productRepository.Update(product);
        await context.SaveChangesAsync(ct);

        var updatedProduct = await productRepository.GetByIdAsync(product.Id, ct);

        return new ProductDto(
            updatedProduct!.Id,
            updatedProduct.Name,
            updatedProduct.Description,
            updatedProduct.Price,
            updatedProduct.PackPrice,
            updatedProduct.PiecesPerPack,
            updatedProduct.Stock,
            updatedProduct.LowStockThreshold,
            updatedProduct.Category?.CategoryName ?? "General",
            updatedProduct.ExpiryDate,
            updatedProduct.CategoryId,
            null
        );
    }
}