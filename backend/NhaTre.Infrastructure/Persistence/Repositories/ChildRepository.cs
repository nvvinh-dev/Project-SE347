using Microsoft.EntityFrameworkCore;
using NhaTre.Application.DTOs.Children;
using NhaTre.Application.Interfaces;
using NhaTre.Domain.Entities;

namespace NhaTre.Infrastructure.Persistence.Repositories;

public class ChildRepository : IChildRepository
{
    private readonly AppDbContext _dbContext;

    public ChildRepository(AppDbContext dbContext)
    {
        _dbContext = dbContext;
    }

    public async Task<IReadOnlyList<Child>> GetAllAsync()
    {
        return await _dbContext.Children
            .OrderBy(c => c.FullName)
            .ToListAsync();
    }

    // Liên kết phụ huynh–trẻ nằm ngay trong câu truy vấn, và chỉ đọc id, họ tên (D45). Xếp thêm theo
    // id để hai trẻ trùng họ tên vẫn giữ thứ tự cố định
    public async Task<IReadOnlyList<MyChildResponse>> GetByGuardianAsync(Guid guardianUserId)
    {
        return await _dbContext.Children
            .AsNoTracking()
            .Where(c => c.ChildGuardians.Any(cg => cg.GuardianUserId == guardianUserId))
            .OrderBy(c => c.FullName)
            .ThenBy(c => c.Id)
            .Select(c => new MyChildResponse(c.Id, c.FullName))
            .ToListAsync();
    }

    public async Task<Child?> FindByIdAsync(Guid id)
    {
        return await _dbContext.Children
            .FirstOrDefaultAsync(c => c.Id == id);
    }

    public void Add(Child child)
    {
        _dbContext.Children.Add(child);
    }

    public async Task SaveChangesAsync()
    {
        await _dbContext.SaveChangesAsync();
    }
}
