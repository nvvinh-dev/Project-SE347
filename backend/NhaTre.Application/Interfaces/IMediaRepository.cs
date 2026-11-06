using NhaTre.Domain.Entities;

namespace NhaTre.Application.Interfaces;

public interface IMediaRepository
{
    // Lớp chỉ khi tài khoản này là giáo viên chủ nhiệm (classes.homeroom_teacher_id, D40 mục 2). null khi lớp
    // không tồn tại hoặc do giáo viên khác chủ nhiệm
    Task<Class?> FindHomeroomClassAsync(Guid classId, Guid teacherUserId);

    void AddActivityPhotos(IEnumerable<ActivityPhoto> photos);

    Task SaveChangesAsync();

    // Hai method dưới cùng một phạm vi: ảnh của lớp trẻ đang học, chỉ khi trẻ liên kết với phụ huynh này
    // (child_guardians, D39 mục 10). Trẻ chưa xếp lớp thì không có ảnh nào
    Task<int> CountActivityPhotosOfChildForGuardianAsync(Guid childId, Guid parentUserId);

    // Mới nhất trước, trùng thời điểm thì theo id tăng dần
    Task<IReadOnlyList<ActivityPhoto>> GetActivityPhotosOfChildForGuardianAsync(Guid childId, Guid parentUserId,
        int skip, int take);
}
