using Microsoft.EntityFrameworkCore;
using NhaTre.Application.Interfaces;
using NhaTre.Domain.Entities;

namespace NhaTre.Infrastructure.Persistence.Repositories;

public class AuthRepository : IAuthRepository
{
    private readonly AppDbContext _dbContext;

    public AuthRepository(AppDbContext dbContext)
    {
        _dbContext = dbContext;
    }

    public async Task<User?> FindByLoginIdentifierAsync(string normalizedEmail)
    {
        return await _dbContext.Users
            .FirstOrDefaultAsync(u => u.LoginIdentifier == normalizedEmail);
    }
}