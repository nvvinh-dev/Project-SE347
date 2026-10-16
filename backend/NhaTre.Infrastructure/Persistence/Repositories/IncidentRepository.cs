using Microsoft.EntityFrameworkCore;
using NhaTre.Application.Interfaces;
using NhaTre.Domain.Entities;

namespace NhaTre.Infrastructure.Persistence.Repositories;

public class IncidentRepository : IIncidentRepository
{
    private readonly AppDbContext _dbContext;

    public IncidentRepository(AppDbContext dbContext)
    {
        _dbContext = dbContext;
    }

    // Phạm vi nằm ngay trong câu truy vấn, cùng cách với sức khỏe nhanh: trẻ chưa xếp lớp (class_id
    // null) hay lớp chưa có giáo viên chủ nhiệm đều không khớp. Chỉ đọc, không theo dõi: ghi sự cố không
    // sửa hồ sơ trẻ
    public async Task<Child?> FindChildInHomeroomClassAsync(Guid childId, Guid teacherUserId)
    {
        return await _dbContext.Children
            .AsNoTracking()
            .Include(c => c.Class)
            .FirstOrDefaultAsync(c => c.Id == childId
                && c.Class!.HomeroomTeacher!.UserId == teacherUserId);
    }

    // Lấy theo lớp hiện tại của trẻ, cùng cách xác định phạm vi với lúc tạo
    public async Task<Incident?> FindIncidentInHomeroomClassAsync(Guid id, Guid teacherUserId)
    {
        return await _dbContext.Incidents
            .AsNoTracking()
            .Include(i => i.Child)
            .FirstOrDefaultAsync(i => i.Id == id
                && i.Child.Class!.HomeroomTeacher!.UserId == teacherUserId);
    }

    public void AddIncident(Incident incident)
    {
        _dbContext.Incidents.Add(incident);
    }

    public async Task SaveChangesAsync()
    {
        await _dbContext.SaveChangesAsync();
    }
}
