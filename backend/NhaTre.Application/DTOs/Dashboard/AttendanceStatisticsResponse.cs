namespace NhaTre.Application.DTOs.Dashboard;

// FR-DASH-03, AC-DASH-03: Thống kê tỷ lệ có mặt theo tháng hiện tại, tách theo 3 lớp (D23, D39 mục 12)
// AC-DASH-06, D40 mục 3, D45: Toàn bộ phản hồi là số liệu tổng hợp, không có dữ liệu mức từng trẻ
public record AttendanceStatisticsResponse(
    int Year,
    int Month,
    int TotalRecords,
    int PresentRecords,
    double OverallAttendanceRate,
    IReadOnlyList<ClassAttendanceDto> Classes
);
