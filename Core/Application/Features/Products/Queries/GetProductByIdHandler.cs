using Application.Dto;
using Application.Interfaces.Repositories;
using MediatR;

namespace Application.Features.Products.Queries
{
    public class GetProductByIdHandler(IProductRepository productRepository) : IRequestHandler<GetProductByIdQuery, ProductDto>
    {
        public async Task<ProductDto> Handle(GetProductByIdQuery request, CancellationToken cancellationToken)
        {
            var product = await productRepository.GetByIdAsync(request.id, cancellationToken);
            if (product is null)
            {
                return null!;
            }

            return new ProductDto(
                product.Id,
                product.Name,
                product.Description,
                product.Price,
                product.PackPrice,
                product.PiecesPerPack,
                product.Stock,
                product.LowStockThreshold,
                product.Category?.CategoryName ?? "No Category",
                product.ExpiryDate,
                product.CategoryId,
                null
            );
        }
    }
}