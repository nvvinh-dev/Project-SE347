using Microsoft.EntityFrameworkCore;
using NhaTre.Application.Interfaces;
using NhaTre.Domain.Constants;
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

    // Không theo dõi thay đổi: sửa hóa đơn đi qua UpdateUnpaidInvoiceAsync, nên một SaveChanges khác
    // trong cùng request (ví dụ lúc ghi thông báo) không thể ghi đè hóa đơn mà bỏ qua điều kiện status
    public async Task<Invoice?> FindInvoiceByIdAsync(Guid id)
    {
        return await _dbContext.Invoices
            .AsNoTracking()
            .Include(i => i.Child)
            .FirstOrDefaultAsync(i => i.Id == id);
    }

    public void AddInvoice(Invoice invoice)
    {
        _dbContext.Invoices.Add(invoice);
    }

    // BR-TUITION-12: điều kiện status = 'unpaid' nằm ngay trong câu UPDATE. Hóa đơn được ghi nhận
    // thanh toán giữa lúc Service đọc và lúc lưu thì không dòng nào khớp, số tiền cũ được giữ nguyên.
    public async Task<bool> UpdateUnpaidInvoiceAsync(Guid id, Guid childId, decimal amount, string description)
    {
        var updatedRows = await _dbContext.Invoices
            .Where(i => i.Id == id && i.Status == InvoiceStatuses.Unpaid)
            .ExecuteUpdateAsync(setters => setters
                .SetProperty(i => i.ChildId, childId)
                .SetProperty(i => i.Amount, amount)
                .SetProperty(i => i.Description, description));

        return updatedRows == 1;
    }

    public async Task SaveChangesAsync()
    {
        await _dbContext.SaveChangesAsync();
    }
}
