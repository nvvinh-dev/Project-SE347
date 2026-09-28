using Microsoft.EntityFrameworkCore;
using NhaTre.Application.Interfaces;
using NhaTre.Domain.Entities;

namespace NhaTre.Infrastructure.Persistence.Repositories;

public class TuitionRepository : ITuitionRepository
{
    private readonly AppDbContext _dbContext;

    public TuitionRepository(AppDbContext dbContext)
    {
        _dbContext = dbContext;
    }

    public async Task<IReadOnlyList<TuitionFee>> GetAllFeesAsync()
    {
        return await _dbContext.TuitionFees.ToListAsync();
    }

    public async Task<TuitionFee?> FindFeeByIdAsync(Guid id)
    {
        return await _dbContext.TuitionFees
            .FirstOrDefaultAsync(f => f.Id == id);
    }

    public async Task<bool> AnyFeeAsync()
    {
        return await _dbContext.TuitionFees.AnyAsync();
    }

    public void AddFee(TuitionFee fee)
    {
        _dbContext.TuitionFees.Add(fee);
    }

    // Mới lập xếp trước; bỏ trống bộ lọc nào thì không lọc theo tiêu chí đó
    public async Task<IReadOnlyList<Invoice>> GetInvoicesAsync(Guid? childId, string? status)
    {
        var query = _dbContext.Invoices.Include(i => i.Child).AsQueryable();

        if (childId is not null)
            query = query.Where(i => i.ChildId == childId);

        if (status is not null)
            query = query.Where(i => i.Status == status);

        return await query
            .OrderByDescending(i => i.IssuedAt)
            .ToListAsync();
    }

    public async Task<Invoice?> FindInvoiceByIdAsync(Guid id)
    {
        return await _dbContext.Invoices
            .Include(i => i.Child)
            .FirstOrDefaultAsync(i => i.Id == id);
    }

    public void AddInvoice(Invoice invoice)
    {
        _dbContext.Invoices.Add(invoice);
    }

    public async Task SaveChangesAsync()
    {
        await _dbContext.SaveChangesAsync();
    }
}
