namespace NhaTre.Application.DTOs.Attendance;

// AttendanceDate là ngày theo giờ Việt Nam; CheckInTimeUtc là giờ server ghi nhận, hiểu theo D23:
// với Present là giờ trẻ đến lớp, với hai trạng thái vắng là lúc giáo viên chốt sổ
public record AttendanceResponse(
    Guid Id,
    Guid ChildId,
    string ChildFullName,
    DateOnly AttendanceDate,
    DateTime CheckInTimeUtc,
    string Status);
