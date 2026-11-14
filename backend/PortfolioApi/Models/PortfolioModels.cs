using System.ComponentModel.DataAnnotations;

namespace PortfolioApi.Models;

public class Project
{
    public int Id { get; set; }
    public string Title { get; set; } = string.Empty;
    public string Description { get; set; } = string.Empty;
    public string Icon { get; set; } = "sparkles";
    public string Accent { get; set; } = "violet";
    public List<string> Tags { get; set; } = new();
    public string? ImageUrl { get; set; }
    public List<GalleryItem> Gallery { get; set; } = new();
    public List<SpecRow> Specs { get; set; } = new();
    public string? RepoUrl { get; set; }
    public string? LiveUrl { get; set; }
    public bool Featured { get; set; }
    public int SortOrder { get; set; }
}

// A single gallery screenshot with an optional caption shown on the detail page.
// Group lets screenshots be organised into labelled sections (e.g. "Storefront",
// "Admin panel") on both the admin editor and the public project page.
public class GalleryItem
{
    public string Url { get; set; } = string.Empty;
    public string? Caption { get; set; }
    public string? Group { get; set; }
}

// One row of the project's spec/tech-stack table (e.g. Label "Backend", Value "ASP.NET Core 9").
public class SpecRow
{
    public string Label { get; set; } = string.Empty;
    public string Value { get; set; } = string.Empty;
}

// Binary image stored in the database so uploads survive redeploys
// (Railway's filesystem is ephemeral). Served via GET /api/images/{id}.
public class StoredImage
{
    public int Id { get; set; }
    public string ContentType { get; set; } = "application/octet-stream";
    public byte[] Data { get; set; } = Array.Empty<byte>();
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
}

public class Skill
{
    public int Id { get; set; }
    public string Name { get; set; } = string.Empty;
    public string Icon { get; set; } = string.Empty;
    public string Category { get; set; } = "Other";
    public int SortOrder { get; set; }
}

public class Stat
{
    public int Id { get; set; }
    public string Label { get; set; } = string.Empty;
    public string Value { get; set; } = string.Empty;
    public string Icon { get; set; } = "sparkles";
    public int SortOrder { get; set; }
}

// One row of the Experience / Education timeline. Kind is "work" or "education".
public class ExperienceItem
{
    public int Id { get; set; }
    public string Kind { get; set; } = "work";
    public string Title { get; set; } = string.Empty;        // role or degree
    public string Organization { get; set; } = string.Empty; // company or school
    public string Period { get; set; } = string.Empty;       // e.g. "2023 — Present"
    public string Description { get; set; } = string.Empty;
    public int SortOrder { get; set; }
}

public class Profile
{
    public int Id { get; set; }
    public string Name { get; set; } = string.Empty;
    public string Role { get; set; } = string.Empty;
    public string Tagline { get; set; } = string.Empty;
    public string Bio { get; set; } = string.Empty;

    // Longer narrative shown in the dedicated "About" section (CV-style content).
    public string About { get; set; } = string.Empty;

    // Optional uploaded profile photo (served via /api/images/{id}); falls back to
    // name initials when null. Used by the navbar avatar and the About section.
    public string? PhotoUrl { get; set; }

    // Optional uploaded CV/resume file (PDF) exposed as a download button.
    public string? CvUrl { get; set; }

    // Short location line (e.g. "Tbilisi, Georgia") shown as an About quick-fact.
    public string Location { get; set; } = string.Empty;

    public string GithubUrl { get; set; } = string.Empty;
    public string LinkedInUrl { get; set; } = string.Empty;
    public string Email { get; set; } = string.Empty;
}

public class ContactMessage
{
    [Required, StringLength(80, MinimumLength = 2)]
    public string Name { get; set; } = string.Empty;

    [Required, EmailAddress]
    public string Email { get; set; } = string.Empty;

    [Required, StringLength(2000, MinimumLength = 5)]
    public string Message { get; set; } = string.Empty;
}

// A contact-form submission, persisted so messages are never lost even when
// email delivery is not configured. Viewable in the admin "Messages" tab.
public class ContactSubmission
{
    public int Id { get; set; }
    public string Name { get; set; } = string.Empty;
    public string Email { get; set; } = string.Empty;
    public string Message { get; set; } = string.Empty;
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public bool IsRead { get; set; }
    public bool Emailed { get; set; }
}

// Privacy-friendly view counter (no PII) — one row per tracked key
// ("home" or "project:{id}").
public class ViewCounter
{
    public int Id { get; set; }
    public string Key { get; set; } = string.Empty;
    public long Count { get; set; }
    public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;
}

public record TrackRequest(string Key);

// A single view "session" for a page: when it started, how long it lasted, and
// whether the visitor opened or downloaded the CV during it.
public class ViewEvent
{
    public int Id { get; set; }
    public string Key { get; set; } = string.Empty; // "home" or "project:{id}"
    public DateTime StartedAt { get; set; } = DateTime.UtcNow;
    public int DurationMs { get; set; }
    public bool CvViewed { get; set; }
    public bool CvDownloaded { get; set; }
}

public record TrackStartRequest(string Key);
public record TrackEndRequest(int Id, int DurationMs);
public record TrackCvRequest(int Id, string Action); // "view" | "download"

public record LoginRequest(string Password);
