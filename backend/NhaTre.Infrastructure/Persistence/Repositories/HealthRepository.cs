using Microsoft.EntityFrameworkCore;
using NhaTre.Application.Interfaces;
using NhaTre.Domain.Entities;

namespace NhaTre.Infrastructure.Persistence.Repositories;

public class HealthRepository : IHealthRepository
{
    private readonly AppDbContext _dbContext;

    public HealthRepository(AppDbContext dbContext)
    {
        _dbContext = dbContext;
    }

    // Phạm vi nằm ngay trong câu truy vấn: trẻ chưa xếp lớp (class_id null) hay lớp chưa có
    // giáo viên chủ nhiệm đều không khớp. Chỉ đọc, không theo dõi: ghi sức khỏe không sửa hồ sơ trẻ
    public async Task<Child?> FindChildInHomeroomClassAsync(Guid childId, Guid teacherUserId)
    {
        return await _dbContext.Children
            .AsNoTracking()
            .Include(c => c.Class)
            .FirstOrDefaultAsync(c => c.Id == childId
                && c.Class!.HomeroomTeacher!.UserId == teacherUserId);
    }

    // Cùng phạm vi lớp chủ nhiệm như trên. Trùng họ tên thì sắp tiếp theo id để thứ tự không đổi
    // giữa các lần gọi
    public async Task<IReadOnlyList<Child>> GetChildrenInHomeroomClassesAsync(Guid teacherUserId)
    {
        return await _dbContext.Children
            .AsNoTracking()
            .Where(c => c.Class!.HomeroomTeacher!.UserId == teacherUserId)
            .OrderBy(c => c.FullName)
            .ThenBy(c => c.Id)
            .ToListAsync();
    }

    // Lấy theo lớp hiện tại của trẻ, cùng cách xác định phạm vi với lúc tạo
    public async Task<QuickHealthStatus?> FindQuickHealthStatusInHomeroomClassAsync(Guid id, Guid teacherUserId)
    {
        return await _dbContext.QuickHealthStatuses
            .AsNoTracking()
            .Include(q => q.Child)
            .FirstOrDefaultAsync(q => q.Id == id
                && q.Child.Class!.HomeroomTeacher!.UserId == teacherUserId);
    }

    public void AddQuickHealthStatus(QuickHealthStatus quickHealthStatus)
    {
        _dbContext.QuickHealthStatuses.Add(quickHealthStatus);
    }

    public async Task SaveChangesAsync()
    {
        await _dbContext.SaveChangesAsync();
    }
}
