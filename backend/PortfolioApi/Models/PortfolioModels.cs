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
    public List<string> GalleryUrls { get; set; } = new();
    public string? RepoUrl { get; set; }
    public string? LiveUrl { get; set; }
    public bool Featured { get; set; }
    public int SortOrder { get; set; }
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

public class Profile
{
    public int Id { get; set; }
    public string Name { get; set; } = string.Empty;
    public string Role { get; set; } = string.Empty;
    public string Tagline { get; set; } = string.Empty;
    public string Bio { get; set; } = string.Empty;
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

public record LoginRequest(string Password);
