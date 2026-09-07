using MediatR;

namespace Application.Features.Products.Commands
{
    public record CreateProductCommand(
        string Name,
        decimal Price,
        decimal? PackPrice,
        int? PiecesPerPack,
        int StockQuantity,
        Guid? CategoryId,
        string? Description,
        DateOnly? ExpiryDate
    ) : IRequest<Guid>;
}