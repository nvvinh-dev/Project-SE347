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

    // Lấy theo lớp hiện tại của trẻ, cùng cách xác định phạm vi với lúc tạo. Ảnh xếp theo id để mỗi lần
    // xem cùng một thứ tự. Không phải thứ tự đính: EF sinh id UUIDv7, nhưng các id sinh trong cùng mili
    // giây (các ảnh của một lần upload) không tăng dần
    public async Task<Incident?> FindIncidentInHomeroomClassAsync(Guid id, Guid teacherUserId)
    {
        return await _dbContext.Incidents
            .AsNoTracking()
            .Include(i => i.Child)
            .Include(i => i.IncidentPhotos.OrderBy(p => p.Id))
            .FirstOrDefaultAsync(i => i.Id == id
                && i.Child.Class!.HomeroomTeacher!.UserId == teacherUserId);
    }

    // Phía Y tế: không lọc lớp, kể cả trẻ chưa xếp lớp. Ảnh xếp theo id như phía giáo viên
    public async Task<Incident?> FindIncidentAsync(Guid id)
    {
        return await _dbContext.Incidents
            .AsNoTracking()
            .Include(i => i.Child)
            .Include(i => i.IncidentPhotos.OrderBy(p => p.Id))
            .FirstOrDefaultAsync(i => i.Id == id);
    }

    public void AddIncident(Incident incident)
    {
        _dbContext.Incidents.Add(incident);
    }

    // Sự cố nạp ở trên không được theo dõi, nên chỉ ghi các dòng incident_photos mới. Id do EF sinh ngay
    // lúc thêm, trước khi SaveChangesAsync
    public void AddIncidentPhotos(IEnumerable<IncidentPhoto> photos)
    {
        _dbContext.IncidentPhotos.AddRange(photos);
    }

    public async Task SaveChangesAsync()
    {
        await _dbContext.SaveChangesAsync();
    }
}
