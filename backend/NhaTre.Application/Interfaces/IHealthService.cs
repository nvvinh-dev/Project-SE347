using NhaTre.Application.DTOs.Health;

namespace NhaTre.Application.Interfaces;

public interface IHealthService
{
    // null khi bản ghi không tồn tại hoặc ngoài phạm vi lớp chủ nhiệm
    Task<QuickHealthStatusResponse?> GetQuickHealthStatusByIdAsync(Guid id, Guid teacherUserId);

    // null khi trẻ ngoài phạm vi lớp chủ nhiệm, không có lý do thất bại nào khác
    Task<QuickHealthStatusResponse?> CreateQuickHealthStatusAsync(QuickHealthStatusRequest request, Guid teacherUserId);

    // Trẻ của mọi lớp do tài khoản này chủ nhiệm; chưa chủ nhiệm lớp nào thì danh sách rỗng
    Task<IReadOnlyList<HomeroomChildResponse>> GetHomeroomChildrenAsync(Guid teacherUserId);

    // null khi trẻ ngoài phạm vi lớp chủ nhiệm
    Task<HomeroomChildResponse?> GetHomeroomChildByIdAsync(Guid childId, Guid teacherUserId);

    // Trẻ toàn trường cho Y tế chọn; trường chưa có trẻ nào thì danh sách rỗng
    Task<IReadOnlyList<SchoolChildResponse>> GetSchoolChildrenAsync();

    // null khi trẻ không tồn tại, không có lý do thất bại nào khác
    Task<GrowthMeasurementResponse?> CreateGrowthMeasurementAsync(
        Guid childId, GrowthMeasurementRequest request, Guid medicalUserId);

    // null khi trẻ không tồn tại; trẻ chưa có số đo nào thì danh sách rỗng
    Task<IReadOnlyList<GrowthMeasurementResponse>?> GetGrowthMeasurementsOfChildAsync(Guid childId);

    // null khi số đo không tồn tại
    Task<GrowthMeasurementResponse?> GetGrowthMeasurementByIdAsync(Guid id);
}
