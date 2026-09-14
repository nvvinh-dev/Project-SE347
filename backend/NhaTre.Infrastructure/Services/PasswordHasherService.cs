using Microsoft.AspNetCore.Identity;
using Microsoft.Extensions.Options;
using NhaTre.Application.Interfaces;
using NhaTre.Domain.Entities;

namespace NhaTre.Infrastructure.Services;

public class PasswordHasherService : IPasswordHasher
{
    private readonly PasswordHasher<User> _hasher = new(
        Options.Create(new PasswordHasherOptions
        {
            CompatibilityMode = PasswordHasherCompatibilityMode.IdentityV3
        }));

    public string Hash(string password)
    {
        // Tham số User không được thuật toán dùng tới, chỉ để khớp chữ ký API của PasswordHasher<T>
        return _hasher.HashPassword(null!, password);
    }

    public bool Verify(string hash, string password)
    {
        var result = _hasher.VerifyHashedPassword(null!, hash, password);
        return result is PasswordVerificationResult.Success
            or PasswordVerificationResult.SuccessRehashNeeded;
    }
}