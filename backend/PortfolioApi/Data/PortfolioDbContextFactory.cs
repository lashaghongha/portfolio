using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Design;

namespace PortfolioApi.Data;

// Design-time factory used ONLY by the `dotnet ef` tooling. It forces the Npgsql
// provider so migrations are generated for production (Railway Postgres),
// independent of local environment variables. The connection string here is a
// placeholder — `migrations add` builds the model without connecting to a database.
public sealed class PortfolioDbContextFactory : IDesignTimeDbContextFactory<PortfolioDbContext>
{
    public PortfolioDbContext CreateDbContext(string[] args)
    {
        var options = new DbContextOptionsBuilder<PortfolioDbContext>()
            .UseNpgsql("Host=localhost;Port=5432;Database=portfolio_design;Username=postgres;Password=postgres")
            .Options;

        return new PortfolioDbContext(options);
    }
}
