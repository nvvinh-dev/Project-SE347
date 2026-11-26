namespace NhaTre.Application.DTOs.Classes;

// Khoảng tuổi là của khối, nhận trẻ có MinAgeMonths <= tuổi < MaxAgeMonths (BR-CLASS-03, D39 mục 3).
// Sĩ số null là không giới hạn (FR-CLASS-04). Chỉ kèm số trẻ, id tài khoản và họ tên giáo viên, không kèm
// dữ liệu từng trẻ (D45)
public record ClassResponse(
    Guid Id,
    string Name,
    ClassGradeLevelResponse GradeLevel,
    int MinAgeMonths,
    int MaxAgeMonths,
    int? MinCapacity,
    int? MaxCapacity,
    int ChildCount,
    ClassTeacherResponse? HomeroomTeacher,
    IReadOnlyList<ClassTeacherResponse> AssistantTeachers);

public record ClassGradeLevelResponse(short Id, string Name);

// UserId là id tài khoản giáo viên, cùng giá trị Admin gửi khi gán giáo viên chủ nhiệm hay giáo viên phụ
public record ClassTeacherResponse(Guid UserId, string FullName);
