using System;
using System.Threading;
using System.Threading.Tasks;

namespace Application.Interfaces
{
    public interface IInventoryDeductionService
    {
        Task DeductStockFefoAsync(Guid productId, Guid storeId, int quantityToDeduct, CancellationToken ct);
    }
}