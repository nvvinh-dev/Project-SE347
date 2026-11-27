namespace NhaTre.Application.DTOs.Dashboard;

// FR-DASH-03, AC-DASH-03: Thống kê tỷ lệ có mặt theo từng khối lớp trong tháng hiện tại (D23, D39 mục 12)
// AC-DASH-06, D45: Toàn bộ dữ liệu là số liệu tổng hợp, không có bản ghi chi tiết hay thông tin từng trẻ
public record GradeLevelAttendanceDto(
    short GradeLevelId,
    string GradeLevelName,
    short SortOrder,
    int TotalRecords,
    int PresentRecords,
    double AttendanceRate
);
