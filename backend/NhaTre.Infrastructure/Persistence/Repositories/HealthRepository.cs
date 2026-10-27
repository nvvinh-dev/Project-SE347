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

    public async Task<bool> ChildExistsAsync(Guid childId)
    {
        return await _dbContext.Children.AnyAsync(c => c.Id == childId);
    }

    public async Task<Child?> FindChildAsync(Guid childId)
    {
        return await _dbContext.Children
            .AsNoTracking()
            .FirstOrDefaultAsync(c => c.Id == childId);
    }

    // Không lọc theo lớp nên không cần Include(Class). Trùng họ tên thì sắp tiếp theo id như danh sách
    // lớp chủ nhiệm
    public async Task<IReadOnlyList<Child>> GetAllChildrenAsync()
    {
        return await _dbContext.Children
            .AsNoTracking()
            .OrderBy(c => c.FullName)
            .ThenBy(c => c.Id)
            .ToListAsync();
    }

    // Mới nhất trước, như lịch sử gộp Y tế xem (D39 mục 9). Trùng thời điểm thì sắp tiếp theo id để
    // thứ tự không đổi giữa các lần gọi
    public async Task<IReadOnlyList<GrowthMeasurement>> GetGrowthMeasurementsOfChildAsync(Guid childId)
    {
        return await _dbContext.GrowthMeasurements
            .AsNoTracking()
            .Where(g => g.ChildId == childId)
            .OrderByDescending(g => g.MeasuredAt)
            .ThenBy(g => g.Id)
            .ToListAsync();
    }

    public async Task<GrowthMeasurement?> FindGrowthMeasurementAsync(Guid id)
    {
        return await _dbContext.GrowthMeasurements
            .AsNoTracking()
            .FirstOrDefaultAsync(g => g.Id == id);
    }

    public void AddGrowthMeasurement(GrowthMeasurement growthMeasurement)
    {
        _dbContext.GrowthMeasurements.Add(growthMeasurement);
    }

    // Lịch sử gộp đọc thẳng bảng incidents thay vì đi qua IncidentRepository: repository viết theo
    // từng tính năng (D35), và tính năng này của Y tế không lọc theo lớp chủ nhiệm như phía giáo viên
    public async Task<IReadOnlyList<Incident>> GetIncidentsOfChildAsync(Guid childId)
    {
        return await _dbContext.Incidents
            .AsNoTracking()
            .Where(i => i.ChildId == childId)
            .ToListAsync();
    }

    public async Task<IReadOnlyList<QuickHealthStatus>> GetQuickHealthStatusesOfChildAsync(Guid childId)
    {
        return await _dbContext.QuickHealthStatuses
            .AsNoTracking()
            .Where(q => q.ChildId == childId)
            .ToListAsync();
    }

    public async Task SaveChangesAsync()
    {
        await _dbContext.SaveChangesAsync();
    }
}
