using Application.Dto;
using Application.Features.Products.Commands;
using Application.Interfaces;
using Application.Interfaces.Repositories;
using MediatR;

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
        product.Stock = request.Stock;
        product.LowStockThreshold = request.LowStockThreshold;
        product.CategoryId = request.CategoryId;
        product.ExpiryDate = request.ExpiryDate;

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