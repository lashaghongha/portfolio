using System.Text.Json;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.ChangeTracking;
using Microsoft.EntityFrameworkCore.Storage.ValueConversion;
using PortfolioApi.Models;

namespace PortfolioApi.Data;

public class PortfolioDbContext : DbContext
{
    public PortfolioDbContext(DbContextOptions<PortfolioDbContext> options) : base(options) { }

    public DbSet<Profile> Profiles => Set<Profile>();
    public DbSet<Project> Projects => Set<Project>();
    public DbSet<Skill> Skills => Set<Skill>();
    public DbSet<Stat> Stats => Set<Stat>();
    public DbSet<StoredImage> Images => Set<StoredImage>();

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        // Store string list as JSON so the same model works on Postgres and SQLite.
        var converter = new ValueConverter<List<string>, string>(
            v => JsonSerializer.Serialize(v, (JsonSerializerOptions?)null),
            v => JsonSerializer.Deserialize<List<string>>(v, (JsonSerializerOptions?)null) ?? new List<string>());

        var comparer = new ValueComparer<List<string>>(
            (a, b) => (a ?? new()).SequenceEqual(b ?? new()),
            v => v == null ? 0 : v.Aggregate(0, (acc, s) => HashCode.Combine(acc, s.GetHashCode())),
            v => v.ToList());

        modelBuilder.Entity<Project>()
            .Property(p => p.Tags)
            .HasConversion(converter, comparer);

        // Gallery is stored as JSON in the legacy "GalleryUrls" column. The reader
        // tolerates both the old string-array shape (["url", ...]) and the new
        // object shape ([{ "Url": ..., "Caption": ... }]), so existing rows keep working.
        var galleryConverter = new ValueConverter<List<GalleryItem>, string>(
            v => SerializeGallery(v),
            v => DeserializeGallery(v));

        var galleryComparer = new ValueComparer<List<GalleryItem>>(
            (a, b) => SerializeGallery(a) == SerializeGallery(b),
            v => SerializeGallery(v).GetHashCode(),
            v => DeserializeGallery(SerializeGallery(v)));

        modelBuilder.Entity<Project>()
            .Property(p => p.Gallery)
            .HasColumnName("GalleryUrls")
            .HasConversion(galleryConverter, galleryComparer);
    }

    private static string SerializeGallery(List<GalleryItem>? gallery) =>
        JsonSerializer.Serialize(gallery ?? new List<GalleryItem>(), (JsonSerializerOptions?)null);

    private static List<GalleryItem> DeserializeGallery(string json)
    {
        if (string.IsNullOrWhiteSpace(json)) return new();
        try
        {
            using var doc = JsonDocument.Parse(json);
            if (doc.RootElement.ValueKind != JsonValueKind.Array) return new();

            var items = new List<GalleryItem>();
            foreach (var element in doc.RootElement.EnumerateArray())
            {
                if (element.ValueKind == JsonValueKind.String)
                {
                    items.Add(new GalleryItem { Url = element.GetString() ?? string.Empty });
                }
                else if (element.ValueKind == JsonValueKind.Object)
                {
                    var url = ReadString(element, "url") ?? ReadString(element, "Url") ?? string.Empty;
                    var caption = ReadString(element, "caption") ?? ReadString(element, "Caption");
                    items.Add(new GalleryItem { Url = url, Caption = caption });
                }
            }
            return items;
        }
        catch (JsonException)
        {
            return new();
        }
    }

    private static string? ReadString(JsonElement element, string name) =>
        element.TryGetProperty(name, out var value) && value.ValueKind == JsonValueKind.String
            ? value.GetString()
            : null;
}
