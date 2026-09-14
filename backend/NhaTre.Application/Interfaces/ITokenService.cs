namespace NhaTre.Application.Interfaces;

public record TokenResult(string Token, DateTime ExpiresAtUtc);

public interface ITokenService
{
    TokenResult GenerateToken(Guid userId, string roleClaim);
}