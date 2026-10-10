using Application.Features.Auth.Commands;
using Application.Interfaces;
using Application.Interfaces.Repositories;
using Domain.Entities;
using Domain.Entities.Enums;
using MediatR;
using Microsoft.AspNetCore.Identity;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Logging;

public class RegisterStoreOwnerHandler(
    UserManager<User> userManager,
    RoleManager<IdentityRole<Guid>> roleManager,
    IStoreRepository storeRepository,
    IPosDbContext context,
    ITenantConnectionStringBuilder connectionStringBuilder,
    IServiceProvider serviceProvider,
    ILogger<RegisterStoreOwnerHandler> logger
) : IRequestHandler<RegisterStoreOwnerCommand, bool>
{
    private const string DuplicateStoreNameConstraint = "IX_Stores_StoreName_Unique";

    public async Task<bool> Handle(RegisterStoreOwnerCommand request, CancellationToken ct)
    {
        var email = request.Email.Trim();
        var fullName = request.FullName.Trim();
        var businessName = request.BusinessName.Trim();
        var location = request.Location.Trim();

        // Fail fast with a readable message instead of a database error.
        if (await userManager.FindByEmailAsync(email) is not null)
        {
            throw new RegistrationException(
                "An account with this email already exists. Try logging in instead.", "email");
        }

        await context.BeginTransactionAsync(ct);

        try
        {
            var tenantConnectionString = connectionStringBuilder.Build(businessName);

            var store = new Store
            {
                Id = Guid.NewGuid(),
                Location = location,
                StoreName = businessName,
                ConnectionString = tenantConnectionString,
                CreatedAt = DateTime.UtcNow,
                IsActive = true,
                MigrationStatus = MigrationStatus.Pending
            };

            try
            {
                await storeRepository.AddAsync(store, ct);
                await context.SaveChangesAsync(ct);
            }
            catch (DbUpdateException ex) when (IsDuplicateStoreName(ex))
            {
                throw new RegistrationException(
                    $"A business named \"{businessName}\" is already registered. Please choose a different business name.",
                    "businessName");
            }

            var user = new User
            {
                Email = email,
                UserName = email,
                FullName = fullName,
                StoreId = store.Id,
                CreatedAt = DateTime.UtcNow
            };

            var result = await userManager.CreateAsync(user, request.Password);

            if (!result.Succeeded)
            {
                var codes = result.Errors.Select(e => e.Code).ToList();
                var field = codes.Any(c => c.StartsWith("Password", StringComparison.OrdinalIgnoreCase))
                    ? "password"
                    : codes.Any(c => c.Contains("Email", StringComparison.OrdinalIgnoreCase)
                                  || c.Contains("UserName", StringComparison.OrdinalIgnoreCase))
                        ? "email"
                        : null;

                throw new RegistrationException(
                    string.Join(" ", result.Errors.Select(e => e.Description)), field);
            }

            if (!await roleManager.RoleExistsAsync("StoreOwner"))
            {
                await roleManager.CreateAsync(new IdentityRole<Guid> { Name = "StoreOwner", NormalizedName = "STOREOWNER" });
            }

            var roleResult = await userManager.AddToRoleAsync(user, "StoreOwner");
            if (!roleResult.Succeeded)
            {
                throw new InvalidOperationException(
                    "Could not assign the StoreOwner role: " + string.Join("; ", roleResult.Errors.Select(e => e.Description)));
            }

            await context.CommitTransactionAsync(ct);

            _ = Task.Run(async () =>
            {
                try
                {
                    using var scope = serviceProvider.CreateScope();
                    var migrator = scope.ServiceProvider.GetRequiredService<ITenantMigrator>();
                    await migrator.MigrateTenantAsync(tenantConnectionString, CancellationToken.None);
                }
                catch (Exception ex)
                {
                    logger.LogError(ex, "Instant migration trigger failed for {StoreName}", businessName);
                }
            });

            return true;
        }
        catch (RegistrationException)
        {
            // Expected, user-fixable problem: roll back quietly and let the API report it.
            await context.RollbackTransactionAsync(ct);
            throw;
        }
        catch (Exception ex)
        {
            await context.RollbackTransactionAsync(ct);
            logger.LogError(ex, "Critical error during registration for {StoreName}", businessName);
            throw;
        }
    }

    private static bool IsDuplicateStoreName(DbUpdateException ex)
    {
        // Works for PostgreSQL ("duplicate key value violates unique constraint") and
        // SQL Server ("Cannot insert duplicate key ... unique index"), whatever the index is called.
        var message = ex.InnerException?.Message ?? ex.Message;
        var isUniqueViolation =
            message.Contains("duplicate key", StringComparison.OrdinalIgnoreCase) ||
            message.Contains("unique constraint", StringComparison.OrdinalIgnoreCase) ||
            message.Contains("unique index", StringComparison.OrdinalIgnoreCase);

        return isUniqueViolation &&
               (message.Contains("Store", StringComparison.OrdinalIgnoreCase));
    }
}