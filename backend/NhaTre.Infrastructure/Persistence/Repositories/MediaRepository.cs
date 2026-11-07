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

    public async Task<int> CountActivityPhotosOfChildForGuardianAsync(Guid childId, Guid parentUserId)
    {
        return await ActivityPhotosOfChildForGuardian(childId, parentUserId).CountAsync();
    }

    // Các ảnh của một lần chia sẻ cùng uploaded_at, nên xếp thêm theo id để thứ tự cố định giữa các lần gọi,
    // nhờ đó các trang không trùng hay sót ảnh
    public async Task<IReadOnlyList<ActivityPhoto>> GetActivityPhotosOfChildForGuardianAsync(Guid childId,
        Guid parentUserId, int skip, int take)
    {
        return await ActivityPhotosOfChildForGuardian(childId, parentUserId)
            .AsNoTracking()
            .OrderByDescending(p => p.UploadedAt)
            .ThenBy(p => p.Id)
            .Skip(skip)
            .Take(take)
            .ToListAsync();
    }

    // Phạm vi nằm ngay trong câu truy vấn như sự cố của phụ huynh: ảnh thuộc lớp mà trẻ này đang học, và trẻ
    // liên kết với tài khoản đang đăng nhập. So thẳng children.class_id với activity_photos.class_id thay vì đi
    // qua navigation Class, để EF không JOIN classes. Trẻ có class_id null không khớp ảnh nào
    private IQueryable<ActivityPhoto> ActivityPhotosOfChildForGuardian(Guid childId, Guid parentUserId)
    {
        return _dbContext.ActivityPhotos
            .Where(p => _dbContext.Children.Any(c => c.Id == childId && c.ClassId == p.ClassId
                && c.ChildGuardians.Any(cg => cg.GuardianUserId == parentUserId)));
    }
}
