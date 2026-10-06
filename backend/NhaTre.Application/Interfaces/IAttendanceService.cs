using NhaTre.Application.DTOs.Attendance;

namespace NhaTre.Application.Interfaces;

public interface IAttendanceService
{
    Task<AttendanceResponse?> GetByIdAsync(Guid id, Guid teacherUserId);
    Task<AttendanceHistoryResult> GetHistoryAsync(Guid? childId, Guid? classId, DateOnly? date, Guid teacherUserId);
    Task<AttendanceResult> CheckInAsync(CheckInRequest request, Guid teacherUserId);
}
