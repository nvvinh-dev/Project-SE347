using System.Globalization;
using NhaTre.Application.DTOs.Health;
using NhaTre.Application.Interfaces;
using NhaTre.Domain.Constants;
using NhaTre.Domain.Entities;

namespace NhaTre.Application.Services;

public class HealthService : IHealthService
{
    // Nhiệt độ trong thông báo viết kiểu Việt Nam (37,5), không phụ thuộc culture của máy chủ
    private static readonly NumberFormatInfo VietnameseNumberFormat = new()
    {
        NumberDecimalSeparator = ","
    };

    private readonly IHealthRepository _healthRepository;
    private readonly INotificationService _notificationService;

    public HealthService(IHealthRepository healthRepository, INotificationService notificationService)
    {
        _healthRepository = healthRepository;
        _notificationService = notificationService;
    }

    public async Task<QuickHealthStatusResponse?> GetQuickHealthStatusByIdAsync(Guid id, Guid teacherUserId)
    {
        var quickHealthStatus = await _healthRepository.FindQuickHealthStatusInHomeroomClassAsync(id, teacherUserId);
        return quickHealthStatus is null ? null : ToResponse(quickHealthStatus, quickHealthStatus.Child.FullName);
    }

    // FR-HEALTH-01. Trẻ không tồn tại, chưa xếp lớp hay thuộc lớp khác đều ngoài phạm vi → 404
    // (BR-SCOPE-02, D40 mục 2). Thời điểm và người ghi nhận do server đặt (D44 mục 2). Bản ghi đã
    // tạo không sửa, không xóa
    public async Task<QuickHealthStatusResponse?> CreateQuickHealthStatusAsync(
        QuickHealthStatusRequest request, Guid teacherUserId)
    {
        var child = await _healthRepository.FindChildInHomeroomClassAsync(request.ChildId, teacherUserId);
        if (child is null)
            return null;

        var quickHealthStatus = new QuickHealthStatus
        {
            ChildId = child.Id,
            // Repository đã lọc lớp chủ nhiệm theo tài khoản đang đăng nhập, nên đây là hồ sơ teachers của chính người gọi
            RecordedByTeacherId = child.Class!.HomeroomTeacherId!.Value,
            RecordedAt = DateTime.UtcNow,
            Mood = request.Mood,
            TemperatureCelsius = request.TemperatureCelsius,
            Notes = request.Notes.Trim()
        };

        _healthRepository.AddQuickHealthStatus(quickHealthStatus);
        await _healthRepository.SaveChangesAsync();

        // D39 mục 6: gửi phụ huynh của đúng trẻ, sau khi bản ghi đã lưu. Không gửi Y tế (AC-NOTI-04)
        await _notificationService.NotifyParentsOfChildAsync(child.Id,
            QuickHealthStatusMessage(child.FullName, quickHealthStatus));

        return ToResponse(quickHealthStatus, child.FullName);
    }

    private static string QuickHealthStatusMessage(string childFullName, QuickHealthStatus quickHealthStatus)
    {
        var temperature = quickHealthStatus.TemperatureCelsius is null
            ? ""
            : $", nhiệt độ {quickHealthStatus.TemperatureCelsius.Value.ToString("0.0", VietnameseNumberFormat)} °C";

        return $"Giáo viên vừa ghi nhận sức khỏe của bé {childFullName}: tâm trạng " +
            $"{MoodDisplayName(quickHealthStatus.Mood)}{temperature}. Ghi chú: {quickHealthStatus.Notes}";
    }

    // Thông báo là câu tiếng Việt hoàn chỉnh do backend soạn (D25), nên không ghi giá trị tiếng Anh lưu trong database
    private static string MoodDisplayName(string mood) => mood switch
    {
        HealthMoods.Happy => "vui vẻ",
        HealthMoods.Normal => "bình thường",
        HealthMoods.Tired => "mệt",
        HealthMoods.Fussy => "quấy khóc",
        _ => throw new InvalidOperationException($"Tâm trạng không xử lý: {mood}")
    };

    private static QuickHealthStatusResponse ToResponse(QuickHealthStatus quickHealthStatus, string childFullName)
        => new(quickHealthStatus.Id, quickHealthStatus.ChildId, childFullName, quickHealthStatus.RecordedAt,
            quickHealthStatus.Mood, quickHealthStatus.TemperatureCelsius, quickHealthStatus.Notes);
}
