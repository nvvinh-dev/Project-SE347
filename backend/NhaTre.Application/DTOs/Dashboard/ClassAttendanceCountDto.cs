namespace NhaTre.Application.DTOs.Dashboard;

// FR-DASH-03, AC-DASH-03: Số liệu lượt điểm danh thô theo từng lớp trong kỳ thống kê
// AC-DASH-06, D45: Toàn bộ dữ liệu là số liệu tổng hợp, không có bản ghi chi tiết hay thông tin từng trẻ
public record ClassAttendanceCountDto(
    Guid ClassId,
    string ClassName,
    int? MinAgeMonths,
    int? MaxAgeMonths,
    int TotalRecords,
    int PresentRecords
);
