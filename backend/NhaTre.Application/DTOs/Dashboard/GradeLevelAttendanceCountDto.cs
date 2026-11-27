namespace NhaTre.Application.DTOs.Dashboard;

// FR-DASH-03, AC-DASH-03: Số liệu lượt điểm danh thô theo từng khối lớp trong kỳ thống kê
// AC-DASH-06, D45: Toàn bộ dữ liệu là số liệu tổng hợp, không có bản ghi chi tiết hay thông tin từng trẻ
public record GradeLevelAttendanceCountDto(
    short GradeLevelId,
    string GradeLevelName,
    short SortOrder,
    int TotalRecords,
    int PresentRecords
);
