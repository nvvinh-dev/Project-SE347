using NhaTre.Application.DTOs.Media;
using NhaTre.Domain.Entities;

namespace NhaTre.Application.Interfaces;

public interface IMediaRepository
{
    // Các lớp tài khoản này phụ trách (GVCN hoặc giáo viên phụ, D40 mục 2), xếp theo nhóm tuổi như GET api/classes.
    // Chỉ đọc id và tên (D45). Chưa phụ trách lớp nào thì danh sách rỗng
    Task<IReadOnlyList<HomeroomClassResponse>> GetHomeroomClassesAsync(Guid teacherUserId);

    // Lớp chỉ khi tài khoản này phụ trách (GVCN hoặc giáo viên phụ, D40 mục 2). null khi lớp không tồn tại hoặc
    // tài khoản này không phụ trách
    Task<Class?> FindHomeroomClassAsync(Guid classId, Guid teacherUserId);

    void AddActivityPhotos(IEnumerable<ActivityPhoto> photos);

    Task SaveChangesAsync();

    // Hồ sơ teachers của tài khoản này, để ghi người ghi nhận là chính giáo viên đã thao tác (D44 mục 2).
    // null khi tài khoản không có hồ sơ
    Task<Guid?> FindTeacherIdAsync(Guid teacherUserId);

    // Hai method dưới cùng một phạm vi: ảnh của lớp trẻ đang học, chỉ khi trẻ liên kết với phụ huynh này
    // (child_guardians, D39 mục 10). Trẻ chưa xếp lớp thì không có ảnh nào
    Task<int> CountActivityPhotosOfChildForGuardianAsync(Guid childId, Guid parentUserId);

    // Mới nhất trước, trùng thời điểm thì theo id tăng dần
    Task<IReadOnlyList<ActivityPhoto>> GetActivityPhotosOfChildForGuardianAsync(Guid childId, Guid parentUserId,
        int skip, int take);
}
