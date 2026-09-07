using Application.Dto;
using MediatR;

namespace Application.Features.Products.Commands
{
    public record UpdateProductCommand(
        Guid Id,
        string Name,
        decimal Price,
        decimal? PackPrice,
        int? PiecesPerPack,
        int Stock,
        int LowStockThreshold,
        Guid? CategoryId,
        string? Description,
        DateOnly? ExpiryDate
    ) : IRequest<ProductDto>;
}