namespace NhaTre.Application.DTOs.Attendance;

// D39 mục 21: điểm danh cả lớp một lần, mỗi dòng như một lần điểm danh riêng (CheckInRequest)
public record BatchCheckInRequest(IReadOnlyList<CheckInRequest> Items);
