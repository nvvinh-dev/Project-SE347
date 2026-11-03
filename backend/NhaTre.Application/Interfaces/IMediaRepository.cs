using NhaTre.Domain.Entities;

namespace NhaTre.Application.Interfaces;

public interface IMediaRepository
{
    // Lớp chỉ khi tài khoản này là giáo viên chủ nhiệm (classes.homeroom_teacher_id, D40 mục 2). null khi lớp
    // không tồn tại hoặc do giáo viên khác chủ nhiệm
    Task<Class?> FindHomeroomClassAsync(Guid classId, Guid teacherUserId);

    void AddActivityPhotos(IEnumerable<ActivityPhoto> photos);

    Task SaveChangesAsync();
}
