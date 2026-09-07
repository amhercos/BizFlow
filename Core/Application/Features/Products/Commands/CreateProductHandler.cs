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
        var exists = await context.Products
            .AnyAsync(p => p.Name.ToLower() == request.Name.ToLower()
                        && p.StoreId == currentUserService.StoreId
                        && !p.IsDeleted, ct);

        if (exists)
        {
            throw new Exception($"A product with the name '{request.Name}' already exists.");
        }

        var product = new Product
        {
            Id = Guid.NewGuid(),
            Name = request.Name,
            Description = request.Description,
            Price = request.Price,
            PackPrice = request.PackPrice,
            PiecesPerPack = request.PiecesPerPack,
            Stock = request.StockQuantity,
            ExpiryDate = request.ExpiryDate,
            LowStockThreshold = 5,
            CategoryId = request.CategoryId,
            StoreId = currentUserService.StoreId,
            CreatedAt = DateTime.UtcNow
        };

        productRepository.Add(product);
        await context.SaveChangesAsync(ct);

        return product.Id;
    }
}