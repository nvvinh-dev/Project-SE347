using Microsoft.EntityFrameworkCore;
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
