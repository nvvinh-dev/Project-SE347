using Microsoft.EntityFrameworkCore;
using NhaTre.Application.Interfaces;
using NhaTre.Domain.Entities;

namespace NhaTre.Infrastructure.Persistence.Repositories;

public class MediaRepository : IMediaRepository
{
    private readonly AppDbContext _dbContext;

    public MediaRepository(AppDbContext dbContext)
    {
        _dbContext = dbContext;
    }

    // Phạm vi nằm ngay trong câu truy vấn, cùng cách với sự cố: lớp chưa có giáo viên chủ nhiệm không khớp.
    // Chỉ đọc, không theo dõi: chia sẻ ảnh không sửa lớp
    public async Task<Class?> FindHomeroomClassAsync(Guid classId, Guid teacherUserId)
    {
        return await _dbContext.Classes
            .AsNoTracking()
            .FirstOrDefaultAsync(c => c.Id == classId && c.HomeroomTeacher!.UserId == teacherUserId);
    }

    // Lớp nạp ở trên không được theo dõi, nên chỉ ghi các dòng activity_photos mới. Id do EF sinh ngay lúc
    // thêm, trước khi SaveChangesAsync
    public void AddActivityPhotos(IEnumerable<ActivityPhoto> photos)
    {
        _dbContext.ActivityPhotos.AddRange(photos);
    }

    public async Task SaveChangesAsync()
    {
        await _dbContext.SaveChangesAsync();
    }
}
