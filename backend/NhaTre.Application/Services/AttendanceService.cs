using NhaTre.Application.DTOs.Attendance;
using NhaTre.Application.Interfaces;
using NhaTre.Domain.Entities;

namespace NhaTre.Application.Services;

public class AttendanceService : IAttendanceService
{
    // D23: "hôm nay" tính theo giờ Việt Nam, không theo múi giờ của máy chủ
    private static readonly TimeZoneInfo VietnamTimeZone = TimeZoneInfo.FindSystemTimeZoneById("Asia/Ho_Chi_Minh");

    private readonly IAttendanceRepository _attendanceRepository;

    public AttendanceService(IAttendanceRepository attendanceRepository)
    {
        _attendanceRepository = attendanceRepository;
    }

    public async Task<AttendanceResponse?> GetByIdAsync(Guid id, Guid teacherUserId)
    {
        var attendance = await _attendanceRepository.FindByIdInHomeroomClassAsync(id, teacherUserId);
        return attendance is null ? null : ToResponse(attendance, attendance.Child.FullName);
    }

    // FR-ATT-01. Trẻ không tồn tại, chưa xếp lớp hay thuộc lớp khác đều ngoài phạm vi → 404
    // (BR-ATTENDANCE-02, D40 mục 2). Ngày, giờ và người ghi nhận do server đặt (D23, D44 mục 2)
    public async Task<AttendanceResult> CheckInAsync(CheckInRequest request, Guid teacherUserId)
    {
        var child = await _attendanceRepository.FindChildInHomeroomClassAsync(request.ChildId, teacherUserId);
        if (child is null)
            return new AttendanceResult(AttendanceOutcome.ChildNotFound);

        var now = DateTime.UtcNow;
        var today = DateOnly.FromDateTime(TimeZoneInfo.ConvertTimeFromUtc(now, VietnamTimeZone));

        // BR-ATTENDANCE-04: đã có bản ghi hôm nay thì từ chối, không ghi đè
        if (await _attendanceRepository.ExistsAsync(child.Id, today))
            return new AttendanceResult(AttendanceOutcome.AlreadyCheckedIn);

        var attendance = new Attendance
        {
            ChildId = child.Id,
            // Repository đã lọc lớp chủ nhiệm theo tài khoản đang đăng nhập, nên đây là hồ sơ teachers của chính người gọi
            RecordedByTeacherId = child.Class!.HomeroomTeacherId!.Value,
            AttendanceDate = today,
            CheckInTime = now,
            Status = request.Status
        };

        // Hai request cùng lúc cho một trẻ đều qua được bước kiểm ở trên; UNIQUE (child_id, attendance_date)
        // chặn request đến sau, và request đó cũng nhận 409 chứ không phải 500
        if (!await _attendanceRepository.TryAddAsync(attendance))
            return new AttendanceResult(AttendanceOutcome.AlreadyCheckedIn);

        return new AttendanceResult(AttendanceOutcome.Success, ToResponse(attendance, child.FullName));
    }

    private static AttendanceResponse ToResponse(Attendance attendance, string childFullName)
        => new(attendance.Id, attendance.ChildId, childFullName, attendance.AttendanceDate,
            attendance.CheckInTime, attendance.Status);
}
