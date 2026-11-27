using System.Text;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.AspNetCore.Identity;
using Microsoft.EntityFrameworkCore;
using Microsoft.IdentityModel.Tokens;
using Microsoft.OpenApi;
using RetailHub.Api.Configurations;
using RetailHub.Api.Data;
using RetailHub.Api.Entities;
using RetailHub.Api.Middleware;
using RetailHub.Api.Repositories;
using RetailHub.Api.Repositories.Interfaces;
using RetailHub.Api.Services.Auth;
using RetailHub.Api.Services.Catalog;
using RetailHub.Api.Services.Interfaces;
using RetailHub.Api.Services.Inventory;
using RetailHub.Api.Services.Orders;
using Scalar.AspNetCore;

var builder = WebApplication.CreateBuilder(args);

var connectionString = builder.Configuration.GetConnectionString("DefaultConnection");
if (string.IsNullOrWhiteSpace(connectionString))
{
    throw new InvalidOperationException(
        "Missing required configuration key 'ConnectionStrings:DefaultConnection'. Configure it via .NET User Secrets or environment variables.");
}

builder.Services.Configure<JwtOptions>(builder.Configuration.GetSection(JwtOptions.SectionName));
builder.Services.Configure<SeedAdminOptions>(builder.Configuration.GetSection(SeedAdminOptions.SectionName));

var jwtOptions = builder.Configuration.GetSection(JwtOptions.SectionName).Get<JwtOptions>() ?? new JwtOptions();
var seedAdminOptions = builder.Configuration.GetSection(SeedAdminOptions.SectionName).Get<SeedAdminOptions>() ?? new SeedAdminOptions();

if (!EF.IsDesignTime)
{
    var missingOrInvalidKeys = new List<string>();

    if (string.IsNullOrWhiteSpace(jwtOptions.Key) || Encoding.UTF8.GetByteCount(jwtOptions.Key) < 32)
    {
        missingOrInvalidKeys.Add("Jwt:Key (must be at least 32 UTF-8 bytes)");
    }

    if (string.IsNullOrWhiteSpace(jwtOptions.Issuer))
    {
        missingOrInvalidKeys.Add("Jwt:Issuer");
    }

    if (string.IsNullOrWhiteSpace(jwtOptions.Audience))
    {
        missingOrInvalidKeys.Add("Jwt:Audience");
    }

    if (jwtOptions.ExpiresInMinutes <= 0)
    {
        missingOrInvalidKeys.Add("Jwt:ExpiresInMinutes (must be > 0)");
    }

    if (string.IsNullOrWhiteSpace(seedAdminOptions.Email))
    {
        missingOrInvalidKeys.Add("SeedAdmin:Email");
    }

    if (string.IsNullOrWhiteSpace(seedAdminOptions.Password))
    {
        missingOrInvalidKeys.Add("SeedAdmin:Password");
    }

    if (missingOrInvalidKeys.Count > 0)
    {
        throw new InvalidOperationException(
            $"Missing or invalid required configuration key(s): {string.Join(", ", missingOrInvalidKeys)}. Configure them via .NET User Secrets or environment variables.");
    }
}

builder.Services.AddDbContext<ApplicationDbContext>(options =>
    options.UseSqlServer(connectionString));

builder.Services
    .AddIdentity<ApplicationUser, IdentityRole>(options =>
    {
        options.User.RequireUniqueEmail = true;
        options.Password.RequiredLength = 8;
        options.Password.RequireDigit = true;
        options.Password.RequireUppercase = false;
        options.Password.RequireLowercase = false;
        options.Password.RequireNonAlphanumeric = false;
    })
    .AddEntityFrameworkStores<ApplicationDbContext>()
    .AddDefaultTokenProviders();

var authBuilder = builder.Services.AddAuthentication(options =>
{
    options.DefaultAuthenticateScheme = JwtBearerDefaults.AuthenticationScheme;
    options.DefaultChallengeScheme = JwtBearerDefaults.AuthenticationScheme;
});

if (!string.IsNullOrWhiteSpace(jwtOptions.Key))
{
    authBuilder.AddJwtBearer(options =>
    {
        options.TokenValidationParameters = new TokenValidationParameters
        {
            ValidateIssuer = true,
            ValidateAudience = true,
            ValidateLifetime = true,
            ValidateIssuerSigningKey = true,
            ValidIssuer = jwtOptions.Issuer,
            ValidAudience = jwtOptions.Audience,
            IssuerSigningKey = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(jwtOptions.Key)),
            ClockSkew = TimeSpan.FromMinutes(1)
        };
    });
}
else
{
    authBuilder.AddJwtBearer();
}

builder.Services.AddAuthorization();

var allowedOrigins = builder.Configuration.GetSection("Cors:AllowedOrigins").Get<string[]>()
    ?? new[] { "http://localhost:4200" };

builder.Services.AddCors(options =>
{
    options.AddPolicy("FrontendCors", policy =>
    {
        policy.WithOrigins(allowedOrigins)
            .AllowAnyHeader()
            .AllowAnyMethod();
    });
});

builder.Services.AddScoped<IProductRepository, ProductRepository>();
builder.Services.AddScoped<ICategoryRepository, CategoryRepository>();
builder.Services.AddScoped<IBrandRepository, BrandRepository>();
builder.Services.AddScoped<IOrderRepository, OrderRepository>();

builder.Services.AddScoped<IAuthService, AuthService>();
builder.Services.AddScoped<IProductService, ProductService>();
builder.Services.AddScoped<ICategoryService, CategoryService>();
builder.Services.AddScoped<IBrandService, BrandService>();
builder.Services.AddScoped<IInventoryService, InventoryService>();
builder.Services.AddScoped<IOrderService, OrderService>();

builder.Services.AddControllers();
builder.Services.AddOpenApi("v1", options =>
{
    options.AddDocumentTransformer((document, context, cancellationToken) =>
    {
        document.Components ??= new OpenApiComponents();
        document.Components.SecuritySchemes ??= new Dictionary<string, IOpenApiSecurityScheme>();
        document.Components.SecuritySchemes["Bearer"] = new OpenApiSecurityScheme
        {
            Type = SecuritySchemeType.Http,
            Scheme = "bearer",
            BearerFormat = "JWT",
            In = ParameterLocation.Header,
            Name = "Authorization",
            Description = "Enter JWT Bearer token."
        };

        document.Security ??= new List<OpenApiSecurityRequirement>();
        document.Security.Add(new OpenApiSecurityRequirement
        {
            [new OpenApiSecuritySchemeReference("Bearer", document)] = new List<string>()
        });

        return Task.CompletedTask;
    });
});

var app = builder.Build();

app.UseMiddleware<ExceptionHandlingMiddleware>();

if (!EF.IsDesignTime)
{
    await IdentitySeeder.SeedAsync(app.Services);
}

if (app.Environment.IsDevelopment())
{
    app.MapOpenApi();
    app.MapScalarApiReference(options =>
    {
        options.WithTitle("RetailHub API")
            .AddPreferredSecuritySchemes("Bearer");
    });
}

app.UseCors("FrontendCors");
if (!app.Environment.IsDevelopment())
{
    app.UseHttpsRedirection();
}
app.UseAuthentication();
app.UseAuthorization();
app.MapControllers();

app.Run();
