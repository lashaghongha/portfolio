using Microsoft.EntityFrameworkCore;

namespace PortfolioApi.Data;

public static class DatabaseConfig
{
    public static void AddPortfolioDatabase(this IServiceCollection services, IConfiguration config)
    {
        // Railway/Heroku style URL takes priority, then a plain connection string, else local SQLite.
        var databaseUrl = Environment.GetEnvironmentVariable("DATABASE_URL")
            ?? config.GetConnectionString("Postgres");

        if (!string.IsNullOrWhiteSpace(databaseUrl))
        {
            var connectionString = ToNpgsqlConnectionString(databaseUrl);
            services.AddDbContext<PortfolioDbContext>(options => options.UseNpgsql(connectionString));
        }
        else
        {
            var sqlitePath = config.GetConnectionString("Sqlite") ?? "Data Source=portfolio.db";
            services.AddDbContext<PortfolioDbContext>(options => options.UseSqlite(sqlitePath));
        }
    }

    // Accepts either a ready Npgsql connection string or a postgres:// URI (Railway/Heroku format).
    private static string ToNpgsqlConnectionString(string value)
    {
        if (!value.StartsWith("postgres://", StringComparison.OrdinalIgnoreCase)
            && !value.StartsWith("postgresql://", StringComparison.OrdinalIgnoreCase))
        {
            return value;
        }

        var uri = new Uri(value);
        var userInfo = uri.UserInfo.Split(':', 2);
        var database = uri.AbsolutePath.TrimStart('/');
        var port = uri.Port > 0 ? uri.Port : 5432;

        return $"Host={uri.Host};Port={port};Database={database};" +
               $"Username={Uri.UnescapeDataString(userInfo[0])};" +
               $"Password={Uri.UnescapeDataString(userInfo.ElementAtOrDefault(1) ?? string.Empty)};" +
               "SSL Mode=Require;Trust Server Certificate=true";
    }
}
