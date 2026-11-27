namespace NhaTre.Application.DTOs.Classes;

// Quản lý lớp, xếp lớp, gán giáo viên chủ nhiệm và giáo viên phụ có nhiều kiểu thất bại (400 sai tuổi,
// 404, 409 vì nhiều lý do), nên Service trả kết quả kèm lý do để Controller chọn status code và message
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
    NoHomeroomTeacher,
    HomeroomIsAssistant,
    InvalidAssistantTeacher,
    AssistantIsHomeroom,
    // FR-CLASS-03, FR-CLASS-04 (BR-CLASS-05, BR-CLASS-06)
    GradeLevelNotFound,
    DuplicateClassName,
    ClassArchived,
    ChangeGradeWithChildren,
    ArchiveWithChildren,
    MaxCapacityBelowChildCount,
    ClassFull,
    // Khối của lớp đổi giữa lúc Service xét tuổi và lúc xếp
    ClassChanged
}

public record ClassPlacementResult(ClassOutcome Outcome, ClassPlacementResponse? Placement = null);

public record ClassResult(ClassOutcome Outcome, ClassResponse? Class = null);
