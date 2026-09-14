namespace NhaTre.Application.DTOs.Auth;

public record LoginResponse(
    string Token,
    DateTime ExpiresAtUtc,
    Guid UserId,
    string FullName,
    string Role);