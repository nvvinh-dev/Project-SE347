using Microsoft.EntityFrameworkCore;
using NhaTre.Application.DTOs.Complaints;
using NhaTre.Application.Interfaces;
using NhaTre.Domain.Constants;
using NhaTre.Domain.Entities;

namespace NhaTre.Infrastructure.Persistence.Repositories;

public class ComplaintRepository : IComplaintRepository
{
    private readonly AppDbContext _dbContext;

    public ComplaintRepository(AppDbContext dbContext)
    {
        _dbContext = dbContext;
    }

    public async Task AddAsync(Complaint complaint)
    {
        _dbContext.Complaints.Add(complaint);
        await _dbContext.SaveChangesAsync();
    }

    // Mọi phản ánh của trẻ, kể cả do phụ huynh khác của trẻ gửi (D39 mục 18). Lọc child_guardians ngay
    // trong câu SQL nên dù Service quên kiểm liên kết cũng không lộ phản ánh của trẻ khác
    public async Task<IReadOnlyList<ChildComplaintResponse>> GetOfChildForGuardianAsync(Guid childId,
        Guid parentUserId)
    {
        return await _dbContext.Complaints
            .AsNoTracking()
            .Where(c => c.ChildId == childId
                && c.Child.ChildGuardians.Any(cg => cg.GuardianUserId == parentUserId))
            .OrderByDescending(c => c.CreatedAt)
            .ThenBy(c => c.Id)
            .Select(c => new ChildComplaintResponse(c.Id, c.Content, c.Status, c.Resolution, c.CreatedAt,
                c.ResolvedAt))
            .ToListAsync();
    }

    public async Task<int> CountAsync(string? status)
    {
        return await Filter(status).CountAsync();
    }

    // Mới nhất trước rồi id tăng dần để thứ tự cố định giữa các lần gọi, nhờ đó các trang không trùng hay
    // sót phản ánh
    public async Task<IReadOnlyList<ComplaintResponse>> GetPageAsync(string? status, int skip, int take)
    {
        return await ToResponse(Filter(status)
                .OrderByDescending(c => c.CreatedAt)
                .ThenBy(c => c.Id)
                .Skip(skip)
                .Take(take))
            .ToListAsync();
    }

    public async Task<ComplaintResponse?> FindAsync(Guid id)
    {
        return await ToResponse(_dbContext.Complaints.Where(c => c.Id == id)).FirstOrDefaultAsync();
    }

    public async Task<bool> ExistsAsync(Guid id)
    {
        return await _dbContext.Complaints.AnyAsync(c => c.Id == id);
    }

    public async Task<Guid?> FindSubmitterIdAsync(Guid id)
    {
        return await _dbContext.Complaints
            .Where(c => c.Id == id)
            .Select(c => (Guid?)c.SubmittedByUserId)
            .FirstOrDefaultAsync();
    }

    // Một câu UPDATE có điều kiện: hai Admin cùng xử lý thì câu chạy sau không khớp dòng nào vì câu trước
    // đã đặt Resolved, nên không ghi đè kết quả đã chốt. InProgress không đụng resolution và resolved_at,
    // vốn còn null vì phản ánh chưa từng Resolved
    public async Task<bool> TryHandleAsync(Guid id, string status, string? resolution, Guid handledByUserId,
        DateTime nowUtc)
    {
        var query = _dbContext.Complaints
            .Where(c => c.Id == id && c.Status != ComplaintStatuses.Resolved);

        var affected = status == ComplaintStatuses.Resolved
            ? await query.ExecuteUpdateAsync(setters => setters
                .SetProperty(c => c.Status, status)
                .SetProperty(c => c.Resolution, resolution)
                .SetProperty(c => c.ResolvedAt, (DateTime?)nowUtc)
                .SetProperty(c => c.HandledByUserId, (Guid?)handledByUserId))
            : await query.ExecuteUpdateAsync(setters => setters
                .SetProperty(c => c.Status, status)
                .SetProperty(c => c.HandledByUserId, (Guid?)handledByUserId));

        return affected > 0;
    }

    private IQueryable<Complaint> Filter(string? status)
    {
        var query = _dbContext.Complaints.AsNoTracking();
        return status is null ? query : query.Where(c => c.Status == status);
    }

    // Chỉ lấy họ tên trẻ, tên lớp hiện tại và họ tên người gửi; không nạp gì khác của trẻ (D40 mục 3, D45)
    private static IQueryable<ComplaintResponse> ToResponse(IQueryable<Complaint> query)
    {
        return query.Select(c => new ComplaintResponse(
            c.Id,
            c.ChildId,
            c.Child.FullName,
            c.Child.Class != null ? c.Child.Class.Name : null,
            c.SubmittedByUser.FullName,
            c.Content,
            c.Status,
            c.Resolution,
            c.CreatedAt,
            c.ResolvedAt));
    }
}
