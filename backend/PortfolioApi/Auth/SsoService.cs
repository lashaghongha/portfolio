using System.IdentityModel.Tokens.Jwt;
using System.Security.Cryptography;
using Microsoft.Extensions.Caching.Memory;
using Microsoft.IdentityModel.Tokens;

namespace PortfolioApi.Auth;

/// <summary>
/// Validates single-use SSO tickets issued by the central Admin Hub.
///
/// The hub is the sole signer (it holds the RSA private key); this service only
/// holds the hub's PUBLIC key, so a compromise here can never mint a ticket for
/// this or any other target. Tickets are short-lived (the hub caps expiry) and
/// single-use — a consumed jti is remembered until its natural expiry so the same
/// ticket cannot be replayed if intercepted from the redirect URL.
///
/// SSO is inactive unless SSO_HUB_PUBLIC_KEY is configured, so the feature is a
/// no-op on deployments that haven't opted in. The portfolio has a single shared
/// admin (password-only, no user table), so a valid hub ticket for this audience
/// grants the admin session.
/// </summary>
public sealed class SsoService
{
    // Must match the hub's token iss/aud. Audience is THIS service's key in the hub.
    public const string DefaultIssuer = "admin-hub";
    public const string DefaultAudience = "portfolio";

    private readonly RsaSecurityKey? _hubKey;
    private readonly string _issuer;
    private readonly string _audience;
    private readonly IMemoryCache _cache;
    private readonly ILogger<SsoService> _logger;
    private static readonly object _replayLock = new();

    public bool Enabled => _hubKey is not null;

    public SsoService(IMemoryCache cache, ILogger<SsoService> logger)
    {
        _cache = cache;
        _logger = logger;
        _issuer = Environment.GetEnvironmentVariable("SSO_HUB_ISSUER") ?? DefaultIssuer;
        _audience = Environment.GetEnvironmentVariable("SSO_AUDIENCE") ?? DefaultAudience;

        var pem = Environment.GetEnvironmentVariable("SSO_HUB_PUBLIC_KEY");
        if (!string.IsNullOrWhiteSpace(pem))
        {
            try
            {
                var rsa = RSA.Create();
                rsa.ImportFromPem(pem);
                _hubKey = new RsaSecurityKey(rsa);
            }
            catch (Exception ex)
            {
                // Misconfigured key -> SSO stays disabled rather than crashing boot.
                _logger.LogError(ex, "Invalid SSO_HUB_PUBLIC_KEY — SSO consume disabled");
            }
        }
    }

    public sealed record TicketResult(bool Ok, string? Username, string? Error);

    /// <summary>Validate a hub ticket. Returns the hub username on success.</summary>
    public TicketResult Validate(string token)
    {
        if (_hubKey is null) return new(false, null, "sso_disabled");
        if (string.IsNullOrWhiteSpace(token)) return new(false, null, "missing_token");

        var pars = new TokenValidationParameters
        {
            ValidateIssuer = true,
            ValidIssuer = _issuer,
            ValidateAudience = true,
            ValidAudience = _audience,
            ValidateLifetime = true,
            ValidateIssuerSigningKey = true,
            IssuerSigningKey = _hubKey,
            // Pin RS256 so an attacker can't downgrade to HS256 and abuse the public
            // key bytes as an HMAC secret (algorithm-confusion attack).
            ValidAlgorithms = new[] { SecurityAlgorithms.RsaSha256 },
            ClockSkew = TimeSpan.FromSeconds(15),
        };

        try
        {
            // Keep JWT claim names verbatim ("sub", "jti"). Without this, the handler
            // rewrites "sub" to the ClaimTypes.NameIdentifier URI and FindFirst(Sub)
            // returns null — the identity would look empty even on a valid ticket.
            var handler = new JwtSecurityTokenHandler { MapInboundClaims = false };
            var principal = handler.ValidateToken(token, pars, out var validated);
            var jwt = (JwtSecurityToken)validated;

            var jti = jwt.Id;
            if (string.IsNullOrEmpty(jti)) return new(false, null, "missing_jti");

            // Single-use replay guard. Locked so two concurrent requests carrying the
            // same jti can't both slip past the check before the first records it.
            var cacheKey = "sso_jti_" + jti;
            lock (_replayLock)
            {
                if (_cache.TryGetValue(cacheKey, out _)) return new(false, null, "replayed");
                _cache.Set(cacheKey, true, jwt.ValidTo);
            }

            var username = principal.FindFirst(JwtRegisteredClaimNames.Sub)?.Value
                           ?? principal.Identity?.Name;
            if (string.IsNullOrWhiteSpace(username)) return new(false, null, "missing_sub");

            return new(true, username, null);
        }
        catch (Exception ex)
        {
            _logger.LogWarning(ex, "SSO ticket validation failed");
            return new(false, null, "invalid");
        }
    }
}
