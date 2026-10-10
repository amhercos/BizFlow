    using Application.Interfaces;
using Infrastructure.Services;
    using Application.Interfaces.Repositories;
    using Domain.Entities;
    using Infrastructure.Persistence;
    using Infrastructure.Repositories;
    using Infrastructure.Services;
    using Microsoft.AspNetCore.Identity;
    using Microsoft.EntityFrameworkCore;
    using Microsoft.Extensions.Configuration;
    using Microsoft.Extensions.DependencyInjection;

    namespace Infrastructure
    {
        public static class DependencyInjection
        {
            public static IServiceCollection AddInfrastructureServices(
                this IServiceCollection services,
                IConfiguration configuration)
            {


                services.AddIdentity<User, IdentityRole<Guid>>(options =>
                {
                    options.Password.RequireDigit = false;
                    options.Password.RequireLowercase = true;
                    options.Password.RequireUppercase = false;
                    options.Password.RequireNonAlphanumeric = false;
                    options.Password.RequiredLength = 8;
                    options.User.RequireUniqueEmail = true;
                })
                .AddEntityFrameworkStores<AppIdentityDbContext>()
                .AddDefaultTokenProviders();

                //  Register Services
                services.AddTransient<IJwtService, JwtService>();
                services.AddScoped<ICurrentUserService, CurrentUserService>();
                services.AddHttpContextAccessor();
                services.AddHostedService<StoreMigrationService>();
                services.AddScoped<ITenantConnectionStringBuilder, TenantConnectionStringBuilder>();


                // Register Repositories
                services.AddScoped<IStoreRepository, StoreRepository>();
                services.AddScoped<IUserRepository, UserRepository>();
                services.AddScoped<ICategoryRepository, CategoryRepository>();
                services.AddScoped<IProductRepository, ProductRepository>();
        services.AddScoped<IInventoryDeductionService, InventoryDeductionService>();
                services.AddScoped<ITransactionRepository, TransactionRepository>();
                services.AddScoped<ICustomerCreditRepository, CustomerCreditRepository>();
                services.AddScoped<IPromotionRepository, PromotionRepository>();
                services.AddScoped<IDashboardRepository, DashboardRepository>();
                services.AddScoped<IStoreSettingsRepository, StoreSettingsRepository>();


            return services;
            }
        }
    }