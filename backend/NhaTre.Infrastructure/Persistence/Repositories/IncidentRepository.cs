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

    // Vẫn lọc liên kết dù Service đã kiểm liên kết trước, để liên kết bị gỡ giữa hai lần đọc thì không trả dữ
    // liệu. Trùng thời điểm thì sắp tiếp theo id để thứ tự không đổi giữa các lần gọi. Ảnh nạp kèm chỉ để
    // đếm; danh sách không ký URL (D39 mục 9)
    public async Task<IReadOnlyList<Incident>> GetIncidentsOfChildForGuardianAsync(Guid childId, Guid parentUserId)
    {
        return await _dbContext.Incidents
            .AsNoTracking()
            .Include(i => i.IncidentPhotos)
            .Where(i => i.ChildId == childId
                && i.Child.ChildGuardians.Any(cg => cg.GuardianUserId == parentUserId))
            .OrderByDescending(i => i.OccurredAt)
            .ThenBy(i => i.Id)
            .ToListAsync();
    }

    // Phạm vi nằm ngay trong câu truy vấn: đổi id sự cố hay id trẻ trên URL sang dữ liệu ngoài phạm vi đều
    // không khớp. Ảnh xếp theo id như phía giáo viên
    public async Task<Incident?> FindIncidentOfChildForGuardianAsync(Guid childId, Guid incidentId,
        Guid parentUserId)
    {
        return await _dbContext.Incidents
            .AsNoTracking()
            .Include(i => i.IncidentPhotos.OrderBy(p => p.Id))
            .FirstOrDefaultAsync(i => i.Id == incidentId
                && i.ChildId == childId
                && i.Child.ChildGuardians.Any(cg => cg.GuardianUserId == parentUserId));
    }
}
