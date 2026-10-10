namespace NhaTre.Application.DTOs.Teachers;

// Tạo hồ sơ có hai kiểu thất bại (400, 409), nên Service trả kết quả kèm lý do để Controller chọn
// status code và message
public enum TeacherOutcome
{
    Success,
    InvalidTeacherAccount,
    ProfileExists
}

public record TeacherResult(TeacherOutcome Outcome, TeacherResponse? Teacher = null);
