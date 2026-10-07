using NhaTre.Application.DTOs.Health;

namespace NhaTre.Application.Interfaces;

public interface IHealthService
{
    // null khi bản ghi không tồn tại hoặc ngoài phạm vi lớp chủ nhiệm
    Task<QuickHealthStatusResponse?> GetQuickHealthStatusByIdAsync(Guid id, Guid teacherUserId);

    // null khi trẻ ngoài phạm vi lớp chủ nhiệm, không có lý do thất bại nào khác
    Task<QuickHealthStatusResponse?> CreateQuickHealthStatusAsync(QuickHealthStatusRequest request, Guid teacherUserId);
}
