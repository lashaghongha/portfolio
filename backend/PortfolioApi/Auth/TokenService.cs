using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using System.Text;
using Microsoft.IdentityModel.Tokens;

namespace PortfolioApi.Auth;

public sealed class TokenService(IConfiguration config)
{
    public string SigningKey =>
        Environment.GetEnvironmentVariable("JWT_KEY")
        ?? config["Jwt:Key"]
        ?? "dev-only-insecure-signing-key-change-me-1234567890";

    public string AdminPassword =>
        Environment.GetEnvironmentVariable("ADMIN_PASSWORD")
        ?? config["Admin:Password"]
        ?? "admin123";

    public const string Issuer = "portfolio-api";
    public const string Audience = "portfolio-admin";

    public string CreateToken()
    {
        var key = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(SigningKey));
        var credentials = new SigningCredentials(key, SecurityAlgorithms.HmacSha256);
        var claims = new[] { new Claim(ClaimTypes.Role, "admin") };

        var token = new JwtSecurityToken(
            issuer: Issuer,
            audience: Audience,
            claims: claims,
            expires: DateTime.UtcNow.AddHours(8),
            signingCredentials: credentials);

        return new JwtSecurityTokenHandler().WriteToken(token);
    }
}
