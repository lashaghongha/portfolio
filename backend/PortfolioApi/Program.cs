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
using PortfolioApi.Services;

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
builder.Services.AddSingleton<EmailSender>();

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

api.MapGet("/experience", async (PortfolioDbContext db) =>
    Results.Ok(await db.Experiences.OrderBy(e => e.SortOrder).ThenBy(e => e.Id).ToListAsync()));

api.MapPost("/contact", async (ContactMessage message, PortfolioDbContext db, EmailSender email, IServiceScopeFactory scopeFactory) =>
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

    // Always persist the message so it is never lost, even if email is unconfigured.
    var submission = new ContactSubmission
    {
        Name = message.Name,
        Email = message.Email,
        Message = message.Message,
        CreatedAt = DateTime.UtcNow,
    };
    db.ContactSubmissions.Add(submission);
    await db.SaveChangesAsync();
    var submissionId = submission.Id;

    // Send the email in the background so the visitor never waits on SMTP. The
    // outcome (delivered / error reason) is written back for the admin inbox.
    _ = Task.Run(async () =>
    {
        string? error = null;
        var delivered = false;
        try
        {
            delivered = await email.SendContactAsync(message.Name, message.Email, message.Message);
        }
        catch (Exception ex)
        {
            error = ex.InnerException?.Message ?? ex.Message;
            app.Logger.LogError(ex, "Contact email failed (saved to inbox)");
        }

        try
        {
            using var scope = scopeFactory.CreateScope();
            var bgDb = scope.ServiceProvider.GetRequiredService<PortfolioDbContext>();
            var s = await bgDb.ContactSubmissions.FindAsync(submissionId);
            if (s is not null)
            {
                s.Emailed = delivered;
                s.EmailError = error;
                await bgDb.SaveChangesAsync();
            }
        }
        catch (Exception ex)
        {
            app.Logger.LogError(ex, "Failed to record contact email status");
        }
    });

    return Results.Ok(new { success = true, message = "Thanks! Your message has been received." });
});

// ---- View events: start / end / cv (detailed analytics) ----
const int MaxDurationMs = 2 * 60 * 60 * 1000; // clamp to 2h

api.MapPost("/track/start", async (TrackStartRequest req, PortfolioDbContext db) =>
{
    var key = (req.Key ?? string.Empty).Trim();
    if (key != "home" && !System.Text.RegularExpressions.Regex.IsMatch(key, @"^project:\d{1,9}$"))
        return Results.BadRequest();
    var ev = new ViewEvent { Key = key, StartedAt = DateTime.UtcNow };
    db.ViewEvents.Add(ev);
    await db.SaveChangesAsync();
    return Results.Ok(new { id = ev.Id });
});

api.MapPost("/track/end", async (TrackEndRequest req, PortfolioDbContext db) =>
{
    var ev = await db.ViewEvents.FindAsync(req.Id);
    if (ev is null) return Results.NoContent();
    ev.DurationMs = Math.Clamp(req.DurationMs, 0, MaxDurationMs);
    await db.SaveChangesAsync();
    return Results.NoContent();
});

api.MapPost("/track/cv", async (TrackCvRequest req, PortfolioDbContext db) =>
{
    var ev = await db.ViewEvents.FindAsync(req.Id);
    if (ev is null) return Results.NoContent();
    if (req.Action == "download") ev.CvDownloaded = true;
    else ev.CvViewed = true;
    await db.SaveChangesAsync();
    return Results.NoContent();
});

// ---- Privacy-friendly view tracking (no PII) ----
api.MapPost("/track", async (TrackRequest req, PortfolioDbContext db) =>
{
    var key = (req.Key ?? string.Empty).Trim();
    // Only allow known keys so the table can't be flooded with arbitrary values.
    if (key != "home" && !System.Text.RegularExpressions.Regex.IsMatch(key, @"^project:\d{1,9}$"))
        return Results.BadRequest();

    var counter = await db.ViewCounters.FirstOrDefaultAsync(v => v.Key == key);
    if (counter is null)
        db.ViewCounters.Add(new ViewCounter { Key = key, Count = 1, UpdatedAt = DateTime.UtcNow });
    else
    {
        counter.Count += 1;
        counter.UpdatedAt = DateTime.UtcNow;
    }
    await db.SaveChangesAsync();
    return Results.NoContent();
});

// ---- Admin (JWT protected) ----
app.MapAdminEndpoints();

// SPA fallback: any non-API, non-file route (e.g. /admin) returns index.html so
// React Router can handle client-side routing. Only active when index.html exists.
app.MapFallbackToFile("index.html");

app.Run();
