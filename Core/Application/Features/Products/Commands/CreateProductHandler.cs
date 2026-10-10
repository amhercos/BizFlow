using Application.Interfaces;
using Application.Interfaces.Repositories;
using Domain.Entities;
using MediatR;
using Microsoft.EntityFrameworkCore;

namespace Application.Features.Products.Commands;

public class CreateProductHandler(
    IProductRepository productRepository,
    IPosDbContext context,
    ICurrentUserService currentUserService) : IRequestHandler<CreateProductCommand, Guid>
{
    public async Task<Guid> Handle(CreateProductCommand request, CancellationToken ct)
    {
        var storeId = currentUserService.StoreId;
        var exists = await context.Products
            .AnyAsync(p => p.Name.ToLower() == request.Name.ToLower()
                        && p.StoreId == storeId
                        && !p.IsDeleted, ct);

        if (exists)
        {
            throw new Exception($"A product with the name '{request.Name}' already exists.");
        }

        var productId = Guid.NewGuid();
        var product = new Product
        {
            Id = productId,
            Name = request.Name,
            Description = request.Description,
            Price = request.Price,
            PackPrice = request.PackPrice,
            PiecesPerPack = request.PiecesPerPack,
            Stock = request.StockQuantity,
            ExpiryDate = request.ExpiryDate,
            LowStockThreshold = 5,
            CategoryId = request.CategoryId,
            StoreId = storeId,
            CreatedAt = DateTime.UtcNow
        };

        productRepository.Add(product);

        // --- FEFO ARCHITECTURE FIX: Auto-create initial batch if stock > 0 ---
        if (request.StockQuantity > 0)
        {
            var initialBatch = new ProductBatch
            {
                Id = Guid.NewGuid(),
                StoreId = storeId,
                ProductId = productId,
                Quantity = request.StockQuantity,
                ExpiryDate = request.ExpiryDate ?? DateTime.UtcNow.AddYears(1), // Default to 1 year if unspec
                IsDeleted = false
            };
            await productRepository.AddBatchAsync(initialBatch, ct);
        }
        // -------------------------------------------------------------------

        await context.SaveChangesAsync(ct);

        return product.Id;
    }
}