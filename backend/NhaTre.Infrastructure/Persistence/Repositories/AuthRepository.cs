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

    public async Task<User?> FindByIdAsync(Guid userId)
    {
        return await _dbContext.Users
            .FirstOrDefaultAsync(u => u.Id == userId);
    }

    // Một câu UPDATE token_version = token_version + 1 ngay trong database, không đọc lên rồi
    // ghi lại, để hai lần tăng cùng lúc (đăng xuất trên hai máy) không ghi đè nhau
    public async Task IncrementTokenVersionAsync(Guid userId)
    {
        await _dbContext.Users
            .Where(u => u.Id == userId)
            .ExecuteUpdateAsync(s => s.SetProperty(u => u.TokenVersion, u => u.TokenVersion + 1));
    }
}