namespace NhaTre.Domain.Constants;

/// Ba trạng thái điểm danh vào lớp — chốt ở D23, khớp CHECK CK_Attendance_Status (D51).
/// Không có "Đi muộn": suy ra từ check_in_time của bản ghi Present.
/// KHÔNG gõ chuỗi tay ở Service hay Controller — luôn dùng hằng số ở đây.
public static class AttendanceStatuses
{
    public const string Present = "Present";                 // Có mặt
    public const string AbsentExcused = "AbsentExcused";     // Vắng có phép
    public const string AbsentUnexcused = "AbsentUnexcused"; // Vắng không phép

    public static readonly IReadOnlyList<string> All = new[]
    {
        Present, AbsentExcused, AbsentUnexcused,
    };

    public static bool IsValid(string? status) => status is not null && All.Contains(status);
}
