using Application.Features.Products.Commands;
using FluentValidation;

namespace Application.Features.Products.Validators;

public class UpdateProductCommandValidator : AbstractValidator<UpdateProductCommand>
{
    public UpdateProductCommandValidator()
    {
        RuleFor(v => v.Id)
            .NotEmpty().WithMessage("Product ID is required.");

        RuleFor(v => v.Name)
            .NotEmpty().WithMessage("Product name cannot be empty.")
            .MaximumLength(100).WithMessage("Name must not exceed 100 characters.");

        RuleFor(v => v.Price)
            .GreaterThanOrEqualTo(0).WithMessage("Price cannot be negative.");

        RuleFor(v => v.Stock)
            .GreaterThanOrEqualTo(0).WithMessage("Stock cannot be negative.");

        RuleFor(v => v.LowStockThreshold)
            .GreaterThanOrEqualTo(0).WithMessage("Low Stock Threshold cannot be negative.");

        RuleFor(v => v.CategoryId)
            .NotEmpty().WithMessage("A valid Category must be selected.");

        RuleFor(v => v.ExpiryDate)
            .Must(date => !date.HasValue || date.Value >= DateOnly.FromDateTime(DateTime.Now))
            .WithMessage("Expiry date cannot be in the past.");

        RuleFor(v => v.PackPrice)
            .GreaterThan(0).When(v => v.PackPrice.HasValue)
            .WithMessage("Pack price must be greater than 0.");

        RuleFor(v => v.PiecesPerPack)
            .GreaterThan(0).When(v => v.PiecesPerPack.HasValue)
            .WithMessage("Pieces per pack must be greater than 0.");
    }
}