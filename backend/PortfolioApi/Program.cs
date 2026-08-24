using System.ComponentModel.DataAnnotations;
using System.Text;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Infrastructure;
using Microsoft.EntityFrameworkCore.Storage;
using Microsoft.IdentityModel.Tokens;
using PortfolioApi.Auth;
using PortfolioApi.Data;
using PortfolioApi.Endpoints;
using PortfolioApi.Models;

var builder = WebApplication.CreateBuilder(args);

// Railway (and most PaaS) inject the listening port via the PORT env var.
var port = Environment.GetEnvironmentVariable("PORT");
if (!string.IsNullOrWhiteSpace(port))
{
    builder.WebHost.UseUrls($"http://0.0.0.0:{port}");
}

const string FrontendCors = "frontend";
// Extra allowed origins can be supplied via CORS_ORIGINS (comma-separated) for a
// split frontend/backend deployment. When the frontend is served from this same
// service (single-service deploy) CORS is not needed at all, but stays harmless.
var extraOrigins = (Environment.GetEnvironmentVariable("CORS_ORIGINS") ?? string.Empty)
    .Split(',', StringSplitOptions.RemoveEmptyEntries | StringSplitOptions.TrimEntries);
builder.Services.AddCors(options =>
{
    options.AddPolicy(FrontendCors, policy =>
        policy.WithOrigins(
                new[]
                {
                    "http://localhost:5173",
                    "http://localhost:5181",
                    "http://localhost:4173",
                }.Concat(extraOrigins).ToArray())
            .AllowAnyHeader()
            .AllowAnyMethod()
            .AllowCredentials());
});

builder.Services.AddPortfolioDatabase(builder.Configuration);
builder.Services.AddSingleton<TokenService>();

// Admin Hub SSO: hub-ticket validator + single-use replay guard.
builder.Services.AddMemoryCache();
builder.Services.AddSingleton<SsoService>();

var tokenSettings = new TokenService(builder.Configuration);
builder.Services.AddAuthentication(JwtBearerDefaults.AuthenticationScheme)
    .AddJwtBearer(options =>
    {
        options.TokenValidationParameters = new TokenValidationParameters
        {
            ValidateIssuer = true,
            ValidateAudience = true,
            ValidateLifetime = true,
            ValidateIssuerSigningKey = true,
            ValidIssuer = TokenService.Issuer,
            ValidAudience = TokenService.Audience,
            IssuerSigningKey = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(tokenSettings.SigningKey)),
        };

        // Fall back to the httpOnly admin_token cookie when there's no Authorization
        // header. The SSO consume flow drops the cookie via a redirect, so the admin
        // is authenticated without the SPA re-attaching a Bearer header.
        options.Events = new JwtBearerEvents
        {
            OnMessageReceived = ctx =>
            {
                if (string.IsNullOrEmpty(ctx.Token) &&
                    ctx.Request.Cookies.TryGetValue("admin_token", out var cookie))
                    ctx.Token = cookie;
                return Task.CompletedTask;
            }
        };
    });
builder.Services.AddAuthorization();

var app = builder.Build();

using (var scope = app.Services.CreateScope())
{
    var db = scope.ServiceProvider.GetRequiredService<PortfolioDbContext>();

    if (db.Database.IsNpgsql())
    {
        // Postgres (Railway): apply EF Core migrations so the schema is created
        // deterministically and tracked in __EFMigrationsHistory. An earlier
        // EnsureCreated()-based boot (or an interrupted schema creation) can leave
        // tables with no migrations history, which would make Migrate() fail with
        // "already exists". Because there is no real data until the app first boots
        // successfully, clear such a legacy/partial schema exactly once so
        // migrations can apply from a clean slate. After the first successful
        // Migrate(), the history table exists and this block never runs again.
        var creator = db.Database.GetService<IRelationalDatabaseCreator>();
        if (!db.Database.GetAppliedMigrations().Any() && creator.HasTables())
        {
            db.Database.ExecuteSqlRaw("DROP SCHEMA public CASCADE; CREATE SCHEMA public;");
        }

        db.Database.Migrate();
    }
    else
    {
        // Local dev (SQLite): the model has no provider-specific migrations, so
        // create the schema directly from the model.
        db.Database.EnsureCreated();
    }

    PortfolioSeeder.Seed(db);
}

app.UseCors(FrontendCors);
// Serve the built frontend (copied into wwwroot at deploy time) plus uploaded images.
app.UseDefaultFiles();
app.UseStaticFiles();
app.UseAuthentication();
app.UseAuthorization();

var api = app.MapGroup("/api");

// ---- Auth ----
api.MapPost("/auth/login", (LoginRequest request, TokenService tokens) =>
{
    if (string.IsNullOrEmpty(request.Password) || request.Password != tokens.AdminPassword)
        return Results.Unauthorized();
    return Results.Ok(new { token = tokens.CreateToken() });
});

// ---- Admin Hub SSO consume ----
// Consumes a single-use hub ticket and, on success, drops the portfolio's own admin
// session as an httpOnly cookie (the same Bearer JWT the JwtBearer handler reads).
// Single shared admin, so a valid hub ticket for this audience is sufficient.
api.MapGet("/admin/sso/consume", (string? token, SsoService sso, TokenService tokens, HttpContext ctx, ILoggerFactory lf) =>
{
    var log = lf.CreateLogger("AdminSso");
    var appBase = (Environment.GetEnvironmentVariable("ADMIN_APP_URL") ?? "").TrimEnd('/');
    var loginUrl = string.IsNullOrEmpty(appBase) ? "/admin/login" : $"{appBase}/admin/login";
    var adminUrl = string.IsNullOrEmpty(appBase) ? "/admin" : $"{appBase}/admin";

    var result = sso.Validate(token ?? "");
    if (!result.Ok)
    {
        log.LogWarning("SSO consume rejected: {Error}", result.Error);
        return Results.Redirect($"{loginUrl}?sso={result.Error}");
    }

    var isHttps = ctx.Request.IsHttps;
    ctx.Response.Cookies.Append("admin_token", tokens.CreateToken(), new CookieOptions
    {
        HttpOnly = true,
        Secure = isHttps,
        SameSite = isHttps ? SameSiteMode.None : SameSiteMode.Lax,
        Path = "/",
        Expires = DateTimeOffset.UtcNow.AddHours(8),
    });
    log.LogInformation("SSO admin login succeeded for hub user {Username}", result.Username);
    return Results.Redirect(adminUrl);
});

// ---- Public reads ----
api.MapGet("/profile", async (PortfolioDbContext db) =>
{
    var profile = await db.Profiles.FirstOrDefaultAsync();
    return profile is null ? Results.NotFound() : Results.Ok(profile);
});

api.MapGet("/stats", async (PortfolioDbContext db) =>
    Results.Ok(await db.Stats.OrderBy(s => s.SortOrder).ThenBy(s => s.Id).ToListAsync()));

api.MapGet("/projects", async (bool? featured, PortfolioDbContext db) =>
{
    var query = db.Projects.AsQueryable();
    if (featured is true) query = query.Where(p => p.Featured);
    return Results.Ok(await query.OrderBy(p => p.SortOrder).ThenBy(p => p.Id).ToListAsync());
});

api.MapGet("/projects/{id:int}", async (int id, PortfolioDbContext db) =>
{
    var project = await db.Projects.FindAsync(id);
    return project is null ? Results.NotFound() : Results.Ok(project);
});

// Serve DB-stored images. Content is immutable per id, so cache aggressively.
api.MapGet("/images/{id:int}", async (int id, PortfolioDbContext db, HttpContext ctx) =>
{
    var image = await db.Images.FindAsync(id);
    if (image is null) return Results.NotFound();
    ctx.Response.Headers.CacheControl = "public, max-age=31536000, immutable";
    return Results.File(image.Data, image.ContentType);
});

api.MapGet("/skills", async (PortfolioDbContext db) =>
    Results.Ok(await db.Skills.OrderBy(s => s.SortOrder).ThenBy(s => s.Id).ToListAsync()));

api.MapPost("/contact", (ContactMessage message) =>
{
    var validationResults = new List<ValidationResult>();
    var context = new ValidationContext(message);
    if (!Validator.TryValidateObject(message, context, validationResults, validateAllProperties: true))
    {
        var errors = validationResults.ToDictionary(
            r => r.MemberNames.FirstOrDefault() ?? "error",
            r => new[] { r.ErrorMessage ?? "Invalid value" });
        return Results.ValidationProblem(errors);
    }

    app.Logger.LogInformation("Contact message from {Name} <{Email}>", message.Name, message.Email);
    return Results.Ok(new { success = true, message = "Thanks! Your message has been received." });
});

// ---- Admin (JWT protected) ----
app.MapAdminEndpoints();

// SPA fallback: any non-API, non-file route (e.g. /admin) returns index.html so
// React Router can handle client-side routing. Only active when index.html exists.
app.MapFallbackToFile("index.html");

app.Run();
