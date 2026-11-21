namespace NhaTre.Application.DTOs.AbsenceFollowUps;

// Một dòng trong danh sách cần xử lý của Admin: chỉ họ tên trẻ, lớp và các lần liên hệ, không có id
// trẻ hay người đón (BR-ATTENDANCE-08, BR-SCOPE-03, AC-ATT-14)
public record AbsenceEscalationResponse(
    string ChildFullName,
    string ClassName,
    IReadOnlyList<AbsenceFollowUpResponse> FollowUps);
