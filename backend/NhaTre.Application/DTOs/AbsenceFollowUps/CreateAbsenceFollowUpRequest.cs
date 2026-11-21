namespace NhaTre.Application.DTOs.AbsenceFollowUps;

// FR-ATT-04: giáo viên ghi kết quả một lần liên hệ người đón của trẻ vắng không phép (D39 mục 20).
// Bản điểm danh lấy từ route; người ghi và thời điểm do server đặt (D44 mục 2)
public record CreateAbsenceFollowUpRequest(string Outcome, string? Note);
