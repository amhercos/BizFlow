using System;
using System.Collections.Generic;

namespace Application.Dto;

public record RecentTransactionDto(
    Guid Id,
    DateTime TransactionDate,
    decimal TotalAmount,
    string PaymentType,
    int ItemCount,
    List<TransactionItemDto>? Items = null);