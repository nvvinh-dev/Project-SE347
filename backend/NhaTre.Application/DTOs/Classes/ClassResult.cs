namespace NhaTre.Application.DTOs.Classes;

// Xếp lớp và gán giáo viên chủ nhiệm có nhiều kiểu thất bại (400 sai tuổi, 404, 409 vì nhiều lý do),
// nên Service trả kết quả kèm lý do để Controller chọn status code và message
public enum ClassOutcome
{
    Success,
    ChildNotFound,
    ClassNotFound,
    AgeMismatch,
    AlreadyInClass,
    NotInAnyClass,
    ChildChanged,
    UserNotFound,
    NotTeacherRole,
    TeacherInactive,
    NoTeacherProfile,
    AlreadyHomeroom,
    NoHomeroomTeacher
}

public record ClassPlacementResult(ClassOutcome Outcome, ClassPlacementResponse? Placement = null);

public record ClassResult(ClassOutcome Outcome, ClassResponse? Class = null);
