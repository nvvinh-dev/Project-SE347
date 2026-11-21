namespace NhaTre.Application.DTOs.AbsenceFollowUps;

// Một trẻ vắng không phép hôm nay trong danh sách cần liên hệ của giáo viên (D39 mục 20).
// Người đón chỉ có đủ để gọi điện: không có số CCCD hay ảnh khuôn mặt (AC-ATT-12, NFR-SEC-13)
public record AbsenceTodayResponse(
    Guid AttendanceId,
    Guid ChildId,
    string ChildFullName,
    Guid ClassId,
    string ClassName,
    IReadOnlyList<AbsencePickupContactResponse> PickupPersons,
    IReadOnlyList<AbsenceFollowUpResponse> FollowUps);

// priority 1 = người đón chính, 2 = người dự phòng (D24); người đón chính đứng trước
public record AbsencePickupContactResponse(
    short Priority,
    string FullName,
    string Relationship,
    string PhoneNumber);
