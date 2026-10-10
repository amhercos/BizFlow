using Application.Interfaces;
using Application.Interfaces.Repositories;
using Domain.Entities;
using MediatR;
using System;
using System.Collections.Generic;
using System.Threading;
using System.Threading.Tasks;

namespace Application.Features.Products.Commands;

public class CreateProductBatchHandler(
    IProductRepository productRepository,
    IPosDbContext context) : IRequestHandler<CreateProductBatchCommand, Guid>
{
    public async Task<Guid> Handle(CreateProductBatchCommand request, CancellationToken ct)
    {
        var product = await productRepository.GetByIdAsync(request.ProductId, ct)
            ?? throw new KeyNotFoundException($"Product with ID {request.ProductId} was not found.");

        var batch = new ProductBatch
        {
            Id = Guid.NewGuid(),
            StoreId = request.StoreId,
            ProductId = request.ProductId,
            Quantity = request.Quantity,
            ExpiryDate = request.ExpiryDate,
            IsDeleted = false
        };

        await productRepository.AddBatchAsync(batch, ct);

        // Update aggregate stock on the product
        product.Stock += request.Quantity;
        productRepository.Update(product);

        await context.SaveChangesAsync(ct);

        return batch.Id;
    }
}