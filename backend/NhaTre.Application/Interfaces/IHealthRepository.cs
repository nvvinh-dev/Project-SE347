using NhaTre.Domain.Entities;

namespace NhaTre.Application.Interfaces;

public interface IHealthRepository
{
    // Trẻ, chỉ khi trẻ thuộc lớp tài khoản này phụ trách (GVCN hoặc giáo viên phụ, D40 mục 2).
    // null khi trẻ không tồn tại, chưa xếp lớp hoặc thuộc lớp giáo viên khác
    Task<Child?> FindChildInHomeroomClassAsync(Guid childId, Guid teacherUserId);

    // Trẻ của mọi lớp tài khoản này phụ trách, sắp theo họ tên; chưa phụ trách lớp nào thì rỗng
    Task<IReadOnlyList<Child>> GetChildrenInHomeroomClassesAsync(Guid teacherUserId);

    // Bản ghi sức khỏe nhanh kèm Child, cùng phạm vi lớp phụ trách như trên
    Task<QuickHealthStatus?> FindQuickHealthStatusInHomeroomClassAsync(Guid id, Guid teacherUserId);

    void AddQuickHealthStatus(QuickHealthStatus quickHealthStatus);

    // Y tế làm việc với trẻ toàn trường, không lọc theo lớp (D43 mục 2)
    Task<bool> ChildExistsAsync(Guid childId);

    // Cùng phạm vi toàn trường như trên, không kèm Class; null khi trẻ không tồn tại
    Task<Child?> FindChildAsync(Guid childId);

    // Như trên nhưng có theo dõi thay đổi, để Service sửa lưu ý sức khỏe rồi SaveChangesAsync (FR-HEALTH-06)
    Task<Child?> FindChildForUpdateAsync(Guid childId);

    // Mọi trẻ trong trường, kể cả trẻ chưa xếp lớp, sắp theo họ tên
    Task<IReadOnlyList<Child>> GetAllChildrenAsync();

    // Số đo của một trẻ, mới nhất trước; trẻ chưa có số đo nào thì rỗng
    Task<IReadOnlyList<GrowthMeasurement>> GetGrowthMeasurementsOfChildAsync(Guid childId);

    Task<GrowthMeasurement?> FindGrowthMeasurementAsync(Guid id);

    void AddGrowthMeasurement(GrowthMeasurement growthMeasurement);

    // Hai nguồn còn lại của lịch sử gộp (D39 mục 9), chưa sắp thứ tự: Service gộp với số đo rồi mới
    // sắp. Trẻ chưa có bản ghi nào thì rỗng. Sự cố kèm IncidentPhotos để đếm số ảnh
    Task<IReadOnlyList<Incident>> GetIncidentsOfChildAsync(Guid childId);

    Task<IReadOnlyList<QuickHealthStatus>> GetQuickHealthStatusesOfChildAsync(Guid childId);

    // Phụ huynh (FR-HEALTH-05): trẻ chỉ khi có liên kết với tài khoản này trong child_guardians
    // (BR-SCOPE-01); null khi trẻ không tồn tại hoặc không liên kết
    Task<Child?> FindChildOfGuardianAsync(Guid childId, Guid parentUserId);

    // Cùng phạm vi child_guardians như trên, mới nhất trước; con chưa có bản ghi nào thì rỗng
    Task<IReadOnlyList<QuickHealthStatus>> GetQuickHealthStatusesOfChildForGuardianAsync(
        Guid childId, Guid parentUserId);

    Task<IReadOnlyList<GrowthMeasurement>> GetGrowthMeasurementsOfChildForGuardianAsync(
        Guid childId, Guid parentUserId);

    Task SaveChangesAsync();

    // Hồ sơ teachers của tài khoản này, để ghi người ghi nhận là chính giáo viên đã thao tác (D44 mục 2).
    // null khi tài khoản không có hồ sơ
    Task<Guid?> FindTeacherIdAsync(Guid teacherUserId);
}
