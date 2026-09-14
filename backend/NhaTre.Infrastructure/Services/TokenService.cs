using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using System.Text;
using Microsoft.Extensions.Configuration;
using Microsoft.IdentityModel.Tokens;
using NhaTre.Application.Interfaces;

namespace NhaTre.Infrastructure.Services;

public class TokenService : ITokenService
{
    private readonly IConfiguration _configuration;

    public TokenService(IConfiguration configuration)
    {
        _configuration = configuration;
    }

    public TokenResult GenerateToken(Guid userId, string roleClaim)
    {
        var jwtSection = _configuration.GetSection("Jwt");
        var secretKey = jwtSection["Key"]
            ?? throw new InvalidOperationException("Thiếu cấu hình Jwt:Key.");
        var issuer = jwtSection["Issuer"]
            ?? throw new InvalidOperationException("Thiếu cấu hình Jwt:Issuer.");
        var audience = jwtSection["Audience"]
            ?? throw new InvalidOperationException("Thiếu cấu hình Jwt:Audience.");

        // D20: thời hạn 10 giờ, khớp giờ hoạt động thực tế 7h-17h
        var expiresAtUtc = DateTime.UtcNow.AddHours(10);

        var claims = new[]
        {
            new Claim(JwtRegisteredClaimNames.Sub, userId.ToString()),
            new Claim("role", roleClaim), // tên "role" phải khớp RoleClaimType cấu hình ở Bước 4.3
            new Claim(JwtRegisteredClaimNames.Iat,
                DateTimeOffset.UtcNow.ToUnixTimeSeconds().ToString(),
                ClaimValueTypes.Integer64),
            new Claim(JwtRegisteredClaimNames.Jti, Guid.NewGuid().ToString()),
        };

        var key = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(secretKey));
        var credentials = new SigningCredentials(key, SecurityAlgorithms.HmacSha256);

        var token = new JwtSecurityToken(
            issuer: issuer,
            audience: audience,
            claims: claims,
            expires: expiresAtUtc,
            signingCredentials: credentials);

        var tokenString = new JwtSecurityTokenHandler().WriteToken(token);
        return new TokenResult(tokenString, expiresAtUtc);
    }
}