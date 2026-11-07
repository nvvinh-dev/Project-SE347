using NhaTre.Domain.Entities;

namespace NhaTre.Application.Interfaces;

public interface IMediaRepository
{
    // Lớp chỉ khi tài khoản này phụ trách (GVCN hoặc giáo viên phụ, D40 mục 2). null khi lớp không tồn tại hoặc
    // tài khoản này không phụ trách
    Task<Class?> FindHomeroomClassAsync(Guid classId, Guid teacherUserId);

    void AddActivityPhotos(IEnumerable<ActivityPhoto> photos);

    Task SaveChangesAsync();

    // Hồ sơ teachers của tài khoản này, để ghi người ghi nhận là chính giáo viên đã thao tác (D44 mục 2).
    // null khi tài khoản không có hồ sơ
    Task<Guid?> FindTeacherIdAsync(Guid teacherUserId);
}
