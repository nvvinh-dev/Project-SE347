namespace NhaTre.Application.DTOs.Classes;

// Khoảng tuổi tính theo tháng, nhận trẻ có MinAgeMonths <= tuổi < MaxAgeMonths (BR-CLASS-03).
// Chỉ kèm id tài khoản và họ tên giáo viên, không kèm dữ liệu trẻ (D45)
public record ClassResponse(
    Guid Id,
    string Name,
    int? MinAgeMonths,
    int? MaxAgeMonths,
    ClassTeacherResponse? HomeroomTeacher,
    IReadOnlyList<ClassTeacherResponse> AssistantTeachers);

// UserId là id tài khoản giáo viên, cùng giá trị Admin gửi khi gán giáo viên chủ nhiệm hay giáo viên phụ
public record ClassTeacherResponse(Guid UserId, string FullName);
