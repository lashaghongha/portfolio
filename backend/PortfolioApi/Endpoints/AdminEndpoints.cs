using Microsoft.EntityFrameworkCore;
using PortfolioApi.Data;
using PortfolioApi.Models;

namespace PortfolioApi.Endpoints;

public static class AdminEndpoints
{
    private static readonly string[] AllowedImageExtensions = { ".png", ".jpg", ".jpeg", ".webp", ".gif", ".svg" };
    private const long MaxImageBytes = 5 * 1024 * 1024;

    public static void MapAdminEndpoints(this IEndpointRouteBuilder app)
    {
        var admin = app.MapGroup("/api/admin").RequireAuthorization();

        // ---- Profile (single row) ----
        admin.MapPut("/profile", async (Profile input, PortfolioDbContext db) =>
        {
            var profile = await db.Profiles.FirstOrDefaultAsync();
            if (profile is null)
            {
                db.Profiles.Add(input);
            }
            else
            {
                profile.Name = input.Name;
                profile.Role = input.Role;
                profile.Tagline = input.Tagline;
                profile.Bio = input.Bio;
                profile.GithubUrl = input.GithubUrl;
                profile.LinkedInUrl = input.LinkedInUrl;
                profile.Email = input.Email;
            }
            await db.SaveChangesAsync();
            return Results.Ok(await db.Profiles.FirstAsync());
        });

        // ---- Projects ----
        admin.MapGet("/projects", async (PortfolioDbContext db) =>
            Results.Ok(await db.Projects.OrderBy(p => p.SortOrder).ThenBy(p => p.Id).ToListAsync()));

        admin.MapPost("/projects", async (Project input, PortfolioDbContext db) =>
        {
            input.Id = 0;
            db.Projects.Add(input);
            await db.SaveChangesAsync();
            return Results.Created($"/api/admin/projects/{input.Id}", input);
        });

        admin.MapPut("/projects/{id:int}", async (int id, Project input, PortfolioDbContext db) =>
        {
            var project = await db.Projects.FindAsync(id);
            if (project is null) return Results.NotFound();

            project.Title = input.Title;
            project.Description = input.Description;
            project.Icon = input.Icon;
            project.Accent = input.Accent;
            project.Tags = input.Tags;
            project.ImageUrl = input.ImageUrl;
            project.RepoUrl = input.RepoUrl;
            project.LiveUrl = input.LiveUrl;
            project.Featured = input.Featured;
            project.SortOrder = input.SortOrder;
            await db.SaveChangesAsync();
            return Results.Ok(project);
        });

        admin.MapDelete("/projects/{id:int}", async (int id, PortfolioDbContext db) =>
        {
            var project = await db.Projects.FindAsync(id);
            if (project is null) return Results.NotFound();
            db.Projects.Remove(project);
            await db.SaveChangesAsync();
            return Results.NoContent();
        });

        // ---- Skills ----
        admin.MapGet("/skills", async (PortfolioDbContext db) =>
            Results.Ok(await db.Skills.OrderBy(s => s.SortOrder).ThenBy(s => s.Id).ToListAsync()));

        admin.MapPost("/skills", async (Skill input, PortfolioDbContext db) =>
        {
            input.Id = 0;
            db.Skills.Add(input);
            await db.SaveChangesAsync();
            return Results.Created($"/api/admin/skills/{input.Id}", input);
        });

        admin.MapPut("/skills/{id:int}", async (int id, Skill input, PortfolioDbContext db) =>
        {
            var skill = await db.Skills.FindAsync(id);
            if (skill is null) return Results.NotFound();
            skill.Name = input.Name;
            skill.Icon = input.Icon;
            skill.Category = input.Category;
            skill.SortOrder = input.SortOrder;
            await db.SaveChangesAsync();
            return Results.Ok(skill);
        });

        admin.MapDelete("/skills/{id:int}", async (int id, PortfolioDbContext db) =>
        {
            var skill = await db.Skills.FindAsync(id);
            if (skill is null) return Results.NotFound();
            db.Skills.Remove(skill);
            await db.SaveChangesAsync();
            return Results.NoContent();
        });

        // ---- Stats ----
        admin.MapGet("/stats", async (PortfolioDbContext db) =>
            Results.Ok(await db.Stats.OrderBy(s => s.SortOrder).ThenBy(s => s.Id).ToListAsync()));

        admin.MapPost("/stats", async (Stat input, PortfolioDbContext db) =>
        {
            input.Id = 0;
            db.Stats.Add(input);
            await db.SaveChangesAsync();
            return Results.Created($"/api/admin/stats/{input.Id}", input);
        });

        admin.MapPut("/stats/{id:int}", async (int id, Stat input, PortfolioDbContext db) =>
        {
            var stat = await db.Stats.FindAsync(id);
            if (stat is null) return Results.NotFound();
            stat.Label = input.Label;
            stat.Value = input.Value;
            stat.Icon = input.Icon;
            stat.SortOrder = input.SortOrder;
            await db.SaveChangesAsync();
            return Results.Ok(stat);
        });

        admin.MapDelete("/stats/{id:int}", async (int id, PortfolioDbContext db) =>
        {
            var stat = await db.Stats.FindAsync(id);
            if (stat is null) return Results.NotFound();
            db.Stats.Remove(stat);
            await db.SaveChangesAsync();
            return Results.NoContent();
        });

        // ---- Image upload ----
        admin.MapPost("/upload", async (IFormFile? file, IWebHostEnvironment env) =>
        {
            if (file is null || file.Length == 0)
                return Results.BadRequest(new { error = "No file provided." });
            if (file.Length > MaxImageBytes)
                return Results.BadRequest(new { error = "File too large (max 5MB)." });

            var ext = Path.GetExtension(file.FileName).ToLowerInvariant();
            if (!AllowedImageExtensions.Contains(ext))
                return Results.BadRequest(new { error = "Unsupported file type." });

            var webRoot = env.WebRootPath ?? Path.Combine(env.ContentRootPath, "wwwroot");
            var uploadsDir = Path.Combine(webRoot, "uploads");
            Directory.CreateDirectory(uploadsDir);

            var fileName = $"{Guid.NewGuid():N}{ext}";
            var fullPath = Path.Combine(uploadsDir, fileName);
            await using (var stream = File.Create(fullPath))
            {
                await file.CopyToAsync(stream);
            }

            return Results.Ok(new { url = $"/uploads/{fileName}" });
        }).DisableAntiforgery();
    }
}
