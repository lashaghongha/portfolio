using Microsoft.EntityFrameworkCore;
using PortfolioApi.Data;
using PortfolioApi.Models;

namespace PortfolioApi.Endpoints;

public static class AdminEndpoints
{
    private static readonly string[] AllowedImageExtensions = { ".png", ".jpg", ".jpeg", ".webp", ".gif", ".svg" };
    private const long MaxImageBytes = 5 * 1024 * 1024;
    private const long MaxDocumentBytes = 10 * 1024 * 1024;

    private static string ContentTypeFor(string ext) => ext switch
    {
        ".png" => "image/png",
        ".jpg" or ".jpeg" => "image/jpeg",
        ".webp" => "image/webp",
        ".gif" => "image/gif",
        ".svg" => "image/svg+xml",
        _ => "application/octet-stream",
    };

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
                profile.About = input.About;
                profile.PhotoUrl = input.PhotoUrl;
                profile.CvUrl = input.CvUrl;
                profile.Location = input.Location;
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
            project.Gallery = input.Gallery;
            project.Specs = input.Specs;
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

        // ---- Experience / Education ----
        admin.MapGet("/experience", async (PortfolioDbContext db) =>
            Results.Ok(await db.Experiences.OrderBy(e => e.SortOrder).ThenBy(e => e.Id).ToListAsync()));

        admin.MapPost("/experience", async (ExperienceItem input, PortfolioDbContext db) =>
        {
            input.Id = 0;
            db.Experiences.Add(input);
            await db.SaveChangesAsync();
            return Results.Created($"/api/admin/experience/{input.Id}", input);
        });

        admin.MapPut("/experience/{id:int}", async (int id, ExperienceItem input, PortfolioDbContext db) =>
        {
            var item = await db.Experiences.FindAsync(id);
            if (item is null) return Results.NotFound();
            item.Kind = input.Kind;
            item.Title = input.Title;
            item.Organization = input.Organization;
            item.Period = input.Period;
            item.Description = input.Description;
            item.SortOrder = input.SortOrder;
            await db.SaveChangesAsync();
            return Results.Ok(item);
        });

        admin.MapDelete("/experience/{id:int}", async (int id, PortfolioDbContext db) =>
        {
            var item = await db.Experiences.FindAsync(id);
            if (item is null) return Results.NotFound();
            db.Experiences.Remove(item);
            await db.SaveChangesAsync();
            return Results.NoContent();
        });

        // ---- Analytics (totals + recent sessions) ----
        admin.MapGet("/analytics", async (PortfolioDbContext db) =>
        {
            var counters = await db.ViewCounters.OrderByDescending(v => v.Count).ToListAsync();
            var recent = await db.ViewEvents
                .OrderByDescending(e => e.StartedAt)
                .Take(100)
                .ToListAsync();
            var cvDownloads = await db.ViewEvents.CountAsync(e => e.CvDownloaded);
            var cvViews = await db.ViewEvents.CountAsync(e => e.CvViewed);
            return Results.Ok(new { counters, recent, cvDownloads, cvViews });
        });

        // ---- Contact messages (inbox) ----
        admin.MapGet("/messages", async (PortfolioDbContext db) =>
            Results.Ok(await db.ContactSubmissions.OrderByDescending(m => m.CreatedAt).ToListAsync()));

        admin.MapPut("/messages/{id:int}/read", async (int id, PortfolioDbContext db) =>
        {
            var m = await db.ContactSubmissions.FindAsync(id);
            if (m is null) return Results.NotFound();
            m.IsRead = true;
            await db.SaveChangesAsync();
            return Results.Ok(m);
        });

        admin.MapDelete("/messages/{id:int}", async (int id, PortfolioDbContext db) =>
        {
            var m = await db.ContactSubmissions.FindAsync(id);
            if (m is null) return Results.NotFound();
            db.ContactSubmissions.Remove(m);
            await db.SaveChangesAsync();
            return Results.NoContent();
        });

        // ---- Image upload (stored in DB so it survives redeploys) ----
        admin.MapPost("/upload", async (IFormFile? file, PortfolioDbContext db) =>
        {
            if (file is null || file.Length == 0)
                return Results.BadRequest(new { error = "No file provided." });
            if (file.Length > MaxImageBytes)
                return Results.BadRequest(new { error = "File too large (max 5MB)." });

            var ext = Path.GetExtension(file.FileName).ToLowerInvariant();
            if (!AllowedImageExtensions.Contains(ext))
                return Results.BadRequest(new { error = "Unsupported file type." });

            using var ms = new MemoryStream();
            await file.CopyToAsync(ms);

            var image = new StoredImage
            {
                ContentType = ContentTypeFor(ext),
                Data = ms.ToArray(),
                CreatedAt = DateTime.UtcNow,
            };
            db.Images.Add(image);
            await db.SaveChangesAsync();

            return Results.Ok(new { url = $"/api/images/{image.Id}" });
        }).DisableAntiforgery();

        // ---- CV / document upload (PDF, stored in DB like images) ----
        admin.MapPost("/upload-cv", async (IFormFile? file, PortfolioDbContext db) =>
        {
            if (file is null || file.Length == 0)
                return Results.BadRequest(new { error = "No file provided." });
            if (file.Length > MaxDocumentBytes)
                return Results.BadRequest(new { error = "File too large (max 10MB)." });

            var ext = Path.GetExtension(file.FileName).ToLowerInvariant();
            if (ext != ".pdf")
                return Results.BadRequest(new { error = "Only PDF files are allowed." });

            using var ms = new MemoryStream();
            await file.CopyToAsync(ms);

            var doc = new StoredImage
            {
                ContentType = "application/pdf",
                Data = ms.ToArray(),
                CreatedAt = DateTime.UtcNow,
            };
            db.Images.Add(doc);
            await db.SaveChangesAsync();

            return Results.Ok(new { url = $"/api/images/{doc.Id}" });
        }).DisableAntiforgery();
    }
}
