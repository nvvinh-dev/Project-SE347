namespace NhaTre.Application.DTOs.AbsenceFollowUps;

// Một lần liên hệ đã ghi. Admin cũng nhận đúng các trường này (BR-ATTENDANCE-08), nên không có id
// giáo viên hay id bản điểm danh
public record AbsenceFollowUpResponse(
    string Outcome,
    string? Note,
    string RecordedByTeacherName,
    DateTime RecordedAtUtc);
