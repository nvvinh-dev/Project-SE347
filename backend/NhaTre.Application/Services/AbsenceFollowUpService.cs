using NhaTre.Application.Common;
using NhaTre.Application.DTOs.AbsenceFollowUps;
using NhaTre.Application.Interfaces;
using NhaTre.Domain.Constants;
using NhaTre.Domain.Entities;

namespace NhaTre.Application.Services;

// FR-ATT-04 (D39 mục 20): giáo viên liên hệ người đón của trẻ vắng không phép hôm nay và ghi kết quả;
// không liên lạc được thì báo Ban giám hiệu. Ngày "hôm nay" theo giờ Việt Nam (D23)
public class AbsenceFollowUpService : IAbsenceFollowUpService
{
    // BR-ATTENDANCE-08: từ giờ này trẻ vắng không phép chưa được liên hệ lần nào lên danh sách của Admin
    private static readonly TimeOnly UncontactedEscalationTime = new(10, 0);

    private readonly IAbsenceFollowUpRepository _absenceFollowUpRepository;
    private readonly INotificationService _notificationService;

    public AbsenceFollowUpService(
        IAbsenceFollowUpRepository absenceFollowUpRepository,
        INotificationService notificationService)
    {
        _absenceFollowUpRepository = absenceFollowUpRepository;
        _notificationService = notificationService;
    }

    // Giáo viên chưa phụ trách lớp nào nhận danh sách rỗng
    public async Task<IReadOnlyList<AbsenceTodayResponse>> GetTodayForTeacherAsync(Guid teacherUserId)
    {
        var today = VietnamTime.DateOf(DateTime.UtcNow);
        var attendances = await _absenceFollowUpRepository.GetUnexcusedInScopeAsync(today, teacherUserId);
        var followUps = await GetFollowUpsByAttendanceAsync(attendances);

        return attendances
            .Select(a => new AbsenceTodayResponse(
                a.Id,
                a.ChildId,
                a.Child.FullName,
                a.Child.ClassId!.Value,
                a.Child.Class!.Name,
                a.Child.RegisteredPickupPersons
                    .OrderBy(p => p.Priority)
                    .Select(p => new AbsencePickupContactResponse(p.Priority, p.FullName, p.Relationship, p.PhoneNumber))
                    .ToList(),
                followUps[a.Id]))
            .ToList();
    }

    // Kiểm phạm vi (404) trước điều kiện ghi (409), để giáo viên lớp khác không dò được trạng thái
    // điểm danh của trẻ không thuộc lớp mình (AC-ATT-15)
    public async Task<AbsenceFollowUpResult> CreateAsync(
        Guid attendanceId, CreateAbsenceFollowUpRequest request, Guid teacherUserId)
    {
        var attendance = await _absenceFollowUpRepository.FindAttendanceInScopeAsync(attendanceId, teacherUserId);
        if (attendance is null)
            return new AbsenceFollowUpResult(AbsenceFollowUpOutcome.AttendanceNotFound);

        // Người ghi là chính giáo viên đang thao tác, kể cả giáo viên phụ (D44 mục 2); không còn hồ sơ
        // teachers thì coi như ngoài phạm vi, như FR-ATT-01
        var teacherId = await _absenceFollowUpRepository.FindTeacherIdAsync(teacherUserId);
        if (teacherId is null)
            return new AbsenceFollowUpResult(AbsenceFollowUpOutcome.AttendanceNotFound);

        var now = DateTime.UtcNow;

        // BR-ATTENDANCE-07: chỉ ghi cho bản vắng không phép của hôm nay; trạng thái điểm danh không đổi
        if (attendance.Status != AttendanceStatuses.AbsentUnexcused
            || attendance.AttendanceDate != VietnamTime.DateOf(now))
            return new AbsenceFollowUpResult(AbsenceFollowUpOutcome.NotUnexcusedToday);

        var followUp = new AbsenceFollowUp
        {
            AttendanceId = attendance.Id,
            RecordedByTeacherId = teacherId.Value,
            Outcome = request.Outcome,
            Note = string.IsNullOrWhiteSpace(request.Note) ? null : request.Note.Trim(),
            RecordedAt = now
        };

        await _absenceFollowUpRepository.AddAsync(followUp);

        // BR-ATTENDANCE-08, D39 mục 6 sự kiện 8: lưu xong mới báo mọi Admin đang hoạt động. Nội dung chỉ
        // có họ tên trẻ và lớp, không chép ghi chú hay thông tin người đón
        if (followUp.Outcome == AbsenceFollowUpOutcomes.Unreachable)
        {
            await _notificationService.NotifyActiveAdminsAsync(
                $"Giáo viên không liên lạc được với người đón của bé {attendance.Child.FullName} "
                + $"({attendance.Child.Class!.Name}), vắng không phép hôm nay. Ban giám hiệu cần xử lý tiếp.");
        }

        var teacherName = await _absenceFollowUpRepository.FindUserFullNameAsync(teacherUserId) ?? string.Empty;
        return new AbsenceFollowUpResult(AbsenceFollowUpOutcome.Success,
            new AbsenceFollowUpResponse(followUp.Outcome, followUp.Note, teacherName, followUp.RecordedAt));
    }

    // BR-ATTENDANCE-08: trẻ có lần liên hệ sau cùng là Unreachable, và từ 10:00 giờ Việt Nam thêm trẻ
    // chưa có lần liên hệ nào. Lần sau cùng là liên lạc được thì trẻ rời khỏi danh sách (AC-ATT-13)
    public async Task<IReadOnlyList<AbsenceEscalationResponse>> GetTodayEscalationsAsync()
    {
        var now = DateTime.UtcNow;
        var today = VietnamTime.DateOf(now);
        var includeUncontacted = TimeOnly.FromDateTime(VietnamTime.ToVietnamTime(now)) >= UncontactedEscalationTime;

        var attendances = await _absenceFollowUpRepository.GetUnexcusedAsync(today);
        var followUps = await GetFollowUpsByAttendanceAsync(attendances);

        return attendances
            .Where(a =>
            {
                var items = followUps[a.Id];
                return items.Count == 0
                    ? includeUncontacted
                    : items[^1].Outcome == AbsenceFollowUpOutcomes.Unreachable;
            })
            .Select(a => new AbsenceEscalationResponse(a.Child.FullName, a.Child.Class!.Name, followUps[a.Id]))
            .ToList();
    }

    // Các lần liên hệ của từng bản điểm danh, cũ trước; lần sau cùng là kết quả (D39 mục 20)
    private async Task<IReadOnlyDictionary<Guid, IReadOnlyList<AbsenceFollowUpResponse>>> GetFollowUpsByAttendanceAsync(
        IReadOnlyList<Attendance> attendances)
    {
        var followUps = await _absenceFollowUpRepository.GetFollowUpsAsync(attendances.Select(a => a.Id).ToList());
        var lookup = followUps.ToLookup(f => f.AttendanceId);

        return attendances.ToDictionary(
            a => a.Id,
            a => (IReadOnlyList<AbsenceFollowUpResponse>)lookup[a.Id]
                .Select(f => new AbsenceFollowUpResponse(f.Outcome, f.Note, f.RecordedByTeacher.User.FullName, f.RecordedAt))
                .ToList());
    }
}
