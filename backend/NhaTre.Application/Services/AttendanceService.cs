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

    // FR-ATT-03. Phạm vi là các lớp tài khoản này chủ nhiệm (classes.homeroom_teacher_id, D40 mục 2),
    // tính theo lớp hiện tại của trẻ như FR-ATT-01. classId client gửi chỉ thu hẹp trong phạm vi đó:
    // lớp không do mình chủ nhiệm → 404 (AC-ATT-09). Giáo viên chưa chủ nhiệm lớp nào xem theo ngày
    // thì nhận danh sách rỗng, xem theo trẻ thì nhận 404 (UC-ATT-03 E1, D46 mục 3)
    public async Task<AttendanceHistoryResult> GetHistoryAsync(
        Guid? childId, Guid? classId, DateOnly? date, Guid teacherUserId)
    {
        if (classId is not null && !await _attendanceRepository.IsHomeroomClassAsync(classId.Value, teacherUserId))
            return new AttendanceHistoryResult(AttendanceHistoryOutcome.ClassNotFound);

        // Kiểm riêng trẻ để phân biệt trẻ ngoài phạm vi (404) với trẻ trong lớp chưa có bản ghi nào (danh sách rỗng)
        if (childId is not null)
        {
            var child = await _attendanceRepository.FindChildInHomeroomClassAsync(childId.Value, teacherUserId);
            if (child is null || (classId is not null && child.ClassId != classId))
                return new AttendanceHistoryResult(AttendanceHistoryOutcome.ChildNotFound);
        }

        var attendances = await _attendanceRepository.GetInHomeroomClassesAsync(teacherUserId, childId, classId, date);
        return new AttendanceHistoryResult(AttendanceHistoryOutcome.Success,
            attendances.Select(a => ToResponse(a, a.Child.FullName)).ToList());
    }

    // FR-ATT-02. Phạm vi là các trẻ có liên kết với tài khoản này trong child_guardians (BR-SCOPE-01,
    // D39 mục 10), không phụ thuộc lớp. null khi trẻ không tồn tại hoặc không liên kết, để Controller
    // trả 404 mà không lộ trẻ đó có tồn tại hay không (AC-ATT-04)
    public async Task<IReadOnlyList<ChildAttendanceResponse>?> GetChildHistoryForGuardianAsync(
        Guid childId, Guid parentUserId)
    {
        // Kiểm riêng liên kết để phân biệt trẻ ngoài phạm vi (404) với con mình chưa có bản ghi nào (danh sách rỗng)
        if (!await _attendanceRepository.IsGuardianOfChildAsync(childId, parentUserId))
            return null;

        var attendances = await _attendanceRepository.GetByChildForGuardianAsync(childId, parentUserId);
        return attendances
            .Select(a => new ChildAttendanceResponse(a.Id, a.AttendanceDate, a.CheckInTime, a.Status))
            .ToList();
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
