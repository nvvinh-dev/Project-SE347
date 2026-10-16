namespace NhaTre.Application.Interfaces;

public record TokenResult(string Token, DateTime ExpiresAtUtc);

public interface ITokenService
{
    // tokenVersion là users.token_version lúc phát token, ghi vào claim "tv" (D48)
    TokenResult GenerateToken(Guid userId, string roleClaim, int tokenVersion);
}