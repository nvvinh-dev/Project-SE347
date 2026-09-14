using NhaTre.Domain.Entities;

namespace NhaTre.Application.Interfaces;

public interface IAuthRepository
{
    Task<User?> FindByLoginIdentifierAsync(string normalizedEmail);
}