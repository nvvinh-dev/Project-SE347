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

        // Soạn thông báo trước khi lưu: tâm trạng chưa có tên tiếng Việt thì dừng ở đây, chưa ghi gì
        // vào database, giáo viên gửi lại không thành hai bản ghi
        var message = QuickHealthStatusMessage(child.FullName, quickHealthStatus);

        _healthRepository.AddQuickHealthStatus(quickHealthStatus);
        await _healthRepository.SaveChangesAsync();

        // D39 mục 6: gửi phụ huynh của đúng trẻ, sau khi bản ghi đã lưu. Không gửi Y tế (AC-NOTI-04)
        await _notificationService.NotifyParentsOfChildAsync(child.Id, message);

        return ToResponse(quickHealthStatus, child.FullName);
    }

    // FR-HEALTH-07. Đây cũng là danh sách trẻ của lớp để màn hình giáo viên chọn trẻ (D45). Giáo viên
    // chưa được gán lớp thì danh sách rỗng (UC-HEALTH-06)
    public async Task<IReadOnlyList<HomeroomChildResponse>> GetHomeroomChildrenAsync(Guid teacherUserId)
    {
        var children = await _healthRepository.GetChildrenInHomeroomClassesAsync(teacherUserId);
        return children.Select(ToHomeroomChild).ToList();
    }

    // Trẻ không tồn tại, chưa xếp lớp hay thuộc lớp khác đều ngoài phạm vi → 404 (AC-HEALTH-17)
    public async Task<HomeroomChildResponse?> GetHomeroomChildByIdAsync(Guid childId, Guid teacherUserId)
    {
        var child = await _healthRepository.FindChildInHomeroomClassAsync(childId, teacherUserId);
        return child is null ? null : ToHomeroomChild(child);
    }

    // Danh sách để màn hình Y tế chọn trẻ (ghi số đo, xem lịch sử, ghi lưu ý). Y tế làm việc với trẻ
    // toàn trường (D43 mục 2), nên trẻ chưa xếp lớp vẫn có trong danh sách; không phân trang
    public async Task<IReadOnlyList<SchoolChildResponse>> GetSchoolChildrenAsync()
    {
        var children = await _healthRepository.GetAllChildrenAsync();
        return children.Select(ToSchoolChild).ToList();
    }

    // FR-HEALTH-02, FR-HEALTH-03. Y tế ghi số đo cho trẻ toàn trường (D43 mục 2), nên chỉ trẻ không
    // tồn tại mới là 404. Thời điểm đo và người ghi nhận do server đặt (D44 mục 2, AC-HEALTH-09). Số
    // đo không sinh thông báo (D39 mục 6); đã tạo thì không sửa, không xóa
    public async Task<GrowthMeasurementResponse?> CreateGrowthMeasurementAsync(
        Guid childId, GrowthMeasurementRequest request, Guid medicalUserId)
    {
        if (!await _healthRepository.ChildExistsAsync(childId))
            return null;

        var growthMeasurement = new GrowthMeasurement
        {
            ChildId = childId,
            RecordedByUserId = medicalUserId,
            MeasuredAt = DateTime.UtcNow,
            HeightCm = request.HeightCm,
            WeightKg = request.WeightKg
        };

        _healthRepository.AddGrowthMeasurement(growthMeasurement);
        await _healthRepository.SaveChangesAsync();

        return ToGrowthMeasurement(growthMeasurement);
    }

    public async Task<IReadOnlyList<GrowthMeasurementResponse>?> GetGrowthMeasurementsOfChildAsync(Guid childId)
    {
        if (!await _healthRepository.ChildExistsAsync(childId))
            return null;

        var growthMeasurements = await _healthRepository.GetGrowthMeasurementsOfChildAsync(childId);
        return growthMeasurements.Select(ToGrowthMeasurement).ToList();
    }

    public async Task<GrowthMeasurementResponse?> GetGrowthMeasurementByIdAsync(Guid id)
    {
        var growthMeasurement = await _healthRepository.FindGrowthMeasurementAsync(id);
        return growthMeasurement is null ? null : ToGrowthMeasurement(growthMeasurement);
    }

    // FR-HEALTH-04. Y tế xem lịch sử của trẻ toàn trường (BR-HEALTH-04), nên chỉ trẻ không tồn tại mới
    // là 404. Gộp cả 3 nguồn, mới nhất trước (D39 mục 9); trùng thời điểm thì sắp tiếp theo id để thứ tự
    // không đổi giữa các lần gọi. Không phân trang, như các lịch sử khác (api-conventions §2.1)
    public async Task<HealthHistoryResponse?> GetHealthHistoryAsync(Guid childId)
    {
        var child = await _healthRepository.FindChildAsync(childId);
        if (child is null)
            return null;

        var incidents = await _healthRepository.GetIncidentsOfChildAsync(childId);
        var quickHealthStatuses = await _healthRepository.GetQuickHealthStatusesOfChildAsync(childId);
        var growthMeasurements = await _healthRepository.GetGrowthMeasurementsOfChildAsync(childId);

        IEnumerable<HealthHistoryItemResponse> items = incidents.Select(ToIncidentHistoryItem);
        var history = items
            .Concat(quickHealthStatuses.Select(ToQuickHealthStatusHistoryItem))
            .Concat(growthMeasurements.Select(ToGrowthMeasurementHistoryItem))
            .OrderByDescending(item => item.OccurredAtUtc)
            .ThenBy(item => item.Id)
            .ToList();

        return new HealthHistoryResponse(ToSchoolChild(child), history);
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

    private static HomeroomChildResponse ToHomeroomChild(Child child)
        => new(child.Id, child.FullName, HealthNotesOrNull(child));

    private static SchoolChildResponse ToSchoolChild(Child child)
        => new(child.Id, child.FullName, child.DateOfBirth, HealthNotesOrNull(child));

    // Lưu ý chỉ có khoảng trắng coi như không có, để giao diện chỉ phải xét null khi đánh dấu trẻ (AC-HEALTH-16)
    private static string? HealthNotesOrNull(Child child)
        => string.IsNullOrWhiteSpace(child.HealthNotes) ? null : child.HealthNotes;

    private static GrowthMeasurementResponse ToGrowthMeasurement(GrowthMeasurement growthMeasurement)
        => new(growthMeasurement.Id, growthMeasurement.ChildId, growthMeasurement.MeasuredAt,
            growthMeasurement.HeightCm, growthMeasurement.WeightKg);

    private static IncidentHistoryItemResponse ToIncidentHistoryItem(Incident incident)
        => new(incident.Id, incident.OccurredAt, incident.Description);

    private static QuickHealthStatusHistoryItemResponse ToQuickHealthStatusHistoryItem(
        QuickHealthStatus quickHealthStatus)
        => new(quickHealthStatus.Id, quickHealthStatus.RecordedAt, quickHealthStatus.Mood,
            quickHealthStatus.TemperatureCelsius, quickHealthStatus.Notes);

    private static GrowthMeasurementHistoryItemResponse ToGrowthMeasurementHistoryItem(
        GrowthMeasurement growthMeasurement)
        => new(growthMeasurement.Id, growthMeasurement.MeasuredAt, growthMeasurement.HeightCm,
            growthMeasurement.WeightKg);
}
