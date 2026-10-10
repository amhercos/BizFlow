using MediatR;
using System;

namespace Application.Features.Products.Commands;

public record CreateProductBatchCommand(
    Guid ProductId,
    int Quantity,
    DateOnly ExpiryDate,
    Guid StoreId
) : IRequest<Guid>;