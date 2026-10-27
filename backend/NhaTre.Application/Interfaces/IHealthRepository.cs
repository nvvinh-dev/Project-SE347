using NhaTre.Domain.Entities;

namespace NhaTre.Application.Interfaces;

public interface IHealthRepository
{
    // Trẻ kèm Class, chỉ khi trẻ thuộc lớp do tài khoản này chủ nhiệm (classes.homeroom_teacher_id, D40 mục 2).
    // null khi trẻ không tồn tại, chưa xếp lớp hoặc thuộc lớp giáo viên khác
    Task<Child?> FindChildInHomeroomClassAsync(Guid childId, Guid teacherUserId);

    // Trẻ của mọi lớp do tài khoản này chủ nhiệm, sắp theo họ tên; chưa chủ nhiệm lớp nào thì rỗng
    Task<IReadOnlyList<Child>> GetChildrenInHomeroomClassesAsync(Guid teacherUserId);

    // Bản ghi sức khỏe nhanh kèm Child, cùng phạm vi lớp chủ nhiệm như trên
    Task<QuickHealthStatus?> FindQuickHealthStatusInHomeroomClassAsync(Guid id, Guid teacherUserId);

    void AddQuickHealthStatus(QuickHealthStatus quickHealthStatus);

    // Y tế làm việc với trẻ toàn trường, không lọc theo lớp (D43 mục 2)
    Task<bool> ChildExistsAsync(Guid childId);

    // Cùng phạm vi toàn trường như trên, không kèm Class; null khi trẻ không tồn tại
    Task<Child?> FindChildAsync(Guid childId);

    // Mọi trẻ trong trường, kể cả trẻ chưa xếp lớp, sắp theo họ tên
    Task<IReadOnlyList<Child>> GetAllChildrenAsync();

    // Số đo của một trẻ, mới nhất trước; trẻ chưa có số đo nào thì rỗng
    Task<IReadOnlyList<GrowthMeasurement>> GetGrowthMeasurementsOfChildAsync(Guid childId);

    Task<GrowthMeasurement?> FindGrowthMeasurementAsync(Guid id);

    void AddGrowthMeasurement(GrowthMeasurement growthMeasurement);

    // Hai nguồn còn lại của lịch sử gộp (D39 mục 9), chưa sắp thứ tự: Service gộp với số đo rồi mới
    // sắp. Trẻ chưa có bản ghi nào thì rỗng
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
}
