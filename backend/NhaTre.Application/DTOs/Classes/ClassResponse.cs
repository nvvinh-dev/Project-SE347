namespace NhaTre.Application.DTOs.Classes;

// Khoảng tuổi tính theo tháng, nhận trẻ có MinAgeMonths <= tuổi < MaxAgeMonths (BR-CLASS-03)
public record ClassResponse(
    Guid Id,
    string Name,
    int? MinAgeMonths,
    int? MaxAgeMonths,
    HomeroomTeacherResponse? HomeroomTeacher);

// UserId là id tài khoản giáo viên, cùng giá trị Admin gửi khi gán giáo viên chủ nhiệm
public record HomeroomTeacherResponse(Guid UserId, string FullName);
